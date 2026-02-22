"""
Trends router — REST API for the trend research engine.
"""
from fastapi import APIRouter, Depends, Query, Request
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
from typing import Optional
import asyncio
from db.database import get_db
from db.models import Trend
from services.scrapers.google_trends import scrape_google_trends
from services.scrapers.tiktok_trends import get_all_tiktok_trends
from services.scrapers.pinterest_trends import get_all_pinterest_trends
from services.scrapers.redbubble_trends import scrape_redbubble_popular_tags
from services.ai.groq_client import score_trend
from services.ai.claude_client import deep_analyze
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter(prefix="/trends", tags=["trends"])


class TrendOut(BaseModel):
    id: int
    keyword: str
    source: str
    score_groq: Optional[float]
    pod_viability: Optional[float]
    competition_level: Optional[str]
    ip_safe: Optional[bool]
    product_suggestions: Optional[list]
    score_reasoning: Optional[str]
    design_brief: Optional[str]
    target_audience: Optional[str]
    deep_analysis: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


async def run_scrape_and_score_stream(db: Session, request: Request):
    """Async generator: scrape → score → deep analyze → save. Yields SSE progress."""
    try:
        yield {"event": "progress", "data": json.dumps({"status": "Started scraping trends...", "progress": 5})}
        await asyncio.sleep(0.1)

        print("[Pipeline] Starting trend scrape...")

        # Run scrapers concurrently
        loop = asyncio.get_event_loop()
        yield {"event": "progress", "data": json.dumps({"status": "Fetching from Google, TikTok, Pinterest, Redbubble...", "progress": 10})}

        scrapers = [
            loop.run_in_executor(None, scrape_google_trends),
            loop.run_in_executor(None, get_all_tiktok_trends),
            loop.run_in_executor(None, get_all_pinterest_trends),
            loop.run_in_executor(None, scrape_redbubble_popular_tags)
        ]
        
        results = await asyncio.gather(*scrapers, return_exceptions=True)
        
        google_keywords = results[0] if not isinstance(results[0], Exception) else []
        tiktok_keywords = results[1] if not isinstance(results[1], Exception) else []
        pinterest_keywords = results[2] if not isinstance(results[2], Exception) else []
        redbubble_keywords = results[3] if not isinstance(results[3], Exception) else []

        yield {"event": "progress", "data": json.dumps({"status": "Aggregating and deduplicating keywords...", "progress": 30})}
        await asyncio.sleep(0.1)

        # Combine and track sources
        keyword_map = {} # keyword -> source
        for k in google_keywords:
            keyword_map[k] = "google"
        for k in tiktok_keywords:
            if k not in keyword_map:
                keyword_map[k] = "tiktok"
        for k in pinterest_keywords:
            if k not in keyword_map:
                keyword_map[k] = "pinterest"
        for k in redbubble_keywords:
            if k not in keyword_map:
                keyword_map[k] = "redbubble"

        all_keywords = list(keyword_map.keys())

        if not all_keywords:
            print("[Pipeline] No keywords returned from scrapers.")
            yield {"event": "progress", "data": json.dumps({"status": "Failed to fetch keywords.", "progress": 100})}
            return

        yield {"event": "progress", "data": json.dumps({"status": f"Scoring {min(len(all_keywords), 20)} keywords...", "progress": 40})}
        print(f"[Pipeline] Scoring {min(len(all_keywords), 20)} keywords...")
        
        scored = []
        for i, kw in enumerate(all_keywords[:20]):
            res = await loop.run_in_executor(None, score_trend, kw)
            if res:
                res["keyword"] = kw
                scored.append(res)
                model = res.get("model_used", "Groq")
                prog = 40 + int((i / 20) * 30)
                yield {"event": "progress", "data": json.dumps({"status": f"Scored '{kw}' [{model}]", "progress": prog})}

        yield {"event": "progress", "data": json.dumps({"status": "Saving scores to database...", "progress": 70})}

        for item in scored:
            kw = item["keyword"]
            source = keyword_map.get(kw, "unknown")
            
            # Check if trend already exists
            existing = db.query(Trend).filter(Trend.keyword == kw).first()
            if existing:
                # Update score and source
                existing.score_groq = item.get("score")
                existing.pod_viability = item.get("pod_viability")
                existing.competition_level = item.get("competition_level")
                existing.ip_safe = item.get("ip_safe")
                existing.product_suggestions = item.get("product_suggestions", [])
                existing.score_reasoning = item.get("reasoning")
                existing.source = source
            else:
                trend = Trend(
                    keyword=kw,
                    source=source,
                    score_groq=item.get("score"),
                    pod_viability=item.get("pod_viability"),
                    competition_level=item.get("competition_level"),
                    ip_safe=item.get("ip_safe"),
                    product_suggestions=item.get("product_suggestions", []),
                    score_reasoning=item.get("reasoning"),
                )
                db.add(trend)

        db.commit()
        print(f"[Pipeline] Saved {len(scored)} trends to DB.")

        yield {"event": "progress", "data": json.dumps({"status": "Deep analyzing top trends...", "progress": 85})}

        # Deep analyze top trends (7+) that don't have analysis yet
        top_trends = (
            db.query(Trend)
            .filter(Trend.score_groq >= 7, Trend.deep_analysis == None)  # noqa: E711
            .limit(5)
            .all()
        )

        for i, trend in enumerate(top_trends):
            if await request.is_disconnected():
                print("[Pipeline] Client disconnected.")
                return

            print(f"[Pipeline] Deep analyzing: {trend.keyword}")
            try:
                analysis = await loop.run_in_executor(None, deep_analyze, trend.keyword, trend.score_groq, trend.product_suggestions or [])
                trend.deep_analysis = analysis["deep_analysis"]
                trend.design_brief = analysis["design_brief"]
                trend.target_audience = analysis["target_audience"]
                db.commit()
            except Exception as e:
                print(f"Error analyzing {trend.keyword}: {e}")

        # Final commit and success
        print("[Pipeline] Done.")
        yield {"event": "complete", "data": json.dumps({"status": "Complete", "progress": 100})}

    except asyncio.CancelledError:
        print("[Pipeline] Stream cancelled.")
    except Exception as e:
        print(f"[Pipeline] Error pipeline: {e}")
        yield {"event": "error", "data": json.dumps({"status": f"Error: {e}", "progress": 100})}


@router.get("", response_model=list[TrendOut])
def get_trends(
    min_score: float = Query(0, ge=0, le=10),
    source: Optional[str] = Query(None),
    ip_safe: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """Get all scored trends, optionally filtered."""
    query = db.query(Trend)
    if min_score > 0:
        query = query.filter(Trend.score_groq >= min_score)
    if source:
        query = query.filter(Trend.source == source)
    if ip_safe is not None:
        query = query.filter(Trend.ip_safe == ip_safe)
    return query.order_by(Trend.score_groq.desc()).limit(limit).all()


@router.get("/scrape")
def trigger_scrape(request: Request, db: Session = Depends(get_db)):
    """Trigger a scrape + score cycle and stream progress via SSE."""
    return EventSourceResponse(run_scrape_and_score_stream(db, request))


@router.get("/{trend_id}", response_model=TrendOut)
def get_trend(trend_id: int, db: Session = Depends(get_db)):
    """Get a single trend with full AI analysis."""
    trend = db.query(Trend).filter(Trend.id == trend_id).first()
    if not trend:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Trend not found")
    return trend
