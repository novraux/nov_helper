# Novraux Print-on-Demand Automation Platform

Novraux is a full-stack automated Print-on-Demand (POD) application. It features a React frontend, a FastAPI Python backend, PostgreSQL database, and n8n workflow integrations.

This platform helps users discover trending niches via an AI-powered scraper, generate SEO-optimized product data for Shopify, and manage incoming orders.

---

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (v18+ recommended)
- npm or yarn

### 1. Configure Environment Variables
You need to set up your API keys and configuration before running the app. 

1. Copy the example environment file in the root directory:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your keys:
   - **Groq API Key:** Required for fast trend scoring.
   - **OpenAI API Key:** Used as a fallback if Groq rate limits are hit.
   - **Anthropic API Key:** Used for deep niche analysis and design briefs.
   - **Shopify & Printful Credentials:** Required for pushing products and tracking orders.

### 2. Start the Backend Infrastructure
The backend API, PostgreSQL database, and n8n instance are fully dockerized.

1. Navigate to the root directory.
2. Build and start the containers in the background:
   ```bash
   docker compose up -d
   ```
3. The backend API is now running at `http://localhost:8000`.
   - You can view the automated Swagger documentation at `http://localhost:8000/docs`.
   - n8n is running at `http://localhost:5678`.

### 3. Start the Frontend
The frontend is a modern React application built with Vite.

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser to view the application.

---

## 🛠 Features & Architecture

### 🎨 Niche Explorer

A full end-to-end POD research and design generation tool. It covers the **entire workflow** from finding a profitable niche to exporting a ready-to-upload Printful design package.

#### Workflow

**Step 1 — Niche Validation (Search)**
- Enter a niche keyword (e.g. "stoicism", "retro camping", "cat mom").
- The backend scrapes **Etsy** and **Redbubble** in parallel, collecting real listing data.
- AI (Claude/Groq) generates a structured **Market Analysis Report** with gap analysis.
- An **Opportunity Score (0–100)** is calculated based on listing count, price spread, and gap quality.
- **KPI Dashboard:** Shows listing count by platform, average price, and min/max price range.

**Step 2 — Design Ideas Generation**
- Choose a **design style**: Text-Only, Minimalist, Graphic-Heavy, Vintage Retro, or Balanced.
- Click **Generate Designs** to call the AI pipeline, which produces 5 tailored design concepts.
- Each card shows a demand score bar, product type, concept summary, and element tags.

**Step 3 — Design Detail View**
- Click any design card to auto-generate:
  - **Detailed Design Brief** (color palette, typography, mood, technical specs)
  - **Complete Etsy Listing Copy** (title, description, SEO tags)
- Explicitly **generate a raw DALL-E 3 PNG** design (costs ~$0.04, user-triggered)
- Explicitly **generate 5 product variations** (mug, hoodie, tote bag, etc.)
- **Export Design Package (JSON)** — downloads all brief data, listing copy, image URL.

#### Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/research/niche/validate?niche=<kw>` | Scrape & validate a niche keyword |
| `POST` | `/research/niche/analyze?niche=<kw>&generate_designs=true` | Full POD analysis + design ideas |
| `POST` | `/research/design/brief?niche=...&design_title=...` | Generate detailed design brief |
| `POST` | `/research/design/listing?niche=...&design_title=...` | Generate Etsy listing copy |
| `POST` | `/research/design/mockup?...` | Generate DALL-E 3 raw PNG graphic |
| `POST` | `/research/design/variations?num_variations=5` | Generate product variation images |

All endpoints accept a `style_preference` parameter (`Text-Only`, `Minimalist`, `Graphic-Heavy`, `Vintage Retro`, `Balanced`).

#### DALL-E Text Accuracy Optimization

DALL-E 3 often misspells or omits text in generated images. Several prompt engineering techniques are applied to maximize accuracy:

1. **Text-first declaration** — The exact design text appears at the very top of the prompt: `TEXT TO RENDER VERBATIM: <EXACT TEXT>`
2. **ALL CAPS + angle brackets** — Signals verbatim character rendering to the model
3. **Double affirmation** — The text is re-stated at the bottom as a `FINAL CHECK`
4. **No extra words** — The prompt explicitly prohibits adding, altering, or paraphrasing the text
5. **`hd` quality mode** — All design graphics use OpenAI's high-definition generation mode

#### Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | DALL-E 3 image generation |
| `ANTHROPIC_API_KEY` | Design briefs and deep market analysis |
| `GROQ_API_KEY` | Fast niche scoring and design concepts |

### Shopify SEO Generator
Fully automated product descriptions, metadata, and tagging powered by AI prior to publishing products to Shopify.

### Automated Order Management
Fetches multi-channel orders from Shopify and merges fulfillment costs from Printful to provide accurate profit tracking.

---

## 🛑 Stopping the Application
To gracefully shut down all backend services, run:
```bash
docker compose down
```
To stop the frontend, simply press `Ctrl+C` in the frontend terminal.
