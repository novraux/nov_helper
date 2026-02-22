# Novraux Trend Scraper Engine

The Trend Scraper Engine is a core microservice integrated into the Novraux backend designed to programmatically fetch, aggregate, deduplicate, and rank print-on-demand trends from multiple disparate sources in real time. 

It heavily leverages a two-tier AI processing system to score trends economically while automatically streaming progress back to the frontend UI via Server-Sent Events (SSE).

## 1. Data Aggregation
The engine concurrently triggers scrapers across four major platforms:
- **Google Trends**
- **TikTok Trends**
- **Pinterest Trends**
- **Redbubble Popular Tags**

Instead of waiting for each scraper to finish sequentially, the system leverages Python's `asyncio.gather` and `run_in_executor` to execute all network I/O bound scrapers concurrently. The resulting keywords are aggregated and grouped by source to track data provenance.

## 2. Real-Time Streaming (Server-Sent Events)
Because the scraping and AI scoring pipeline can take tens of seconds to complete, the endpoint (`GET /trends/scrape`) is built as an async generator that yields `EventSourceResponse` chunks to the client.

This allows the frontend (Vite/React) to consume standard Server-Sent Events (SSE) and render a granular progress bar, indicating exactly which keyword is currently being processed and by which AI model.

## 3. Tiered AI Scoring & Fallback Architecture
To remain highly cost-efficient while maintaining quality, the engine uses a tiered AI processing architecture.

### Tier 1: Initial Bulk Scoring (Groq)
All incoming aggregated keywords (batched to the top 20 to respect TPM limits) are scored out of 10 for Print-on-Demand (POD) viability.
- **Model:** `llama-3.1-8b-instant` via Groq.
- **Why:** Groq provides ultra-low latency inference which makes it perfect for bulk processing high volumes of keywords.

### Alternate Tier 1: Fallback (OpenAI)
If Groq rate limits are hit (Error 429) or the Groq API becomes unavailable, the system automatically falls back to OpenAI for the scoring loop.
- **Model:** `gpt-3.5-turbo` via OpenAI.
- **Why:** Acts as a cheap, reliable failover to ensure the scraping pipeline never completely dies due to a single provider's rate limits. The frontend progress bar explicitly shows `[OpenAI (gpt-3.5-turbo)]` when the fallback is triggered.

### Tier 2: Deep Analysis (Claude)
Keywords that score exceptionally well (7/10 or higher) on the Tier 1 evaluation pass through to the secondary analysis phase.
- **Model:** `claude-3-haiku-20240307` via Anthropic.
- **Why:** Claude generates high-quality linguistic output. We use it sparingly (only on the top 5 keywords per cycle) to generate comprehensive Design Briefs, Target Audience Profiles, and Copywriting Angles.

## 4. Database Persistence
Scored keywords are upserted into the PostgreSQL (`Trend` model):
- If the keyword already exists, its scores and metrics are updated.
- If it is new, it is inserted along with its original source platform.
This allows the `Niche Explorer` UI to quickly filter local data by Top Score, Origin Source, and IP Safety status without re-running the scrapers.
