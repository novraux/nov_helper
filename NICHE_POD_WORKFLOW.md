# 🎨 Niche POD Discovery Workflow
> Complete end-to-end guide for finding niches, generating designs, and exporting to Printful

---

## Overview

Your new Novraux Niche Explorer tool enables this workflow:

1. **Search & Validate**: Find a niche, validate it across Etsy/Redbubble
2. **Generate Designs**: AI creates 5 unique design concepts using your LLMs
3. **Generate Briefs**: Detailed design briefs with colors, typography, target audience
4. **Generate Listing Copy**: SEO-optimized Etsy listing titles, tags, and descriptions
5. **Export & Upload**: Download as JSON, then upload to Printful manually

---

## What's New (Implemented Today)

### Backend Services
- ✅ **Design Generator Service** (`backend/services/ai/design_generator.py`)
  - Generates design ideas using Groq AI
  - Creates detailed design briefs (colors, typography, target audience, etc.)
  - Generates SEO-optimized Etsy listing copy with tags

### Backend Endpoints
- ✅ **POST /research/niche/analyze** - Complete niche analysis + design generation
- ✅ **POST /research/design/brief** - Detailed brief for a specific design
- ✅ **POST /research/design/listing** - Etsy listing copy for a design

### Frontend Components
- ✅ **Enhanced NicheExplorer.tsx** - Multi-view UI
  - Search View: Find niches
  - Designs View: Browse 5 AI-generated design ideas as clickable cards
  - Design Detail View: View full brief, listing copy, and export button

### Styling
- ✅ **NicheExplorer.module.css** - Complete styling for new UI

---

## How to Use

### Step 1: Search for a Niche
1. Navigate to the Niche Explorer
2. Enter a niche keyword (e.g., "veterinary technician gifts", "stoic motivational")
3. Click "Search Niche"
4. View market analysis, competition, and pricing data

### Step 2: Click "Generate Designs for This Niche"
1. Click the CTA button after search results
2. Backend will:
   - Validate the niche across Etsy/Redbubble
   - Generate 5 unique design ideas using Groq AI
   - Return designs as clickable cards

### Step 3: Browse Design Ideas
- See 5 design concepts with:
  - Design title
  - Concept description
  - Visual elements
  - Product type (t-shirt, mug, hoodie, etc.)
  - Demand score (1-10)
  - Design text/phrase to appear on product

### Step 4: Click a Design Card
1. Click any design card to view full details
2. Backend generates:
   - **Detailed Design Brief**: Target audience, color palette, typography, style, alternatives
   - **Etsy Listing Copy**: Title, description, tags (ready to copy-paste)

### Step 5: Export & Use in Printful
1. Click "Export Design Package (JSON)"
2. Download design details to your computer
3. Go to Printful and manually create the product:
   - Use the design brief to guide creation
   - Use the listing copy for Etsy description/tags
   - Upload the design image

---

## File Structure

### Backend
```
backend/
├── services/
│   └── ai/
│       ├── design_generator.py          (NEW - Design generation service)
│       ├── gap_analyzer.py
│       └── claude_client.py
├── routers/
│   └── research.py                      (UPDATED - New endpoints)
└── main.py
```

### Frontend
```
frontend/src/
├── pages/
│   └── NicheExplorer.tsx                (UPDATED - Multi-view component)
│   └── NicheExplorer.module.css         (UPDATED - Enhanced styling)
└── api.ts
```

---

## API Endpoints

### 1. Analyze Niche for POD
```
POST /research/niche/analyze?niche={niche}&generate_designs=true

Response:
{
  "success": true,
  "niche": "veterinary technician gifts",
  "validation": { ... market data ... },
  "competitor_count": 45,
  "gap_analysis": "...",
  "designs": {
    "success": true,
    "designs": [
      {
        "title": "Design Title",
        "concept": "Description",
        "elements": ["element1", "element2"],
        "product": "t-shirt",
        "demand_score": 8,
        "design_text": "Text on product"
      },
      ...
    ],
    "total": 5
  }
}
```

### 2. Get Design Brief
```
POST /research/design/brief?niche={niche}&design_title={title}&design_concept={concept}

Response:
{
  "success": true,
  "brief": {
    "target_audience": "...",
    "color_palette": [...],
    "typography_style": "...",
    "visual_style": "...",
    "key_messages": "...",
    "design_dimensions": "...",
    "copyright_considerations": "...",
    "alternative_variations": [...],
    "estimated_price_point": "...",
    "marketing_hooks": "..."
  }
}
```

### 3. Get Listing Copy
```
POST /research/design/listing?niche={niche}&design_title={title}&design_text={text}

Response:
{
  "success": true,
  "listing": {
    "product_title": "...",
    "short_description": "...",
    "full_description": "...",
    "tags": [...13 tags...],
    "category_suggestions": "...",
    "shipping_details": "..."
  }
}
```

---

## LLM Usage

All design generation uses **Groq AI** (from your .env):
- **Model**: `mixtral-8x7b-32768` (fast, cost-effective)
- **Temperature**: 0.7 (creative but consistent)
- **Max Tokens**: 2000-2500 per request

This keeps costs low while maintaining quality.

---

## Workflow Example

### Scenario: Finding Vet Tech Niche

1. **Search**: Enter "veterinary technician gifts"
   - Results: 45 listings, $22 avg price, good opportunity score

2. **Generate Designs**: Click CTA
   - Generates 5 design ideas (e.g., "Vet Tech Hero", "Paws & Scrubs", etc.)

3. **View "Vet Tech Hero"**:
   - Concept: "Powerful imagery celebrating vet techs"
   - Elements: Bold text, stethoscope, paw print, heartbeat line
   - Product: T-shirt
   - Demand: 9/10
   - Text: "VET TECH HERO - SAVING LIVES, ONE PAW AT A TIME"

4. **Click Design Card**:
   - Brief shows: Target nurse/vet tech professionals, use calming blues + bold golds
   - Listing shows SEO-optimized title, description, 13 tags

5. **Export**: Download JSON
   - Includes: design concept, brief, listing copy, all structured data

6. **Upload to Printful**:
   - Create t-shirt product in Printful
   - Use brief for design creation
   - Copy listing data to Etsy

---

## Next Steps (Future Enhancements)

1. **Image Generation**: Use DALL-E (OpenAI) to auto-generate design mockups
2. **Printful API Integration**: Automate product creation from JSON export
3. **Shopify Integration**: Auto-import products to Shopify with Printful sync
4. **Niche Favorites**: Save favorite niches for quick reference
5. **Design Variations**: Generate multiple color/style variants of same design
6. **Performance Tracking**: Track which designs sell, feed data back to AI for optimization

---

## Troubleshooting

### "Failed to generate designs"
- Check .env has valid GROQ API key: `AI_API_KEY`
- Ensure niche name is clear and specific
- Try simpler niche keyword if AI struggles with complex ones

### "Failed to fetch design details"
- Ensure backend is running on http://localhost:8000
- Check browser console for CORS errors
- Verify all 3 endpoints are working:
  - `/research/niche/analyze`
  - `/research/design/brief`
  - `/research/design/listing`

### "Export button disabled"
- Make sure design brief AND listing copy both loaded successfully
- Both requests must complete before export is enabled

---

## Quick Start Checklist

- [ ] Backend running: `python main.py` in `/backend`
- [ ] Frontend running: `npm run dev` in `/frontend`
- [ ] .env has valid `AI_API_KEY` (Groq)
- [ ] Database populated with scraped trends (or manually enter niche)
- [ ] Open http://localhost:5173 → Navigate to NicheExplorer
- [ ] Search a niche → Click "Generate Designs" → Browse results

---

*Document created: Feb 22, 2026 | Novraux Niche POD Tool*
