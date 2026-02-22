"""
Order Sync logic — orchestration of Shopify + Printful to update the DB.
"""
from sqlalchemy.orm import Session
from datetime import datetime
from db.models import Order
from services.shopify_orders import fetch_recent_shopify_orders
from services.printful import get_printful_order_cost, get_product_cost_by_sku

def sync_shopify_orders(db: Session):
    """
    Sync recent Shopify orders to the internal database and reconcile costs.
    """
    print("[Orders Sync] Fetching recent orders from Shopify...")
    raw_orders = fetch_recent_shopify_orders(days=7)
    sync_count = 0
    
    for raw in raw_orders:
        # Check if order already exists
        existing = db.query(Order).filter(Order.external_order_id == raw["external_order_id"]).first()
        
        # Calculate cost
        pf_cost = get_printful_order_cost(raw["external_order_id"])
        if pf_cost == 0.0:
            # Fallback to SKU-based estimation if order not in Printful yet
            pf_cost = get_product_cost_by_sku(raw["sku"])
        
        # Simple profit calculation: Revenue - Printful Cost - Platform Fee (estimated 2%)
        platform_fee = raw["revenue"] * 0.02
        profit = raw["revenue"] - pf_cost - platform_fee
        
        if existing:
            # Update status and profit
            existing.status = raw["status"]
            existing.profit = profit
            existing.printful_cost = pf_cost
        else:
            # Create new record
            new_order = Order(
                platform="shopify",
                external_order_id=raw["external_order_id"],
                product_title=raw["product_title"],
                variant=raw["variant"],
                quantity=raw["quantity"],
                revenue=raw["revenue"],
                printful_cost=pf_cost,
                profit=profit,
                status=raw["status"],
                created_at=datetime.fromisoformat(raw["created_at"].replace("Z", "+00:00"))
            )
            db.add(new_order)
            sync_count += 1
            
    db.commit()
    print(f"[Orders Sync] Finished. Synced {sync_count} new orders.")
    return sync_count
