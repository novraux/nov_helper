# Novraux — Progress Tracker
> Last updated: Feb 21, 2026

---

## 🟢 Phase 0 — Foundation
- [x] Etsy shop live (Novraux)
- [x] Printful connected to Etsy
- [x] First design ready ("SILENCE IS STRATEGY")
- [x] AI API keys set up (OpenAI, Groq, Google AI)
- [x] Email infrastructure (novraux.com)
- [ ] Upload first design to Printful + publish Etsy listing

---

## 🟡 Phase 1 — Trend Research Engine
- [x] Project structure scaffolded
- [x] Docker Compose (PostgreSQL + FastAPI + n8n)
- [x] Google Trends scraper (`pytrends`)
- [x] Groq AI scoring pipeline (POD viability, competition, IP safety)
- [x] Claude deep analysis for top trends (7+ score)
- [x] REST API: `GET /trends`, `POST /trends/scrape`
- [x] React dashboard — Trend Feed with filters & score cards
- [x] **Docker stack running** ✅ all 3 containers healthy
- [x] Backend health check: `{"status":"ok"}` ✅
- [x] DB tables created on startup ✅
- [x] First live scrape executed → click **Run Scraper** in dashboard
- [x] Groq model fixed (`llama3-8b-8192` → `llama-3.1-8b-instant`) ✅
- [x] Google Trends scraper rewritten (removed broken `trending_searches`) ✅
- [ ] n8n: scheduled scraper (every 6h)
- [ ] n8n: daily digest (top 5 trends → Telegram/email)
- [ ] TikTok scraper
- [ ] Pinterest scraper

---

## ✅ Phase 2 — Shopify SEO Optimizer
- [x] `GET /shopify/products` — fetches all store products ✅
- [x] `POST /shopify/products/{id}/generate-seo` — AI SEO preview ✅
- [x] `POST /shopify/products/push-seo` — push to Shopify ✅
- [x] `POST /shopify/products/bulk-seo` — bulk job with job polling ✅
- [x] LLM usage strategy documented in `groq_client.py` ✅
- [x] Frontend: Shopify SEO page (product list + generate + push) ✅
- [ ] Etsy SEO optimizer (Phase 2b — after Etsy API key)
- [ ] Mockup generation (Printful API)
- [ ] n8n: scheduled scraper (every 6h)
- [ ] n8n: daily digest (top 5 trends → Telegram/email)
- [ ] TikTok scraper
- [ ] Pinterest scraper

---

## ⚪ Phase 2 — SEO & Mockup Generator
- [ ] SEO generation endpoint (title + description + 13 tags)
- [ ] Multi-AI pipeline (Groq draft → Claude refine)
- [ ] Competitor analysis (Etsy keyword search)
- [ ] Mockup generation (Printful API)
- [ ] Dashboard: SEO generator page

---

## ⚪ Phase 3 — Management Dashboard
- [ ] n8n: Etsy + Shopify order sync (every 30 min)
- [ ] Unified order view
- [ ] Revenue + profit tracking
- [ ] Listing manager across all stores
- [ ] Alerts → Telegram

---

## 🔑 API Keys Status
| Key | Status | Action needed |
|-----|--------|---------------|
| OpenAI | ✅ Set | — |
| Groq | ✅ Set | — |
| Google AI (Gemini) | ✅ Set | — |
| Shopify Admin API | ✅ Set | — |
| Anthropic (Claude) | ❌ Missing | console.anthropic.com |
| Printful | ❌ Missing | printful.com → Settings → API |
| Etsy API v3 | ❌ Missing | etsy.com/developers (takes days) |
| Pinterest API | ❌ Missing | developers.pinterest.com (takes weeks) |

---

## 🚀 How to Run
```bash
# Start everything
docker compose up -d

# Check status
docker compose ps

# View backend logs
docker compose logs -f backend

# Frontend dashboard
cd frontend && npm run dev   # → http://localhost:5173

# n8n workflows
open http://localhost:5678   # admin / novraux_n8n

# Trigger trend scrape manually
curl -X POST http://localhost:8000/trends/scrape
```
