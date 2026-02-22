"""
Printful API service — fetch fulfillment costs.
"""
import httpx
import os
from typing import Optional, Dict

PRINTFUL_API_URL = "https://api.printful.com"
PRINTFUL_API_KEY = os.getenv("PRINTFUL_API_KEY")

def _headers() -> dict:
    return {
        "Authorization": f"Bearer {PRINTFUL_API_KEY}",
        "Content-Type": "application/json",
    }

def get_printful_order_cost(external_order_id: str) -> float:
    """
    Fetch the cost for an order from Printful using the external_id.
    Note: Requires the order to be synced to Printful.
    """
    if not PRINTFUL_API_KEY:
        return 0.0
        
    try:
        with httpx.Client(timeout=30) as client:
            # Search for order by external ID
            response = client.get(
                f"{PRINTFUL_API_URL}/orders/@{external_order_id}",
                headers=_headers()
            )
            if response.status_code == 200:
                data = response.json().get("result", {})
                # 'costs' usually contains 'subtotal', 'shipping', 'tax', 'total'
                return float(data.get("costs", {}).get("total", 0.0))
            
            # If search by @ID fails, try listing and filtering
            return 0.0
    except Exception as e:
        print(f"[Printful Service] Error fetching cost for {external_order_id}: {e}")
        return 0.0

def get_product_cost_by_sku(sku: str) -> float:
    """
    Estimate cost based on SKU (Variant ID in Printful).
    """
    if not PRINTFUL_API_KEY or not sku:
        return 0.0
        
    try:
        # SKUs in Novraux are often 'pf-<variant_id>'
        variant_id = sku.replace("pf-", "")
        with httpx.Client(timeout=30) as client:
            response = client.get(
                f"{PRINTFUL_API_URL}/products/variant/{variant_id}",
                headers=_headers()
            )
            if response.status_code == 200:
                return float(response.json().get("result", {}).get("variant", {}).get("price", 0.0))
            return 0.0
    except Exception as e:
        print(f"[Printful Service] Error fetching SKU cost for {sku}: {e}")
        return 0.0
