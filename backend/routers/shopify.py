"""
Shopify router — fetch products, generate SEO, preview and push updates.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import Optional
import uuid
from pydantic import BaseModel
from services.shopify import get_products, get_product, update_product_seo
from services.ai.seo_generator import generate_seo, bulk_generate_seo

router = APIRouter(prefix="/shopify", tags=["shopify"])


# ─── Request / Response Models ────────────────────────────────────

class SEOPreview(BaseModel):
    product_id: int
    title: str
    seo_title: Optional[str] = None
    meta_description: Optional[str] = None
    product_description: Optional[str] = None
    tags: Optional[list[str]] = None
    seo_score: Optional[int] = None
    seo_notes: Optional[str] = None
    model_used: Optional[str] = None
    error: Optional[str] = None


class PushSEORequest(BaseModel):
    product_id: int
    seo_title: str
    meta_description: str
    tags: Optional[list[str]] = None
    product_description: Optional[str] = None


class BulkSEORequest(BaseModel):
    product_ids: Optional[list[int]] = None   # None = all products
    use_smart_model: bool = False              # True = Tier 2 (llama-3.3-70b)
    auto_push: bool = False                    # True = push without preview step


# ─── Product Endpoints ────────────────────────────────────────────

@router.get("/products")
def list_products(
    limit: int = Query(50, le=250),
    page_info: Optional[str] = Query(None),
):
    """Fetch all products from the Shopify store."""
    try:
        return get_products(limit=limit, page_info=page_info)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Shopify API error: {e}")


@router.get("/products/{product_id}")
def get_single_product(product_id: int):
    """Fetch a single product by ID."""
    try:
        return get_product(product_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Shopify API error: {e}")


# ─── SEO Generation ───────────────────────────────────────────────

@router.post("/products/{product_id}/generate-seo", response_model=SEOPreview)
def generate_product_seo(
    product_id: int,
    use_smart_model: bool = Query(False),
):
    """
    AI-generate SEO for a single product. Returns PREVIEW only — does NOT push yet.
    Review the result, then call POST /shopify/products/push-seo to apply.
    """
    try:
        product = get_product(product_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Shopify API error: {e}")

    seo = generate_seo(
        title=product.get("title", ""),
        description=product.get("body_html", ""),
        platform="shopify",
        use_smart_model=use_smart_model,
    )

    if "error" in seo:
        return SEOPreview(product_id=product_id, title=product.get("title", ""), error=seo["error"])

    return SEOPreview(
        product_id=product_id,
        title=product.get("title", ""),
        seo_title=seo.get("seo_title"),
        meta_description=seo.get("meta_description"),
        product_description=seo.get("product_description"),
        tags=seo.get("tags"),
        seo_score=seo.get("seo_score"),
        seo_notes=seo.get("seo_notes"),
        model_used=seo.get("model_used"),
    )


@router.post("/products/push-seo")
def push_seo_to_shopify(body: PushSEORequest):
    """Push approved SEO changes to Shopify for a single product."""
    try:
        updated = update_product_seo(
            product_id=body.product_id,
            seo_title=body.seo_title,
            seo_description=body.meta_description,
            new_tags=body.tags,
            new_body_html=body.product_description,
        )
        return {
            "status": "pushed",
            "product_id": body.product_id,
            "handle": updated.get("handle"),
            "title": updated.get("title"),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Shopify push failed: {e}")


# ─── Bulk SEO ─────────────────────────────────────────────────────

_bulk_jobs: dict[str, list] = {}


def _run_bulk_seo(job_id: str, product_ids: Optional[list[int]], use_smart_model: bool, auto_push: bool):
    _bulk_jobs[job_id] = []
    try:
        if product_ids:
            products = [get_product(pid) for pid in product_ids]
        else:
            result = get_products(limit=250)
            products = result["products"]

        results = bulk_generate_seo(products, use_smart_model=use_smart_model)

        for item in results:
            if auto_push and "error" not in item.get("seo", {}):
                seo = item["seo"]
                try:
                    update_product_seo(
                        product_id=item["product_id"],
                        seo_title=seo.get("seo_title", item["title"]),
                        seo_description=seo.get("meta_description", ""),
                        new_tags=seo.get("tags"),
                    )
                    item["pushed"] = True
                except Exception as e:
                    item["push_error"] = str(e)
            _bulk_jobs[job_id].append(item)
    except Exception as e:
        _bulk_jobs[job_id] = [{"error": str(e)}]


@router.post("/products/bulk-seo")
def start_bulk_seo(body: BulkSEORequest, background_tasks: BackgroundTasks):
    """
    Start bulk SEO generation for multiple (or all) products in background.
    Poll GET /shopify/bulk-seo/{job_id} for results.
    Set auto_push=True to push directly (no review step).
    """
    job_id = str(uuid.uuid4())[:8]
    background_tasks.add_task(_run_bulk_seo, job_id, body.product_ids, body.use_smart_model, body.auto_push)
    return {"status": "started", "job_id": job_id}


@router.get("/bulk-seo/{job_id}")
def get_bulk_seo_results(job_id: str):
    """Poll bulk SEO job results."""
    if job_id not in _bulk_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job_id, "count": len(_bulk_jobs[job_id]), "results": _bulk_jobs[job_id]}
