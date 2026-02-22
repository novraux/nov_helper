"""
Shopify Orders service — fetch recent orders.
"""
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from config import settings

SHOPIFY_API_VERSION = "2024-01"

def _shopify_headers() -> dict:
    return {
        "X-Shopify-Access-Token": settings.SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
    }

def _base_url() -> str:
    return f"https://{settings.SHOPIFY_STORE_URL}/admin/api/{SHOPIFY_API_VERSION}"

def fetch_recent_shopify_orders(days: int = 7) -> List[Dict]:
    """
    Fetch orders from Shopify created in the last N days.
    """
    since_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
    
    params = {
        "status": "any",
        "created_at_min": since_date,
        "limit": 250
    }
    
    with httpx.Client(timeout=30) as client:
        response = client.get(
            f"{_base_url()}/orders.json",
            headers=_shopify_headers(),
            params=params
        )
        response.raise_for_status()
        orders = response.json().get("orders", [])
        
        refined_orders = []
        for o in orders:
            # Basic mapping
            for item in o.get("line_items", []):
                refined_orders.append({
                    "platform": "shopify",
                    "external_order_id": str(o["id"]),
                    "product_title": item.get("title"),
                    "variant": item.get("variant_title"),
                    "quantity": item.get("quantity"),
                    "revenue": float(o.get("total_price", 0)),
                    "status": o.get("fulfillment_status") or "unfulfilled",
                    "created_at": o.get("created_at"),
                    "sku": item.get("sku") # Crucial for Printful cost mapping
                })
        return refined_orders
