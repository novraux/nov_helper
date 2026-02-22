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

### Niche Explorer (Trend Scraper)
- **What it does:** Scrapes Google, TikTok, Pinterest, and Redbubble for trending keywords.
- **How it works:** Keywords are aggregated and scored by Groq (llama-3.1-8b). If Groq rate limits are hit, it automatically falls back to OpenAI (gpt-3.5-turbo). High-scoring trends are deep-analyzed by Claude for design briefs. 
- **Real-time UI:** The progress is streamed directly to the frontend via Server-Sent Events (SSE).

### Styled AI Design Generation
- **What it does:** Directly from the Trend Feed, users can instantly generate custom print-on-demand designs for viral niches.
- **Customizable Styles:** Set stylistic preferences like "Text-Only/Typography," "Graphic-Heavy", "Vintage Retro", or "Minimalist".
- **AI Pipeline:** Uses Groq to brainstorm concepts and write briefs, and DALL-E 3 to generate product mockups and variations that align with the chosen visual aesthetic.

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
