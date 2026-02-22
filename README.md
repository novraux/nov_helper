# Novraux — Automated Print-on-Demand Suite

Novraux is a premium, automated POD platform designed to find trends, validate niches, generate designs, and manage multi-channel orders (Shopify/Etsy).

---

## 🚀 Quick Start

### 1. Prerequisite Checks
- **Docker Desktop** running.
- **Node.js 18+** installed locally.
- **.env** file present in root with API keys (Groq, OpenAI, Anthropic).

### 2. Start Services
From the root directory:
```bash
# Start Backend + DB + n8n
docker compose up -d

# Start Frontend
cd frontend
npm install
npm run dev
```

### 3. Access URLs
- **Dashboard**: http://localhost:5174 (standard dev port)
- **API Docs**: http://localhost:8000/docs
- **n8n (Automation)**: http://localhost:5678 (admin / novraux_n8n)

---

## 🛠 Working Components & Services

### 🔍 Niche Explorer (Front-end: `/explorer`)
- **Backend Service**: `niche_validator.py` + `research.py` (router).
- **Function**: Scrapes Etsy/Redbubble, generates market gap reports, and AI design concepts.
- **Enhancements**: "Save to Vault" integration added to all design cards.

### 🗂 Design Vault (Front-end: `/vault`)
- **Backend Service**: `vault.py` (router) + `SavedDesign` (PostgreSQL model).
- **Function**: Persistent storage for your best niche ideas. Track status from "Draft" to "Exported".

### 📅 Seasonal Calendar (Front-end: `/calendar`)
- **Backend Service**: Pure front-end logic + static event DB.
- **Function**: Visual 12-month roadmap of POD-relevant holidays and events. Click any niche to auto-trigger the Explorer.

### 💰 Revenue Dashboard (Front-end: `/orders`)
- **Backend Service**: `orders.py` (router).
- **Function**: Unified analytics for Shopify/Etsy. Revenue/Profit charts, margin tracking, and top-selling products.

### 🤖 n8n Workflows (Internal: `:5678`)
- **Location**: `./n8n/workflows/`
- **Workflows**:
  - `auto_scraper_6h.json`: Runs trend scrapers every 6 hours.
  - `daily_digest_9am.json`: Sends a morning opportunity report.

---

## 🛑 Stopping the Project

```bash
# Stop all docker services
docker compose down

# Stop frontend
(Press Ctrl+C in the terminal running 'npm run dev')
```

## 📂 Project Structure

```bash
├── backend/
│   ├── routers/         # API Endpoints (trends, vault, orders, research)
│   ├── services/        # Logic (AI generators, scrapers, shopify/printful)
│   ├── db/              # SQL Models & DB connection
│   └── main.py          # Entry point
├── frontend/
│   ├── src/pages/       # React components (Explorer, Vault, Dashboard, etc.)
│   └── src/api.ts       # Frontend API client
├── n8n/
│   └── workflows/       # Automated workflow JSONs
└── docker-compose.yml   # Orchestration
```
