# 🚀 Scraper Enhancement Summary
> Complete overview of cost-saving improvements for Novraux

---

## 📊 The Problem

Your current scraper:
- ❌ Rescores the same trends every 6 hours (wasting 60-70% of API calls)
- ❌ No way to tell if a trend is rising, stable, or dying
- ❌ Analyzes low-potential keywords (e.g., interest score of 10/100)
- ❌ No temporal awareness (analyzing Christmas trends in July)
- ❌ Claude re-analyzing trends that haven't changed
- ❌ No visibility into API costs per trend
- ❌ No data on trend momentum or seasonality

**Current Monthly Cost**: ~$10-15 for Claude API
**Efficiency**: ~30-40% (wasting most API calls)

---

## ✨ The Solution

We've designed **12 creative enhancements** organized into 3 phases:

### Phase 1: Quick Wins (Weekend Project - 4-6 hours)
1. **Smart Caching** - Don't rescore trends for 48h, save 60-70% of calls
2. **Interest Metrics** - Add Google Trends interest data (0-100 scale)
3. **Temporal Tags** - Auto-detect seasons, holidays, evergreen trends
4. **Trend Momentum** - Track if trends are rising, stable, or declining
5. **Blacklist System** - Auto-block brand names, offensive terms
6. **Cost Tracking** - Track API spend per trend

**Impact**: 60-70% cost reduction, better trend quality

### Phase 2: Smart Filtering (Next Weekend - 3-4 hours)
7. **Two-Pass Scoring** - Quick filter (50 tokens) → Full score (survivors only)
8. **Semantic Clustering** - Group similar keywords, score once, apply to all
9. **Historical Snapshots** - Track interest over time, show graphs
10. **Variable Schedule** - TikTok every 3h, Google every 12h, Pinterest daily

**Impact**: Additional 30-40% efficiency gain

### Phase 3: Intelligence & ROI (Ongoing)
11. **Competitor Mining** - Scrape actual Etsy/Redbubble sellers for validated keywords
12. **ROI Tracking** - Link trends → designs → sales → revenue

**Impact**: Data-driven decisions, proven patterns

---

## 💰 Financial Impact

### Before Enhancements:
```
Monthly Scraping:
- Scrapes per month: 120 (every 6h)
- Keywords per scrape: 20
- Total keywords processed: 2,400
- Unique keywords: ~300 (80% duplicates!)
- Groq calls: 2,400 (free but wasteful)
- Claude calls: 50-80 (7+ scored trends)
- Claude cost: $10-15/month
```

### After Phase 1:
```
Monthly Scraping:
- Scrapes per month: 120 (same frequency)
- Keywords per scrape: 30 (process more due to filtering)
- Cache hits: 60-70% (not rescored)
- New/stale keywords: 10-12 per scrape
- Groq calls: 720 (70% reduction)
- Claude calls: 15-25 (50% reduction, smarter gating)
- Claude cost: $3-5/month

💰 Savings: $7-10/month (70% reduction)
⚡ Efficiency: 70%+ (vs. 30% before)
```

### After Phase 2:
```
Monthly Scraping:
- Two-pass filter eliminates 50% before full scoring
- Clustering reduces API calls by 40% on similar keywords
- Groq calls: 400 (83% reduction from original)
- Claude calls: 10-15 (80% reduction from original)
- Claude cost: $2-3/month

💰 Savings: $8-12/month (80% reduction)
⚡ Efficiency: 85%+
```

---

## 📈 Key Metrics Tracked

### New Data Points per Trend:

#### 📅 Temporal Tracking
- `last_scraped_at` - When we last saw this trend
- `scrape_count` - How many times we've seen it
- `last_scored_at` - When we last scored it
- `last_analyzed_at` - When Claude last analyzed it
- `days_trending` - How long it's been relevant

#### 📊 Interest & Momentum
- `avg_interest` - Google Trends interest (0-100)
- `interest_peak` - Highest interest seen
- `interest_delta` - % change from previous
- `trend_velocity` - "rising", "stable", "declining"
- `peak_score` - Best score ever achieved
- `peak_date` - When it peaked

#### 🏷️ Context & Classification
- `temporal_tags` - ["Q1", "valentine", "evergreen", "winter"]
- `emoji_tag` - "💪 Motivational" for quick visual sorting
- `urgency` - "urgent", "plan_ahead", "evergreen"
- `validation_status` - "proven_seller", "untested"

#### 💰 Cost & ROI
- `scoring_cost` - Cost to score this trend ($0 for Groq)
- `analysis_cost` - Cost for Claude analysis (~$0.02)
- `total_api_cost` - Total spent analyzing this trend

---

## 🎯 Smart Logic Examples

### Example 1: Trend "stoic quotes"
```
First seen: Feb 20, 2026
Scrape #1: Score 8.5, interest 54, Claude analysis ($0.02)
Scrape #2 (6h later): Cached ✅ (within 48h, skip scoring)
Scrape #3 (12h later): Cached ✅
Scrape #4 (48h later): Rescore → 8.7, interest 67
  → Interest delta +24% → Mark as "rising"
  → Score changed +0.2 (minor) → Skip Claude re-analysis
  → Total cost so far: $0.02 (70% savings vs. rescoring every time)

Tags: ["Q1", "evergreen", "winter"], "💪 Motivational", "plan_ahead"
```

### Example 2: Trend "christmas sweater"
```
First seen: Dec 1, 2025
Score: 7.8, interest 89 (high!)
Claude analyzed: $0.02
Tags: ["Q4", "christmas", "winter"]

Feb 22, 2026 scrape: Interest dropped to 8
→ Auto-detected: Off-season, declining
→ Status: Archived (stop analyzing)
→ Will resurface in Q4 2026 automatically
→ Saved: $0.20+ by not re-analyzing dead trend
```

### Example 3: Trend "Nike swoosh"
```
Scraped from TikTok
→ Blacklist check: "nike" detected
→ Status: Blacklisted (brand_violation)
→ API calls: 0
→ Cost: $0.00
→ Saved: $0.02 per scrape × future scrapes
```

---

## 🎨 UI Improvements

### Enhanced Trend Cards Show:
- ✅ Emoji category (💪, 😂, 🐾, ❤️, etc.)
- ✅ Momentum badge (🚀 Rising, 📊 Stable, 📉 Declining)
- ✅ Urgency indicator (⚡ Urgent, 📅 Plan Ahead, ♻️ Evergreen)
- ✅ "Found X days ago" timestamp
- ✅ "Seen X times" counter
- ✅ Interest graph (visual trend line)
- ✅ Cost badge ("FREE" for cached, "$0.02" for analyzed)
- ✅ Temporal tags (Q1, valentine, winter, evergreen)

### New Dashboard Section:
```
💰 API COST OVERVIEW
─────────────────────
This Month: $4.23 / $25.00 (17%)
Today: $0.34 | Yesterday: $0.52

Groq (free):   327 calls  →  $0.00
Claude (paid):   8 calls  →  $3.89
OpenAI (paid):   2 calls  →  $0.34

💡 Savings from caching: $12.60 (68%)
📊 Cache hit rate: 66%
```

### Smart Filters:
- 🚀 Rising Only
- ⚡ Urgent Only
- 💎 Evergreen
- 🆕 New (< 7 days)
- 💰 Free to analyze (cached)
- 🎨 Not yet designed
- Score range slider
- Interest range slider

---

## 🚀 Implementation Checklist

### Backend (4-5 hours):
- [ ] Update `backend/db/models.py` - add new fields to Trend model
- [ ] Create `backend/services/helpers/temporal_detector.py`
- [ ] Create `backend/services/helpers/blacklist.py`
- [ ] Update `backend/services/scrapers/google_trends.py` - add interest metrics
- [ ] Update `backend/routers/trends.py` - add caching logic
- [ ] Run database migration
- [ ] Test scraper with new logic

### Frontend (2-3 hours):
- [ ] Update TrendCard component - show new fields
- [ ] Add momentum badges (rising/stable/declining)
- [ ] Add urgency tags (urgent/plan_ahead/evergreen)
- [ ] Add emoji categories
- [ ] Show "Found X days ago" and "Seen X times"
- [ ] Add cost indicators
- [ ] Add new filter options
- [ ] Create cost dashboard section

### Testing (1 hour):
- [ ] Run scraper and verify caching works
- [ ] Check that trends aren't rescored within 48h
- [ ] Verify interest metrics are captured
- [ ] Test blacklist (try "nike" keyword)
- [ ] Verify temporal tags are assigned correctly
- [ ] Check cost tracking is accurate

---

## 📋 Files Created

1. **SCRAPER_ENHANCEMENTS.md** - Full detailed plan with all 12 ideas
2. **IMPLEMENTATION_PHASE1.md** - Step-by-step code changes for Phase 1
3. **UI_ENHANCEMENTS.md** - Visual mockups and UI component designs
4. **ENHANCEMENT_SUMMARY.md** (this file) - Executive overview

---

## 🎯 Next Steps

### Option A: Full Implementation (Recommended)
1. Start with Phase 1 this weekend (4-6 hours total)
2. Deploy and monitor savings for 1 week
3. Implement Phase 2 next weekend
4. Gradually add Phase 3 features as needed

### Option B: Gradual Rollout
1. Start with just smart caching (1 hour) → immediate 60% savings
2. Add interest metrics next (1 hour)
3. Add temporal tags (1 hour)
4. Continue incrementally

### Option C: Cherry-Pick
Pick only the features you want:
- Smart caching ← **Start here** (biggest impact)
- Interest filtering ← **High value**
- Temporal tags ← **Prevents wasted analysis**
- Cost tracking ← **Visibility**

---

## 💡 Bonus Ideas

### Additional Low-Hanging Fruit:
1. **Email digest improvements** - Include momentum badges in daily email
2. **Telegram alerts** - "🔥 3 exploding trends found today!"
3. **Auto-archive** - Move declining/off-season trends out of main feed
4. **Favorite trends** - Pin evergreen high-performers for quick reference
5. **Export to CSV** - Download trend data with all metrics

### Future Advanced Features:
1. **ML-based trend scoring** - Train model on your sales data
2. **Competitor tracking** - Monitor specific Etsy shops
3. **Price recommendations** - Suggest optimal pricing based on competition
4. **Design templates** - Auto-generate design briefs from high-scoring trends

---

## 📞 Questions to Consider

Before implementing, decide:

1. **Caching duration**: 48h standard, but do you want longer for high-value trends?
2. **Budget limit**: Should we add hard stop at $X/month?
3. **Blacklist**: What specific brands/terms do you want to block?
4. **Interest threshold**: Skip trends below what interest score? (40? 30?)
5. **Temporal logic**: Should we completely hide off-season trends or just deprioritize?

---

## 🎉 Expected Outcomes

After full implementation:

### Cost:
- ✅ 70-80% reduction in API costs
- ✅ $10-15/mo → $2-4/mo for Claude
- ✅ Better use of Groq free tier (more headroom)

### Quality:
- ✅ Focus on high-potential trends (rising, high interest)
- ✅ Avoid analyzing dead/seasonal trends
- ✅ Better temporal awareness

### Insights:
- ✅ See which trends are gaining momentum
- ✅ Track costs per trend
- ✅ Understand seasonal patterns
- ✅ Identify evergreen opportunities

### Efficiency:
- ✅ 30% efficiency → 80%+ efficiency
- ✅ Faster scrapes (less API calls)
- ✅ More trends processed overall
- ✅ Better prioritization

---

**Ready to implement?** Start with the database changes in `IMPLEMENTATION_PHASE1.md`!

---

*Created: Feb 22, 2026*
*Estimated ROI: $100-150/year in API savings + better trend selection = higher revenue*
