# Novraux — Roadmap
> February 2026 | Living document

---

## Where We Are Now

- Etsy shop live (Novraux), Shopify store exists
- Printful connected to Etsy
- First design ready ("SILENCE IS STRATEGY")
- Design generation tool built (Python + Pillow)
- AI API keys: Claude, OpenAI, Groq, Google AI
- Email infrastructure set up (novraux.com)
- Everything manual — no automation yet

---

## What We're Building

Three things, in this order:

### 1. Trend Research Engine
> "What should I design next?"

Find trending topics, phrases, and aesthetics that would sell as POD products. Pull from Google Trends, TikTok, and Pinterest. Use AI to score and filter ideas so you wake up to a feed of opportunities, not a blank page.

### 2. SEO & Mockup Generator
> "Make my listings actually good, fast"

Input a design concept → get a complete Etsy/Shopify listing: optimized title (140 chars), description, all 13 tags, and product mockups. AI handles the copywriting, you just review and publish.

### 3. Simple Management Dashboard
> "See everything in one place"

One screen showing: trending ideas, your listings across stores, orders, revenue, and profit. No more switching between Etsy, Shopify, and Printful dashboards.

---

## Stack

| Tool | Role |
|------|------|
| **n8n** (self-hosted, Docker) | Connects everything — scheduled jobs, webhooks, workflow automation |
| **Python** (FastAPI) | AI integrations, scrapers, custom logic |
| **Simple frontend** (JS/React) | Dashboard UI |
| **PostgreSQL** | Store trends, listings, analytics data |
| **Docker Compose** | Run everything locally with one command |

### AI APIs

| API | Use For |
|-----|---------|
| **Groq** | Fast + cheap — bulk trend scoring, quick drafts |
| **Claude** | Quality — SEO copy, deep trend analysis, brand voice |
| **OpenAI** | DALL-E image generation, design concepts |
| **Google AI** | Multimodal, Google Trends integration |

### n8n Workflows

- Schedule trend scrapers (every 6–12 hours)
- Trigger AI scoring when new trends arrive
- Send daily digest of top opportunities (Telegram/email)
- Sync orders from Etsy + Shopify to dashboard DB
- Trigger SEO generation when you approve a design concept

---

## Phases

### Phase 0 — First Sales (Now)
> Get the existing design live. No tooling needed.

- [ ] Upload "SILENCE IS STRATEGY" to Printful
- [ ] Configure product (tee, sizes, pricing)
- [ ] Generate mockups in Printful
- [ ] Push to Etsy, write listing manually
- [ ] Publish — shop is officially open
- [ ] List 3–5 more designs in week 1

---

### Phase 1 — Trend Research Engine
> Know what to design before opening Pillow.

- [ ] Set up Docker Compose (n8n + Postgres + backend)
- [ ] Build Google Trends scraper (pytrends)
- [ ] Build TikTok trending scraper (hashtags, phrases, engagement)
- [ ] Build Pinterest trends scraper (keywords, visual themes)
- [ ] n8n scheduled workflows: run scrapers on intervals
- [ ] AI scoring: Groq scores all trends (POD viability, competition, demand, IP safety)
- [ ] Top trends (score 7+) get deep analysis from Claude (product suggestions, audience, design briefs)
- [ ] Dashboard: trend feed — sortable, filterable, with scores and AI analysis
- [ ] n8n daily digest: top 5 opportunities sent to you every morning

---

### Phase 2 — SEO & Mockup Generator
> Input a concept, get a ready-to-publish listing.

- [ ] SEO generation: concept in → title + description + 13 tags out
- [ ] Multi-AI pipeline: Groq drafts options → Claude refines best one
- [ ] Competitor analysis: search a keyword → see what top sellers are doing (titles, tags, prices)
- [ ] Listing score: rate your listing against competitors
- [ ] Dashboard: SEO generator page with form + preview + copy/edit
- [ ] Mockup generation: integrate with Printful mockup API or use AI-generated lifestyle mockups

---

### Phase 3 — Management Dashboard
> One place for everything.

- [ ] n8n workflows syncing Etsy + Shopify orders every 30 min
- [ ] Unified order view: all orders across stores in one table
- [ ] Revenue + profit tracking (including Printful costs, Etsy fees, EUR→MAD conversion)
- [ ] Listing manager: see all your active listings across both stores
- [ ] Product performance: which designs sell, which don't, on which platform
- [ ] Simple alerts: new orders, reviews, trending listings via n8n → Telegram

---

## 💡 Idea Map
> Everything we could add over time. This is a menu — pick what creates value when you need it.

### 🔍 Research & Discovery
| Idea | What It Does |
|------|-------------|
| Niche Explorer | Find underserved Etsy categories with high demand / low competition |
| Seasonal Calendar | Pre-plan designs around holidays and events (Valentine's, Ramadan, Halloween, back-to-school, etc.) |
| Reddit Niche Scanner | Monitor subreddits for emerging phrases, memes, and community in-jokes |
| Hashtag Tracker | Track specific hashtags over time to see trend curves (rising vs. dying) |
| Etsy Autocomplete Scraper | Scrape Etsy search suggestions for long-tail keyword ideas |
| Customer Persona Builder | Analyze sales data to understand who actually buys from you |
| Google Keyword Spy | Use keyword planner data to find high-search-volume phrases for products |

### 🎨 Design & Creation
| Idea | What It Does |
|------|-------------|
| AI Graphic Design | DALL-E / Midjourney for illustration-based designs beyond typography |
| Design Variation Engine | One design → auto-generate 5–10 variations (colors, fonts, wording) |
| Design Vault | Organized library of all designs with metadata, tags, and performance data |
| Color Palette Optimizer | Analyze best-selling designs' colors → suggest palettes for new ones |
| Font Recommender | AI suggests font pairings based on the phrase and target vibe |
| Design Brief Generator | Trend → complete design brief (text, style, fonts, colors, layout) |
| Multi-Product Expander | One design auto-mapped to all viable products (tee + hoodie + mug + poster + sticker) |

### 📝 Listings & SEO
| Idea | What It Does |
|------|-------------|
| Bulk Listing Editor | Change prices/tags/titles across many listings at once |
| A/B Testing | Rotate titles/tags/images, track which version performs better |
| Listing Health Monitor | Scan all listings for SEO issues: missing tags, weak titles |
| Auto-Pricing | Dynamically adjust prices based on demand and competition |
| Tag Recycler | Find dead-weight tags and replace with better ones |
| Multi-Language Listings | Auto-translate for international Etsy markets (DE, FR, etc.) |
| Listing Cloner | Clone a successful listing's SEO structure for a new design |
| Description Templates | Reusable description frameworks per product type |

### 📊 Analytics & Intelligence
| Idea | What It Does |
|------|-------------|
| Sales Velocity Alerts | "This design is selling fast — make variations" |
| Dead Listing Detector | Flag listings with zero traction after X days |
| Revenue Forecaster | Predict next week/month revenue from current trends |
| Best Time to List | Find when listings get the most initial visibility |
| Competitor Watchdog | Track competing shops: new listings, pricing changes, bestsellers |
| Niche Performance Tracker | Which niches (stoic, humor, minimalist) perform best for your shop |
| ROI per AI Dollar | Track AI API spend vs. revenue from AI-assisted products |
| Profit Calculator | Real-time profit per product with all costs included |

### 🤖 Automation & Ops
| Idea | What It Does |
|------|-------------|
| Review Auto-Responder | Auto-draft thank you responses, flag negative reviews |
| Order Issue Detector | Flag orders with shipping delays or fulfillment problems |
| Supplier Comparison | Compare Printful vs. Printify vs. Gooten pricing per product |
| Auto Social Media | New listing → auto-generate Instagram/Pinterest/TikTok content |
| Copyright Watchdog | Monitor if someone copies your designs |
| Auto-Archive | Delist products that haven't sold in 90 days |
| Restock Alerts | Get notified if Printful discontinues a product or changes pricing |
| IP Pre-Check Pipeline | Automated trademark search before any design is approved |

### 🌐 Growth & Marketing
| Idea | What It Does |
|------|-------------|
| Pinterest Auto-Pinner | Auto-pin mockups to themed boards on a schedule |
| TikTok Content Generator | Generate short video scripts for showcasing designs |
| Etsy Ads Manager | Manage promoted listings: budget, ROI, auto-pause losers |
| Blog/Content SEO | AI-written blog on novraux.com targeting design/fashion keywords |
| Email List Builder | Landing page → collect emails → announce new drops |
| Coupon/Discount Engine | Strategic discounts: first purchase, bundles, seasonal sales |
| Influencer Finder | Find micro-influencers in your niches |
| Cross-Sell Recommender | "Customers who bought this also liked..." for Shopify |

---

## APIs Needed

| Service | Status |
|---------|--------|
| Claude (Anthropic) | ✅ Have key |
| OpenAI | ✅ Have key |
| Groq | ✅ Have key |
| Google AI (Gemini) | ✅ Have key |
| Etsy API v3 | ⬜ Need to register |
| Shopify API | ⬜ Need to set up |
| Printful API | ⬜ Need to get key |
| Pinterest API | ⬜ Need to apply |
| Google Trends (pytrends) | ✅ No key needed |

---

## Timeline

| Phase | What | When |
|-------|------|------|
| **0** | First listings live manually | Now — days 1–2 |
| **1** | Trend research engine | Weeks 1–2 |
| **2** | SEO & mockup generator | Week 3 |
| **3** | Management dashboard | Weeks 4–5 |
| **+** | Pick from Idea Map as needed | Ongoing |

---

*Domain: novraux.com | Etsy: etsy.com/shop/novraux*