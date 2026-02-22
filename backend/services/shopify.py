"""
Shopify service — fetch products, push SEO updates.
Uses the Shopify Admin REST API v2024-01.
"""
import httpx
from typing import Optional
from config import settings

# --- Shopify REST client setup ---
SHOPIFY_API_VERSION = "2024-01"


def _shopify_headers() -> dict:
    return {
        "X-Shopify-Access-Token": settings.SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
    }


def _base_url() -> str:
    return f"https://{settings.SHOPIFY_STORE_URL}/admin/api/{SHOPIFY_API_VERSION}"


def get_products(limit: int = 50, page_info: Optional[str] = None) -> dict:
    """
    Fetch products from the Shopify store.
    Returns {"products": [...], "next_page_info": str|None}
    """
    params = {
        "limit": min(limit, 250),
        "fields": "id,title,body_html,handle,tags,variants,images,metafields_global_title_tag,metafields_global_description_tag",
    }
    if page_info:
        params["page_info"] = page_info

    with httpx.Client(timeout=30) as client:
        response = client.get(
            f"{_base_url()}/products.json",
            headers=_shopify_headers(),
            params=params,
        )
        response.raise_for_status()
        data = response.json()

        # Extract next page cursor from Link header
        next_page_info = None
        link_header = response.headers.get("Link", "")
        if 'rel="next"' in link_header:
            for part in link_header.split(","):
                if 'rel="next"' in part:
                    # Extract page_info from URL
                    url_part = part.split(";")[0].strip().strip("<>")
                    for param in url_part.split("?")[1].split("&"):
                        if param.startswith("page_info="):
                            next_page_info = param.split("=")[1]

        return {
            "products": data.get("products", []),
            "next_page_info": next_page_info,
        }


def get_product(product_id: int) -> dict:
    """Fetch a single product by ID."""
    with httpx.Client(timeout=30) as client:
        response = client.get(
            f"{_base_url()}/products/{product_id}.json",
            headers=_shopify_headers(),
        )
        response.raise_for_status()
        return response.json().get("product", {})


def update_product_seo(
    product_id: int,
    seo_title: str,
    seo_description: str,
    new_tags: Optional[list[str]] = None,
    new_body_html: Optional[str] = None,
) -> dict:
    """
    Push SEO updates to a Shopify product.
    Updates: SEO title, meta description, tags, and optionally body HTML.
    """
    payload: dict = {
        "product": {
            "id": product_id,
            "metafields_global_title_tag": seo_title[:255],       # Shopify limit
            "metafields_global_description_tag": seo_description[:320],  # SEO best practice
        }
    }

    if new_tags is not None:
        payload["product"]["tags"] = ", ".join(new_tags)

    if new_body_html is not None:
        payload["product"]["body_html"] = new_body_html

    with httpx.Client(timeout=30) as client:
        response = client.put(
            f"{_base_url()}/products/{product_id}.json",
            headers=_shopify_headers(),
            json=payload,
        )
        response.raise_for_status()
        return response.json().get("product", {})
