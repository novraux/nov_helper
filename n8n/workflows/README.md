# Novraux — n8n Workflows Guide

This directory contains instructions and templates for the n8n automation layer.

## 1. Competitive Intelligence Workflow (Market Gaps)

This workflow identifies "Gaps in the Market" for high-scoring trends by analyzing Redbubble competitors.

### Logic Flow:
1. **Cron Trigger**: Runs every 12 hours.
2. **HTTP Request (Get Trends)**: 
   - URL: `http://novraux-backend:8000/trends?min_score=8`
   - Method: `GET`
3. **Split in Batches**: Processes each high-value trend one-by-one.
4. **HTTP Request (Gap Analysis)**:
   - URL: `http://novraux-backend:8000/research/gap-analysis?keyword={{ $json.keyword }}`
   - Method: `GET`
5. **Conditional**: If `listing_count > 0`.
6. **Notification**: Send the `report` field to Telegram/Discord.

---

## 2. High-Value Trend Alerts (Telegram)

Immediate alerts for viral keywords that hit a score of 9+ in the automated scrapers.

### Logic Flow:
1. **Webhook / Polling**: Triggered after the backend scrape cycle finishes.
2. **HTTP Request**: `GET /trends?min_score=9&limit=5`.
3. **Telegram Node**: 
   - Chat: Admin Channel
   - Message: 
     ```
     🚀 NEW HIGH-VALUE TREND: {{ $json.keyword }}
     Source: {{ $json.source }}
     Score: {{ $json.score_groq }}
     
     DESIGN BRIEF:
     {{ $json.design_brief }}
     ```

---

## Setup Instructions

1. Access n8n at `http://localhost:5678`.
2. Login with credentials from `.env` (`N8N_BASIC_AUTH_USER`).
3. Click "Import from URL" or "Import from JSON" in the workflow editor.
4. Use the `novraux-backend:8000` internal hostname for all HTTP nodes if running in Docker.
