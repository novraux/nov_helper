# 🔍 Niche Explorer

The Niche Explorer is the core research engine of Novraux. It handles cross-platform market analysis and AI-powered design brainstorming.

## 🛠 Features

### 1. Unified Market Search
- **Etsy & Redbubble Scraper**: Pulls real-time listing counts and price data.
- **KPI Dash**: Instant view of Avg Price, Market Range, and total listings.

### 2. AI Vibe Score
- A recursive 0–100 score calculating the "profitability" of a niche.
- Takes into account: Competitive density, price spread, and market gaps.

### 3. Market Gap Report
- Direct AI feedback on what's missing in the current top-selling listings.
- Identifies "aesthetic gaps" (e.g., "Too many minimalist designs, try vintage maximalism").

### 4. Style-Specific Design Generation
- **Styles**: Text-Only, Minimalist, Graphic-Heavy, Vintage Retro, Balanced.
- **AI Engine**: Groq (Llama 3.1 8B) for rapid idea generation.
- **Card View**: Each design card includes Demand Score, Concept, Elements, and a phrase.

### 5. 🗂 Save to Vault (Enhanced)
- Direct integration with the **Design Vault**.
- One-click persistence for any generated design idea.

### 6. Design Detail View
- **Mockup Generation**: DALL-E 3 raw graphic generation.
- **Listing Copy**: SEO-optimized Etsy title, tags (13), and descriptions.
- **Product Variations**: Preview your design on Mugs, Hoodies, and Tote Bags.

---

## 📂 Technical Implementation
- **Frontend**: `NicheExplorer.tsx`, `NicheExplorer.module.css`
- **Backend**: `routers/research.py`
- **AI Services**: `niche_validator.py`, `design_generator.py`, `image_generator.py`
