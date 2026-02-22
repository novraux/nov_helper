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


SHOPIFY_SEO_PROMPT = """You are an expert Shopify and Etsy SEO copywriter specialising in Print-on-Demand products.

Given a product title and optional existing description, generate optimised SEO content.

Return ONLY valid JSON (no markdown, no explanation):
{{
  "seo_title": "<up to 70 chars — keyword-rich, natural reading, no keyword stuffing>",
  "meta_description": "<up to 160 chars — compelling, includes main keyword, ends with soft CTA>",
  "product_description": "<2-3 paragraphs of HTML — use <p> and <ul> tags. Focus on benefits, occasion, who it's for. NO generic filler.>",
  "tags": ["<tag1>", "<tag2>", ..., "<tag13 max>"],
  "seo_score": <integer 0-100 — your estimated SEO quality score>,
  "seo_notes": "<1-2 sentences on the main improvements made>"
}}

Product title: "{title}"
Existing description: "{description}"
Platform: {platform}
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

    prompt = SHOPIFY_SEO_PROMPT.format(
        title=title,
        description=description[:500] if description else "None provided",
        platform=platform.capitalize(),
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
