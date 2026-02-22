from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import List, Dict
from datetime import datetime, timedelta
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
    Rich analytics stats for the Revenue & Profit Dashboard.
    """
    # ── Core totals ───────────────────────────────────────────────────────────
    total_rev    = db.query(func.sum(Order.revenue)).scalar() or 0.0
    total_profit = db.query(func.sum(Order.profit)).scalar() or 0.0
    total_cost   = db.query(func.sum(Order.printful_cost)).scalar() or 0.0
    order_count  = db.query(func.count(Order.id)).scalar() or 0
    avg_margin   = (total_profit / total_rev * 100) if total_rev > 0 else 0.0

    # ── Per-platform breakdown ────────────────────────────────────────────────
    platform_rows = (
        db.query(
            Order.platform,
            func.sum(Order.revenue).label("revenue"),
            func.sum(Order.profit).label("profit"),
            func.count(Order.id).label("orders"),
        )
        .group_by(Order.platform)
        .all()
    )
    platform_breakdown = [
        {
            "platform": r.platform,
            "revenue":  round(r.revenue or 0, 2),
            "profit":   round(r.profit or 0, 2),
            "orders":   r.orders,
            "margin":   round((r.profit / r.revenue * 100) if r.revenue else 0, 1),
        }
        for r in platform_rows
    ]

    # ── Top 5 products by profit ──────────────────────────────────────────────
    top_rows = (
        db.query(
            Order.product_title,
            func.sum(Order.revenue).label("revenue"),
            func.sum(Order.profit).label("profit"),
            func.count(Order.id).label("orders"),
        )
        .group_by(Order.product_title)
        .order_by(func.sum(Order.profit).desc())
        .limit(5)
        .all()
    )
    top_products = [
        {
            "title":   r.product_title or "Unknown",
            "revenue": round(r.revenue or 0, 2),
            "profit":  round(r.profit or 0, 2),
            "orders":  r.orders,
            "margin":  round((r.profit / r.revenue * 100) if r.revenue else 0, 1),
        }
        for r in top_rows
    ]

    # ── Daily timeseries — last 30 days ───────────────────────────────────────
    since = datetime.utcnow() - timedelta(days=29)
    daily_rows = (
        db.query(
            cast(Order.created_at, Date).label("day"),
            func.sum(Order.revenue).label("revenue"),
            func.sum(Order.profit).label("profit"),
        )
        .filter(Order.created_at >= since)
        .group_by(cast(Order.created_at, Date))
        .order_by(cast(Order.created_at, Date))
        .all()
    )
    # Build full 30-day map (fill zeros for missing days)
    day_map: Dict[str, dict] = {}
    for i in range(30):
        d = (since + timedelta(days=i)).strftime("%Y-%m-%d")
        day_map[d] = {"date": d, "revenue": 0.0, "profit": 0.0}
    for r in daily_rows:
        key = str(r.day)
        day_map[key] = {"date": key, "revenue": round(r.revenue or 0, 2), "profit": round(r.profit or 0, 2)}
    daily_timeseries = list(day_map.values())

    return {
        "total_revenue":      round(total_rev, 2),
        "total_profit":       round(total_profit, 2),
        "total_cost":         round(total_cost, 2),
        "order_count":        order_count,
        "avg_margin_percent": round(avg_margin, 1),
        "platform_breakdown": platform_breakdown,
        "top_products":       top_products,
        "daily_timeseries":   daily_timeseries,
    }
