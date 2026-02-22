"""
SEO generation service.
Generates Shopify/Etsy-optimized titles, descriptions, and tags from a product concept.

LLM USAGE:
- Draft (all products): Groq llama-3.1-8b-instant (Tier 1 — free, fast)
- Refinement (on request): Groq llama-3.3-70b-versatile (Tier 2 — free, slower)
- Polish (premium mode): Claude claude-3-haiku (Tier 3 — paid, sparingly)
"""
import json
from groq import Groq
from config import settings

client = Groq(api_key=settings.AI_API_KEY)

FAST_MODEL = "llama-3.1-8b-instant"
SMART_MODEL = "llama-3.3-70b-versatile"


# V2 PROMPT: More structured, platform-aware, and enforces POD best practices.
SHOPIFY_SEO_PROMPT = """You are an elite e-commerce SEO specialist specializing in Print-on-Demand (POD).
Your goal is to turn a basic product title into a high-converting listing.

PLATFORM: {platform}
CONTEXT: {context_instr}

### INSTRUCTIONS:
1. PRODUCT TITLE: 
   - Shopify: Clean, punchy, brand-focused. Max 70 chars.
   - Etsy: Keyword-stacked, long-tail focused. Max 140 chars.
2. META DESCRIPTION: Compelling 150-160 chars. Hook the user and end with a soft CTA.
3. PRODUCT DESCRIPTION (structured HTML):
   - Use <p>, <ul>, and <li> tags ONLY. No <h1>/<h2>.
   - Section 1: **Product Highlights** (benefit-driven).
   - Section 2: **Specifications** (Material: 100% cotton/ceramic, Fit: Unisex/Standard).
   - Section 3: **Care Instructions** (Cold wash, low tumble).
   - Section 4: **Gifting & Occasion** (Why this makes a perfect gift).
4. TAGS (Exactly 13 tags):
   - Each tag MUST be under 20 characters (Etsy limit).
   - Mix of niche, occasion, style, and recipient keywords.

Return ONLY valid JSON:
{{
  "seo_title": "string",
  "meta_description": "string",
  "product_description": "string (HTML)",
  "tags": ["tag1", ..., "tag13"],
  "seo_score": number (0-100),
  "seo_notes": "Brief explanation of improvements"
}}

Product Title: "{title}"
Existing Description: "{description}"
"""


def generate_seo(
    title: str,
    description: str = "",
    platform: str = "shopify",
    use_smart_model: bool = False,
) -> dict:
    """
    Generate SEO content for a product.
    By default uses Tier 1 (free, fast). Pass use_smart_model=True for Tier 2.
    """
    model = SMART_MODEL if use_smart_model else FAST_MODEL

    context_instr = (
        "Focus on brand identity and readability. Keep titles clean." 
        if platform.lower() == "shopify" 
        else "Focus on search visibility and long-tail keyword stacking. Use full 140 char limit for titles."
    )

    prompt = SHOPIFY_SEO_PROMPT.format(
        title=title,
        description=description[:500] if description else "None provided",
        platform=platform.capitalize(),
        context_instr=context_instr
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=1200,
        )
        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if model adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        result = json.loads(raw.strip())
        result["model_used"] = model
        return result

    except json.JSONDecodeError as e:
        return {"error": f"JSON parse failed: {e}", "raw": raw[:500]}
    except Exception as e:
        return {"error": str(e)}


def bulk_generate_seo(
    products: list[dict],
    platform: str = "shopify",
    use_smart_model: bool = False,
) -> list[dict]:
    """
    Generate SEO for a list of products.
    Each product dict must have: id, title, body_html (optional).
    Returns list of {product_id, title, seo: {...}} dicts.
    """
    results = []
    for product in products:
        product_id = product.get("id")
        title = product.get("title", "")
        description = product.get("body_html", "")

        print(f"[SEO] Generating for: {title[:60]}")
        seo = generate_seo(title, description, platform, use_smart_model)

        results.append({
            "product_id": product_id,
            "title": title,
            "seo": seo,
        })

    return results
