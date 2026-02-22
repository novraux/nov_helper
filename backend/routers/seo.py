from fastapi import APIRouter

router = APIRouter(prefix="/seo", tags=["seo"])


@router.get("")
def seo_placeholder():
    return {"message": "SEO generator — see /shopify endpoints for Shopify SEO."}
