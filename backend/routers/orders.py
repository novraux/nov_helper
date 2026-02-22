from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from db.database import get_db
from db.models import Order
from services.orders_sync import sync_shopify_orders

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("")
def list_orders(db: Session = Depends(get_db), limit: int = 50):
    """
    Fetch unified orders from the internal database.
    """
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(limit).all()
    return orders

@router.post("/sync")
def trigger_order_sync(db: Session = Depends(get_db)):
    """
    Start a manual sync cycle for orders.
    """
    try:
        new_count = sync_shopify_orders(db)
        return {"status": "success", "new_orders": new_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_order_stats(db: Session = Depends(get_db)):
    """
    Fetch high-level statistics for the dashboard.
    """
    total_rev = db.query(func.sum(Order.revenue)).scalar() or 0.0
    total_profit = db.query(func.sum(Order.profit)).scalar() or 0.0
    order_count = db.query(func.count(Order.id)).scalar() or 0
    
    avg_margin = (total_profit / total_rev * 100) if total_rev > 0 else 0.0
    
    return {
        "total_revenue": round(total_rev, 2),
        "total_profit": round(total_profit, 2),
        "order_count": order_count,
        "avg_margin_percent": round(avg_margin, 1)
    }
