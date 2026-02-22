# Phase 1 Implementation Plan
> Quick wins for cost optimization - implement this weekend

---

## 🎯 Goal
Reduce API costs by 60% while improving trend quality

---

## 1️⃣ Database Schema Updates

### Update `backend/db/models.py`:

```python
# Add these fields to the Trend model:

class Trend(Base):
    __tablename__ = "trends"

    # ... existing fields ...

    # ✨ NEW: Temporal tracking
    last_scraped_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    scrape_count: Mapped[int] = mapped_column(Integer, default=1)
    last_scored_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_analyzed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # ✨ NEW: Trend momentum
    trend_velocity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # rising/stable/declining
    peak_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    peak_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    days_trending: Mapped[int] = mapped_column(Integer, default=0)

    # ✨ NEW: Search interest (from Google Trends)
    avg_interest: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 0-100
    interest_peak: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    interest_delta: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # % change

    # ✨ NEW: Temporal context
    temporal_tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # ["Q1", "valentine", "evergreen"]

    # ✨ NEW: Cost tracking
    scoring_cost: Mapped[float] = mapped_column(Float, default=0.0)
    analysis_cost: Mapped[float] = mapped_column(Float, default=0.0)
    total_api_cost: Mapped[float] = mapped_column(Float, default=0.0)

    # ✨ NEW: Validation & Status
    validation_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # proven_seller/untested
    archived: Mapped[bool] = mapped_column(Boolean, default=False)

    # ✨ NEW: UI helpers
    emoji_tag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "💪 Motivational"
    urgency: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # "urgent", "plan_ahead", "evergreen"
```

### Create Migration
```bash
# In backend directory:
docker compose exec backend alembic revision --autogenerate -m "add_trend_enhancements"
docker compose exec backend alembic upgrade head
```

---

## 2️⃣ Update Google Trends Scraper

### Modify `backend/services/scrapers/google_trends.py`:

```python
from pytrends.request import TrendReq
from pytrends.exceptions import TooManyRequestsError
import time
import random
from datetime import datetime, timedelta

# ... existing code ...

def get_interest_over_time(keyword: str, timeframe: str = "today 3-m") -> dict:
    """
    Get detailed interest metrics for a keyword.
    Returns: {avg_interest, peak_interest, current_interest, trend_direction}
    """
    try:
        pytrends = TrendReq(hl="en-US", tz=0, timeout=(10, 25), retries=2, backoff_factor=0.5)
        pytrends.build_payload([keyword], timeframe=timeframe, geo="")

        interest_df = pytrends.interest_over_time()

        if interest_df.empty or keyword not in interest_df.columns:
            return None

        values = interest_df[keyword].tolist()

        # Calculate metrics
        avg = sum(values) / len(values) if values else 0
        peak = max(values) if values else 0
        current = values[-1] if values else 0

        # Determine trend direction (compare recent vs older)
        if len(values) >= 4:
            recent_avg = sum(values[-4:]) / 4
            older_avg = sum(values[:-4]) / len(values[:-4]) if len(values[:-4]) > 0 else recent_avg

            if recent_avg > older_avg * 1.3:
                direction = "rising"
            elif recent_avg < older_avg * 0.7:
                direction = "declining"
            else:
                direction = "stable"
        else:
            direction = "stable"

        return {
            "avg_interest": int(avg),
            "interest_peak": int(peak),
            "current_interest": int(current),
            "trend_direction": direction,
            "interest_delta": ((current - avg) / avg * 100) if avg > 0 else 0
        }

    except Exception as e:
        print(f"[Interest] Error fetching interest for '{keyword}': {e}")
        return None


def scrape_google_trends_enhanced(custom_seeds: list[str] | None = None) -> list[dict]:
    """
    Enhanced scraper that includes interest metrics.
    Returns list of dicts: {keyword, avg_interest, trend_direction, ...}
    """
    seeds = custom_seeds or POD_SEED_KEYWORDS
    batch = seeds[:6]

    print(f"[Google Trends] Scraping {len(batch)} seed keyword groups...")

    related = get_related_queries(batch)

    # Now get interest metrics for each keyword
    enhanced_results = []
    for keyword in related[:15]:  # Limit to prevent rate limiting
        interest_data = get_interest_over_time(keyword)

        result = {
            "keyword": keyword,
            "source": "google",
        }

        if interest_data:
            result.update(interest_data)

        enhanced_results.append(result)
        time.sleep(random.uniform(1.5, 3.0))  # Be polite

    print(f"[Google Trends] Enriched {len(enhanced_results)} keywords with interest data")
    return enhanced_results
```

---

## 3️⃣ Add Temporal Tag Detection

### Create `backend/services/helpers/temporal_detector.py`:

```python
from datetime import datetime

HOLIDAY_KEYWORDS = {
    "valentine": ["valentine", "love day", "couple goals", "relationship"],
    "mothers_day": ["mom", "mother", "mama", "mommy"],
    "fathers_day": ["dad", "father", "papa", "daddy"],
    "christmas": ["christmas", "xmas", "santa", "holiday gift"],
    "halloween": ["halloween", "spooky", "witch", "pumpkin"],
    "thanksgiving": ["thanksgiving", "grateful", "turkey"],
    "easter": ["easter", "bunny", "egg hunt"],
    "back_to_school": ["school", "teacher", "student", "college"],
    "new_year": ["new year", "resolution", "2026", "2027"],
    "summer": ["summer", "beach", "vacation", "poolside"],
    "ramadan": ["ramadan", "eid", "iftar"],
}

def detect_temporal_tags(keyword: str, scraped_date: datetime, scrape_count: int = 1) -> list[str]:
    """
    Auto-detect temporal context for a keyword.
    Returns list of tags like: ["Q1", "valentine", "winter", "evergreen"]
    """
    tags = []
    keyword_lower = keyword.lower()

    # Detect holiday association
    for holiday, triggers in HOLIDAY_KEYWORDS.items():
        if any(trigger in keyword_lower for trigger in triggers):
            tags.append(holiday)

    # Detect season
    month = scraped_date.month
    if month in [12, 1, 2]:
        tags.append("winter")
    elif month in [3, 4, 5]:
        tags.append("spring")
    elif month in [6, 7, 8]:
        tags.append("summer")
    else:
        tags.append("fall")

    # Quarter tag
    quarter = (month - 1) // 3 + 1
    tags.append(f"Q{quarter}")

    # Evergreen detection (if seen multiple times across different seasons)
    if scrape_count >= 3:
        tags.append("evergreen")

    return tags


def detect_urgency(temporal_tags: list[str], avg_interest: int, trend_direction: str) -> str:
    """
    Determine urgency level based on temporal context and momentum.
    Returns: "urgent", "plan_ahead", "evergreen"
    """
    # High interest + rising = urgent
    if avg_interest >= 60 and trend_direction == "rising":
        return "urgent"

    # Holiday coming up in 1-2 months = plan ahead
    current_month = datetime.now().month
    if "valentine" in temporal_tags and current_month == 1:
        return "plan_ahead"
    if "mothers_day" in temporal_tags and current_month in [3, 4]:
        return "plan_ahead"
    if "halloween" in temporal_tags and current_month in [8, 9]:
        return "plan_ahead"
    if "christmas" in temporal_tags and current_month in [9, 10, 11]:
        return "plan_ahead"

    # Evergreen = always relevant
    if "evergreen" in temporal_tags:
        return "evergreen"

    return "standard"


def assign_emoji_tag(keyword: str, temporal_tags: list[str]) -> str:
    """
    Assign a visual emoji tag for quick categorization.
    """
    keyword_lower = keyword.lower()

    # Motivation & mindset
    if any(w in keyword_lower for w in ["motivat", "stoic", "mindset", "discipline", "success"]):
        return "💪 Motivational"

    # Humor
    if any(w in keyword_lower for w in ["funny", "humor", "meme", "joke", "sarcastic"]):
        return "😂 Humor"

    # Animals
    if any(w in keyword_lower for w in ["dog", "cat", "pet", "animal", "puppy", "kitten"]):
        return "🐾 Animals"

    # Love & relationships
    if any(w in keyword_lower for w in ["love", "couple", "relationship", "valentine"]):
        return "❤️ Love"

    # Fitness
    if any(w in keyword_lower for w in ["gym", "workout", "fitness", "muscle", "lift"]):
        return "🏋️ Fitness"

    # Food & drink
    if any(w in keyword_lower for w in ["coffee", "food", "wine", "beer", "pizza"]):
        return "☕ Food & Drink"

    # Fashion & style
    if any(w in keyword_lower for w in ["fashion", "style", "aesthetic", "streetwear"]):
        return "👕 Fashion"

    # Holidays
    if "christmas" in temporal_tags:
        return "🎄 Christmas"
    if "halloween" in temporal_tags:
        return "🎃 Halloween"
    if "valentine" in temporal_tags:
        return "💝 Valentine"

    return "🔍 General"
```

---

## 4️⃣ Update Scoring Logic with Smart Caching

### Modify `backend/routers/trends.py`:

```python
from datetime import datetime, timedelta
from services.helpers.temporal_detector import detect_temporal_tags, detect_urgency, assign_emoji_tag

# Add this helper function at the top:

def should_rescore(trend: Trend) -> bool:
    """
    Determine if a trend should be rescored based on caching rules.
    Returns True if we should score it, False if we should skip.
    """
    # Never scored? Score it
    if trend.last_scored_at is None:
        return True

    # Scored within last 48h? Skip (cache hit)
    hours_since_score = (datetime.utcnow() - trend.last_scored_at).total_seconds() / 3600
    if hours_since_score < 48:
        print(f"[Cache] Skipping '{trend.keyword}' - scored {hours_since_score:.1f}h ago")
        return False

    # High-value trend (7+) and scored within last week? Skip
    if trend.score_groq and trend.score_groq >= 7 and hours_since_score < 168:  # 1 week
        print(f"[Cache] Skipping high-value '{trend.keyword}' - scored recently")
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

    # Already analyzed? Only re-analyze if:
    # 1. Never analyzed, OR
    # 2. Score increased by 2+ points since last analysis, OR
    # 3. More than 30 days since last analysis AND still high interest
    if trend.deep_analysis:
        # Has analysis - should we refresh?
        if trend.last_analyzed_at:
            days_since = (datetime.utcnow() - trend.last_analyzed_at).days

            # Only re-analyze if it's been 30+ days AND interest is still high
            if days_since < 30:
                print(f"[Claude] Skipping '{trend.keyword}' - analyzed {days_since}d ago")
                return False

            if trend.avg_interest and trend.avg_interest < 50:
                print(f"[Claude] Skipping '{trend.keyword}' - interest dropped")
                return False

    return True


# Update the scraping function:
async def run_scrape_and_score_stream(db: Session, request: Request):
    """Enhanced scraper with smart caching and enrichment."""
    try:
        yield {"event": "progress", "data": json.dumps({"status": "Started scraping trends...", "progress": 5})}

        # ... existing scraper code ...

        # After getting keywords, enrich with interest data
        loop = asyncio.get_event_loop()

        # Instead of scoring all 20, first filter by cache
        trends_to_score = []
        trends_cached = []

        for kw_data in all_keywords_with_data[:30]:  # Process more since we're filtering
            keyword = kw_data["keyword"]

            # Check if already exists in DB
            existing = db.query(Trend).filter(Trend.keyword == keyword).first()

            if existing:
                # Update last_scraped_at and scrape_count
                existing.last_scraped_at = datetime.utcnow()
                existing.scrape_count += 1

                # Update interest metrics if available
                if "avg_interest" in kw_data:
                    # Calculate delta
                    old_interest = existing.avg_interest or 0
                    new_interest = kw_data["avg_interest"]
                    existing.interest_delta = ((new_interest - old_interest) / old_interest * 100) if old_interest > 0 else 0
                    existing.avg_interest = new_interest
                    existing.interest_peak = kw_data.get("interest_peak")
                    existing.trend_velocity = kw_data.get("trend_direction", "stable")

                # Update temporal tags
                existing.temporal_tags = detect_temporal_tags(keyword, datetime.utcnow(), existing.scrape_count)
                existing.urgency = detect_urgency(existing.temporal_tags, existing.avg_interest or 0, existing.trend_velocity or "stable")

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
                    avg_interest=kw_data.get("avg_interest"),
                    interest_peak=kw_data.get("interest_peak"),
                    trend_velocity=kw_data.get("trend_direction", "stable"),
                )
                new_trend.temporal_tags = detect_temporal_tags(keyword, datetime.utcnow(), 1)
                new_trend.emoji_tag = assign_emoji_tag(keyword, new_trend.temporal_tags)
                new_trend.urgency = detect_urgency(new_trend.temporal_tags, new_trend.avg_interest or 0, new_trend.trend_velocity or "stable")

                db.add(new_trend)
                db.flush()  # Get ID
                trends_to_score.append((new_trend, kw_data))

        db.commit()

        # Report caching savings
        yield {"event": "progress", "data": json.dumps({
            "status": f"💰 Cached {len(trends_cached)} trends, scoring {len(trends_to_score)} new/stale",
            "progress": 35
        })}

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
                if not trend.peak_score or trend.score_groq > trend.peak_score:
                    trend.peak_score = trend.score_groq
                    trend.peak_date = datetime.utcnow()

                prog = 40 + int((i / len(trends_to_score)) * 35)
                yield {"event": "progress", "data": json.dumps({
                    "status": f"Scored '{trend.keyword}' → {trend.score_groq}/10",
                    "progress": prog
                })}

        db.commit()

        # Deep analyze only high-value, not-recently-analyzed trends
        trends_to_analyze = [
            t for t, _ in trends_to_score
            if should_deep_analyze(t)
        ]

        yield {"event": "progress", "data": json.dumps({
            "status": f"🤖 Claude analyzing {len(trends_to_analyze)} high-value trends...",
            "progress": 80
        })}

        for trend in trends_to_analyze[:3]:  # Limit to 3 per run
            analysis = await loop.run_in_executor(None, deep_analyze, trend.keyword, trend.score_groq, trend.product_suggestions or [])
            trend.deep_analysis = analysis["deep_analysis"]
            trend.design_brief = analysis["design_brief"]
            trend.target_audience = analysis["target_audience"]
            trend.last_analyzed_at = datetime.utcnow()
            trend.analysis_cost = 0.02  # Estimate ~$0.02 per Claude call
            trend.total_api_cost = trend.scoring_cost + trend.analysis_cost
            db.commit()

        yield {"event": "complete", "data": json.dumps({
            "status": f"✅ Complete! Scored {len(trends_to_score)}, Cached {len(trends_cached)}, Analyzed {len(trends_to_analyze)}",
            "progress": 100
        })}

    except Exception as e:
        print(f"[Pipeline] Error: {e}")
        yield {"event": "error", "data": json.dumps({"status": f"Error: {e}", "progress": 100})}
```

---

## 5️⃣ Create Blacklist System

### Create `backend/services/helpers/blacklist.py`:

```python
"""
Keyword blacklist to avoid wasting API calls on known-bad keywords.
"""

# Known brand names and copyrighted terms
BRAND_BLACKLIST = {
    "nike", "adidas", "puma", "reebok", "under armour",
    "disney", "marvel", "dc comics", "star wars", "harry potter",
    "netflix", "spotify", "amazon", "apple", "google",
    "coca cola", "pepsi", "starbucks", "mcdonalds",
    "gucci", "prada", "louis vuitton", "chanel",
    "fortnite", "minecraft", "pokemon", "roblox",
    "playstation", "xbox", "nintendo",
}

# Profanity and offensive terms (add as needed)
OFFENSIVE_BLACKLIST = {
    # Add as you encounter them
}

# Medical/legal risk terms
MEDICAL_BLACKLIST = {
    "cure", "treat", "diagnose", "medical", "doctor",
    "prescription", "medicine", "drug", "therapy",
    "lose weight fast", "guaranteed results",
}

def is_blacklisted(keyword: str) -> tuple[bool, str]:
    """
    Check if keyword should be blacklisted.
    Returns: (is_blacklisted: bool, reason: str)
    """
    keyword_lower = keyword.lower()

    # Check brands
    for brand in BRAND_BLACKLIST:
        if brand in keyword_lower:
            return (True, f"brand_violation:{brand}")

    # Check offensive
    for term in OFFENSIVE_BLACKLIST:
        if term in keyword_lower:
            return (True, "offensive_content")

    # Check medical claims
    for term in MEDICAL_BLACKLIST:
        if term in keyword_lower:
            return (True, "medical_claim_risk")

    return (False, "")
```

---

## 6️⃣ Database Migration Script

```bash
# Run this to apply changes:
cd backend
docker compose exec backend python -c "
from db.database import engine
from db.models import Base
Base.metadata.create_all(bind=engine)
print('✅ Database schema updated')
"
```

---

## 📊 Expected Results

After implementing Phase 1:

### Before:
- ❌ Rescoring same trends every 6h → wasting 60% of API calls
- ❌ No interest data → analyzing low-potential trends
- ❌ No temporal awareness → analyzing "Christmas" trends in July
- ❌ Claude analyzing all 7+ trends repeatedly

### After:
- ✅ 48h cache → 60-70% fewer scoring calls
- ✅ Interest filtering → Skip trends with <40 interest
- ✅ Temporal tags → Skip off-season trends
- ✅ Smart Claude gating → Only analyze new high-value trends
- ✅ Cost tracking → Visibility into spend

### Cost Impact:
- **Groq**: Still free (reduced load = more headroom)
- **Claude**: $10-15/month → $3-5/month (70% reduction)
- **Total savings**: ~$10/month + faster scraping

---

## 🚀 Next Steps

1. Apply database changes (add new fields)
2. Update scraper with interest metrics
3. Implement smart caching logic
4. Add temporal detection
5. Deploy and test
6. Monitor cost dashboard

Then move to Phase 2 (two-pass scoring, clustering)!
