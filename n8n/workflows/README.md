# n8n Workflow Setup Guide

Two automated workflows are ready to import into n8n.

## How to Import

1. Open n8n at **http://localhost:5678** (login: `admin` / `novraux_n8n`)
2. Go to **Workflows → Import from file**
3. Import each JSON file:

| File | Schedule | Purpose |
|------|----------|---------|
| `auto_scraper_6h.json` | Every 6 hours | Scrape all sources, AI-score new keywords, log digest |
| `daily_digest_9am.json` | 9am UTC daily | Fetch top trends + ready designs, log morning briefing |

## What Each Workflow Does

### 🔁 Auto Scraper (Every 6h)
```
Schedule → POST /trends/scrape-batch → Check success
  ↓ (success)
GET /vault/stats → Build report → Log to n8n
  ↓ (failure)
Log error alert
```
Returns: scraped count, new keywords, scored, cached, top trends, duration.

### 📊 Daily Digest (9am UTC)
```
Schedule → [parallel] GET /trends?min_score=7
                        GET /vault?status=ready
                        GET /vault/stats
          → Build morning briefing → Emit summary
```
Logs a formatted digest to the n8n execution log showing top opportunities and ready-to-export designs.

## Adding Telegram / Email Notifications

After the **Emit Summary** or **Log Report** nodes, add:
- **Telegram node** → send `{{ $json.digest }}` to your bot
- **Gmail node** → daily digest email
- **Webhook / Slack node** → post to your team channel

## API Endpoint Reference

| Endpoint | Notes |
|---|---|
| `POST http://backend:8000/trends/scrape-batch` | Run full scraper — returns JSON summary (n8n safe) |
| `GET http://backend:8000/trends?min_score=7` | Top-scored trends |
| `GET http://backend:8000/vault?status=ready` | Ready-to-export designs |
| `GET http://backend:8000/vault/stats` | Vault count by status |

> **Note**: Use `http://backend:8000` (Docker internal) not `localhost:8000` inside n8n workflows.
