"""
Trends router — REST API for the trend research engine.
Enhanced with smart caching, temporal detection, and cost optimization.
"""
from fastapi import APIRouter, Depends, Query, Request
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
from typing import Optional
import asyncio
from db.database import get_db
from db.models import Trend
from services.scrapers.google_trends import scrape_google_trends, scrape_google_trends_enhanced
from services.scrapers.tiktok_trends import get_all_tiktok_trends
from services.scrapers.pinterest_trends import get_all_pinterest_trends
from services.scrapers.redbubble_trends import scrape_redbubble_popular_tags
from services.ai.groq_client import score_trend
from services.ai.claude_client import deep_analyze
from services.helpers.temporal_detector import detect_temporal_tags, detect_urgency, assign_emoji_tag
from services.helpers.blacklist import is_blacklisted, filter_blacklisted_keywords
from pydantic import BaseModel
from datetime import datetime, timedelta
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

    # Enhanced fields
    last_scraped_at: Optional[datetime] = None
    scrape_count: int = 1
    last_scored_at: Optional[datetime] = None
    last_analyzed_at: Optional[datetime] = None
    days_trending: int = 0
    trend_velocity: Optional[str] = None
    peak_score: Optional[float] = None
    peak_date: Optional[datetime] = None
    avg_interest: Optional[int] = None
    interest_peak: Optional[int] = None
    interest_delta: Optional[float] = None
    temporal_tags: Optional[list] = None
    emoji_tag: Optional[str] = None
    urgency: Optional[str] = None
    scoring_cost: float = 0.0
    analysis_cost: float = 0.0
    total_api_cost: float = 0.0
    validation_status: Optional[str] = None
    archived: bool = False

    class Config:
        from_attributes = True


# === Smart Caching Functions ===

def should_rescore(trend: Trend) -> bool:
    """
    Determine if a trend should be rescored based on caching rules.
    Returns True if we should score it, False if we should skip (cache hit).
    """
    # Never scored? Score it
    if trend.last_scored_at is None:
        return True

    # Scored within last 48h? Skip (cache hit)
    hours_since_score = (datetime.utcnow() - trend.last_scored_at).total_seconds() / 3600
    if hours_since_score < 48:
        print(f"[Cache] ✓ Skipping '{trend.keyword}' - scored {hours_since_score:.1f}h ago")
        return False

    # High-value trend (7+) and scored within last week? Skip
    if trend.score_groq and trend.score_groq >= 7 and hours_since_score < 168:  # 1 week
        print(f"[Cache] ✓ Skipping high-value '{trend.keyword}' - scored recently")
        return False

    return True


def should_deep_analyze(trend: Trend) -> bool:
    """
    Determine if a trend should get Claude deep analysis.
    More restrictive than before to save costs.
    """
    # Must have high score
    if not trend.score_groq or trend.score_groq < 7:
        return False

    # Skip if interest is too low (even if score is high)
    if trend.avg_interest and trend.avg_interest < 40:
        print(f"[Claude] ✗ Skipping '{trend.keyword}' - low interest ({trend.avg_interest})")
        return False

    # Already analyzed? Only re-analyze if:
    # 1. Never analyzed, OR
    # 2. More than 30 days since last analysis AND still high interest
    if trend.deep_analysis and trend.last_analyzed_at:
        days_since = (datetime.utcnow() - trend.last_analyzed_at).days

        # Only re-analyze if it's been 30+ days AND interest is still high
        if days_since < 30:
            print(f"[Claude] ✓ Skipping '{trend.keyword}' - analyzed {days_since}d ago")
            return False

        if trend.avg_interest and trend.avg_interest < 50:
            print(f"[Claude] ✗ Skipping '{trend.keyword}' - interest dropped to {trend.avg_interest}")
            return False

    return True


async def run_scrape_and_score_stream(db: Session, request: Request):
    """
    Enhanced scraper with smart caching, interest metrics, and cost optimization.
    Async generator: scrape → filter → cache check → score → analyze → save.
    """
    try:
        yield {"event": "progress", "data": json.dumps({"status": "🚀 Started scraping trends...", "progress": 5})}
        await asyncio.sleep(0.1)

        print("[Pipeline] Starting enhanced trend scrape...")
        loop = asyncio.get_event_loop()

        # Run scrapers concurrently (use enhanced Google scraper)
        yield {"event": "progress", "data": json.dumps({"status": "Fetching from multiple sources...", "progress": 10})}

        scrapers = [
            loop.run_in_executor(None, scrape_google_trends_enhanced),
            loop.run_in_executor(None, get_all_tiktok_trends),
            loop.run_in_executor(None, get_all_pinterest_trends),
            loop.run_in_executor(None, scrape_redbubble_popular_tags)
        ]

        results = await asyncio.gather(*scrapers, return_exceptions=True)

        google_data = results[0] if not isinstance(results[0], Exception) else []
        tiktok_keywords = results[1] if not isinstance(results[1], Exception) else []
        pinterest_keywords = results[2] if not isinstance(results[2], Exception) else []
        redbubble_keywords = results[3] if not isinstance(results[3], Exception) else []

        # Combine all keywords with their metadata
        all_keywords_data = []

        # Google data already has interest metrics
        for item in google_data:
            all_keywords_data.append(item)

        # Other sources need basic structure
        for kw in tiktok_keywords:
            all_keywords_data.append({"keyword": kw, "source": "tiktok"})
        for kw in pinterest_keywords:
            all_keywords_data.append({"keyword": kw, "source": "pinterest"})
        for kw in redbubble_keywords:
            all_keywords_data.append({"keyword": kw, "source": "redbubble"})

        if not all_keywords_data:
            print("[Pipeline] No keywords returned from scrapers.")
            yield {"event": "progress", "data": json.dumps({"status": "Failed to fetch keywords.", "progress": 100})}
            return

        yield {"event": "progress", "data": json.dumps({"status": "🔍 Filtering and deduplicating...", "progress": 25})}

        # Filter blacklisted keywords
        keywords_only = [item["keyword"] for item in all_keywords_data]
        clean_keywords, blocked = filter_blacklisted_keywords(keywords_only)

        if blocked:
            print(f"[Blacklist] Filtered {len(blocked)} blacklisted keywords: {[b['keyword'] for b in blocked]}")
            yield {"event": "progress", "data": json.dumps({
                "status": f"🚫 Filtered {len(blocked)} blacklisted keywords",
                "progress": 28
            })}

        # Keep only non-blacklisted data
        all_keywords_data = [item for item in all_keywords_data if item["keyword"] in clean_keywords]

        yield {"event": "progress", "data": json.dumps({"status": f"💾 Checking cache for {len(all_keywords_data)} keywords...", "progress": 30})}

        # Process trends: check cache, update metadata
        trends_to_score = []
        trends_cached = []

        for kw_data in all_keywords_data[:30]:  # Process more since we're filtering
            keyword = kw_data["keyword"]

            # Check if already exists in DB
            existing = db.query(Trend).filter(Trend.keyword == keyword).first()

            if existing:
                # Update last_scraped_at and scrape_count
                existing.last_scraped_at = datetime.utcnow()
                existing.scrape_count = (existing.scrape_count or 0) + 1

                # Calculate days trending
                if existing.created_at:
                    existing.days_trending = (datetime.utcnow() - existing.created_at).days

                # Update interest metrics if available
                if "avg_interest" in kw_data and kw_data["avg_interest"] is not None:
                    old_interest = existing.avg_interest or 0
                    new_interest = kw_data["avg_interest"]
                    existing.interest_delta = ((new_interest - old_interest) / old_interest * 100) if old_interest > 0 else 0
                    existing.avg_interest = new_interest
                    existing.interest_peak = kw_data.get("interest_peak")
                    existing.trend_velocity = kw_data.get("trend_direction", "stable")

                # Update temporal tags
                existing.temporal_tags = detect_temporal_tags(keyword, datetime.utcnow(), existing.scrape_count)
                existing.urgency = detect_urgency(
                    existing.temporal_tags or [],
                    existing.avg_interest or 0,
                    existing.trend_velocity or "stable"
                )

                if not existing.emoji_tag:
                    existing.emoji_tag = assign_emoji_tag(keyword, existing.temporal_tags or [])

                # Check if should rescore
                if should_rescore(existing):
                    trends_to_score.append((existing, kw_data))
                else:
                    trends_cached.append(existing)
            else:
                # New trend - always score
                new_trend = Trend(
                    keyword=keyword,
                    source=kw_data.get("source", "unknown"),
                    last_scraped_at=datetime.utcnow(),
                    scrape_count=1,
                    days_trending=0,
                    avg_interest=kw_data.get("avg_interest"),
                    interest_peak=kw_data.get("interest_peak"),
                    interest_delta=kw_data.get("interest_delta", 0),
                    trend_velocity=kw_data.get("trend_direction", "stable"),
                )
                new_trend.temporal_tags = detect_temporal_tags(keyword, datetime.utcnow(), 1)
                new_trend.emoji_tag = assign_emoji_tag(keyword, new_trend.temporal_tags or [])
                new_trend.urgency = detect_urgency(
                    new_trend.temporal_tags or [],
                    new_trend.avg_interest or 0,
                    new_trend.trend_velocity or "stable"
                )

                db.add(new_trend)
                db.flush()  # Get ID
                trends_to_score.append((new_trend, kw_data))

        db.commit()

        # Report caching savings
        cache_rate = (len(trends_cached) / (len(trends_cached) + len(trends_to_score)) * 100) if (len(trends_cached) + len(trends_to_score)) > 0 else 0
        yield {"event": "progress", "data": json.dumps({
            "status": f"💰 Cache hit: {len(trends_cached)} | Scoring: {len(trends_to_score)} ({cache_rate:.0f}% saved)",
            "progress": 40
        })}
        print(f"[Cache] Hit rate: {cache_rate:.0f}% - Saved {len(trends_cached)} API calls")

        # Score only non-cached trends
        for i, (trend, kw_data) in enumerate(trends_to_score):
            res = await loop.run_in_executor(None, score_trend, trend.keyword)
            if res:
                trend.score_groq = res.get("score")
                trend.pod_viability = res.get("pod_viability")
                trend.competition_level = res.get("competition_level")
                trend.ip_safe = res.get("ip_safe")
                trend.product_suggestions = res.get("product_suggestions", [])
                trend.score_reasoning = res.get("reasoning")
                trend.last_scored_at = datetime.utcnow()
                trend.scoring_cost = 0.0  # Groq is free

                # Track peak score
                if not trend.peak_score or trend.score_groq and trend.score_groq > (trend.peak_score or 0):
                    trend.peak_score = trend.score_groq
                    trend.peak_date = datetime.utcnow()

                prog = 40 + int((i / max(len(trends_to_score), 1)) * 35)
                model = res.get("model_used", "Groq")
                yield {"event": "progress", "data": json.dumps({
                    "status": f"✓ Scored '{trend.keyword[:30]}' → {trend.score_groq}/10 [{model}]",
                    "progress": prog
                })}

        db.commit()
        print(f"[Pipeline] Scored {len(trends_to_score)} trends, cached {len(trends_cached)}")

        yield {"event": "progress", "data": json.dumps({"status": "🤖 Checking for deep analysis candidates...", "progress": 80})}

        # Deep analyze only high-value, not-recently-analyzed trends
        candidates = [t for t, _ in trends_to_score if should_deep_analyze(t)]

        yield {"event": "progress", "data": json.dumps({
            "status": f"🧠 Claude analyzing {len(candidates[:3])} high-value trends...",
            "progress": 85
        })}

        for i, trend in enumerate(candidates[:3]):  # Limit to 3 per run to control costs
            if await request.is_disconnected():
                print("[Pipeline] Client disconnected.")
                return

            print(f"[Claude] Deep analyzing: {trend.keyword}")
            try:
                analysis = await loop.run_in_executor(
                    None, deep_analyze, trend.keyword, trend.score_groq, trend.product_suggestions or []
                )
                trend.deep_analysis = analysis["deep_analysis"]
                trend.design_brief = analysis["design_brief"]
                trend.target_audience = analysis["target_audience"]
                trend.last_analyzed_at = datetime.utcnow()
                trend.analysis_cost = 0.02  # Estimate ~$0.02 per Claude call
                trend.total_api_cost = trend.scoring_cost + trend.analysis_cost
                db.commit()

                yield {"event": "progress", "data": json.dumps({
                    "status": f"✓ Analyzed '{trend.keyword}' (${trend.analysis_cost:.2f})",
                    "progress": 85 + (i * 5)
                })}
            except Exception as e:
                print(f"[Claude] Error analyzing {trend.keyword}: {e}")

        # Final summary
        total_cost = sum(t.total_api_cost or 0 for t, _ in trends_to_score)
        print(f"[Pipeline] Complete! Cost: ${total_cost:.3f}, Cached: {len(trends_cached)}")

        yield {"event": "complete", "data": json.dumps({
            "status": f"✅ Complete! Scored: {len(trends_to_score)}, Cached: {len(trends_cached)}, Analyzed: {len(candidates[:3])}, Cost: ${total_cost:.3f}",
            "progress": 100
        })}

    except asyncio.CancelledError:
        print("[Pipeline] Stream cancelled.")
    except Exception as e:
        print(f"[Pipeline] Error: {e}")
        import traceback
        traceback.print_exc()
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


@router.delete("/all")
def delete_all_trends(db: Session = Depends(get_db)):
    """Delete all trends from the database. Used before a fresh scrape."""
    count = db.query(Trend).count()
    db.query(Trend).delete()
    db.commit()
    print(f"[Trends Router] Deleted {count} trends for fresh scrape")
    return {"deleted": count}


@router.post("/scrape-batch")
async def trigger_scrape_batch(db: Session = Depends(get_db)):
    """
    Non-streaming batch scrape endpoint designed for n8n scheduled calls.
    Runs the full scraper pipeline and returns a JSON summary.
    Safe for HTTP nodes (no SSE), ideal for cron triggers.
    """
    from datetime import datetime
    import asyncio

    loop = asyncio.get_event_loop()
    started_at = datetime.utcnow()

    try:
        # Run all scrapers concurrently
        scrapers = [
            loop.run_in_executor(None, scrape_google_trends_enhanced),
            loop.run_in_executor(None, get_all_tiktok_trends),
            loop.run_in_executor(None, get_all_pinterest_trends),
            loop.run_in_executor(None, scrape_redbubble_popular_tags),
        ]
        results = await asyncio.gather(*scrapers, return_exceptions=True)

        google_data    = results[0] if not isinstance(results[0], Exception) else []
        tiktok_kws     = results[1] if not isinstance(results[1], Exception) else []
        pinterest_kws  = results[2] if not isinstance(results[2], Exception) else []
        redbubble_kws  = results[3] if not isinstance(results[3], Exception) else []

        all_kw_data = list(google_data)
        for kw in tiktok_kws:    all_kw_data.append({"keyword": kw, "source": "tiktok"})
        for kw in pinterest_kws:  all_kw_data.append({"keyword": kw, "source": "pinterest"})
        for kw in redbubble_kws:  all_kw_data.append({"keyword": kw, "source": "redbubble"})

        # Filter blacklisted + deduplicate
        keywords_only = [item["keyword"] for item in all_kw_data]
        clean_keywords, blocked = filter_blacklisted_keywords(keywords_only)
        all_kw_data = [item for item in all_kw_data if item["keyword"] in clean_keywords]

        scored_count = 0
        cached_count = 0
        new_count = 0
        total_cost = 0.0
        top_trends = []

        for kw_data in all_kw_data[:30]:
            keyword = kw_data["keyword"]
            existing = db.query(Trend).filter(Trend.keyword == keyword).first()

            if existing:
                existing.last_scraped_at = datetime.utcnow()
                existing.scrape_count = (existing.scrape_count or 0) + 1
                if existing.created_at:
                    existing.days_trending = (datetime.utcnow() - existing.created_at).days

                if should_rescore(existing):
                    res = await loop.run_in_executor(None, score_trend, existing.keyword)
                    if res:
                        existing.score_groq        = res.get("score")
                        existing.pod_viability     = res.get("pod_viability")
                        existing.competition_level = res.get("competition_level")
                        existing.ip_safe           = res.get("ip_safe")
                        existing.product_suggestions = res.get("product_suggestions", [])
                        existing.score_reasoning   = res.get("reasoning")
                        existing.last_scored_at    = datetime.utcnow()
                        scored_count += 1
                else:
                    cached_count += 1
            else:
                new_trend = Trend(
                    keyword=keyword,
                    source=kw_data.get("source", "unknown"),
                    last_scraped_at=datetime.utcnow(),
                    scrape_count=1,
                )
                db.add(new_trend)
                db.flush()

                res = await loop.run_in_executor(None, score_trend, keyword)
                if res:
                    new_trend.score_groq        = res.get("score")
                    new_trend.pod_viability     = res.get("pod_viability")
                    new_trend.competition_level = res.get("competition_level")
                    new_trend.ip_safe           = res.get("ip_safe")
                    new_trend.product_suggestions = res.get("product_suggestions", [])
                    new_trend.score_reasoning   = res.get("reasoning")
                    new_trend.last_scored_at    = datetime.utcnow()
                    scored_count += 1
                    new_count += 1

        db.commit()

        # Fetch top 5 for digest summary
        top = (
            db.query(Trend)
            .filter(Trend.score_groq >= 7)
            .order_by(Trend.score_groq.desc())
            .limit(5)
            .all()
        )
        top_trends = [{"keyword": t.keyword, "score": t.score_groq, "source": t.source} for t in top]

        duration_s = (datetime.utcnow() - started_at).total_seconds()

        return {
            "status": "success",
            "run_at": started_at.isoformat(),
            "duration_seconds": round(duration_s, 1),
            "scraped_total":   len(all_kw_data),
            "new_keywords":    new_count,
            "scored":          scored_count,
            "cached":          cached_count,
            "blocked":         len(blocked),
            "total_api_cost":  round(total_cost, 4),
            "top_trends":      top_trends,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e), "run_at": started_at.isoformat()}
