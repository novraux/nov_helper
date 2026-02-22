"""
Groq client — fast trend scoring + SEO drafting.

=== LLM USAGE STRATEGY (read before adding calls) ===
Tier 1 — Groq / llama-3.1-8b-instant  (FREE tier, very fast, ~6000 tokens/min)
  → Use for: bulk scoring, quick drafts, any task needing many calls
  → Model: "llama-3.1-8b-instant"

Tier 2 — Groq / llama-3.3-70b-versatile  (FREE tier, smarter, slower)
  → Use for: SEO copy refinement, competitor analysis summaries
  → Model: "llama-3.3-70b-versatile"
  → ⚠ watch rate limits: ~6000 tokens/min shared with Tier 1

Tier 3 — Claude (Anthropic)  (PAID — use sparingly)
  → Use for: final SEO polish, design briefs for 7+ scored trends only
  → Never call in a loop without a score gate (e.g. score >= 7)

Tier 4 — OpenAI / DALL-E  (PAID — use only for image generation)
  → Use for: mockup generation, design concept images only

Rule: always try Tier 1 first. Escalate only if quality insufficient.
======================================================
"""
import json
from typing import Optional
from groq import Groq
from openai import OpenAI
from config import settings


client = Groq(api_key=settings.AI_API_KEY)
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if getattr(settings, "OPENAI_API_KEY", None) else None

# Tier 1: fast+free for bulk scoring
GROQ_FAST_MODEL = "llama-3.1-8b-instant"
# Tier 2: smarter for SEO copy / refinement
GROQ_SMART_MODEL = "llama-3.3-70b-versatile"

SCORE_PROMPT = """You are a Print-on-Demand (POD) trend analyst.

Given a trending keyword or phrase, evaluate it for POD product potential.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "score": <integer 0-10>,
  "pod_viability": <float 0-10>,
  "competition_level": "<low|medium|high>",
  "ip_safe": <true|false>,
  "product_suggestions": ["<product1>", "<product2>", "<product3>"],
  "reasoning": "<one sentence explaining the score>"
}}

Scoring criteria:
- 8-10: High demand, unique phrase, low competition, clearly IP safe
- 5-7: Decent demand, moderate competition, likely IP safe
- 2-4: Low demand OR high competition OR IP concerns
- 0-1: No POD value OR clear IP violation (brand names, copyrighted phrases)

Keyword: "{keyword}"
"""


def score_trend(keyword: str) -> Optional[dict]:
    """Score a single trend keyword using Groq with fallback to OpenAI."""
    try:
        response = client.chat.completions.create(
            model=GROQ_FAST_MODEL,
            messages=[
                {"role": "user", "content": SCORE_PROMPT.format(keyword=keyword)}
            ],
            temperature=0.3,
            max_tokens=300,
        )
        raw = response.choices[0].message.content.strip()
        result = json.loads(raw)
        result["model_used"] = "Groq (llama-3.1-8b)"
        return result
    except Exception as e:
        print(f"[Groq] Failed to score '{keyword}', trying fallback: {e}")
        if openai_client:
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "user", "content": SCORE_PROMPT.format(keyword=keyword)}
                    ],
                    temperature=0.3,
                    max_tokens=300,
                )
                raw = response.choices[0].message.content.strip()
                result = json.loads(raw)
                result["model_used"] = "OpenAI (gpt-3.5-turbo)"
                return result
            except Exception as e2:
                print(f"[OpenAI Fallback] Failed to score '{keyword}': {e2}")
        return None


def score_trends_batch(keywords: list[str]) -> list[dict]:
    """Score a list of keywords, returning results with the keyword included."""
    results = []
    for keyword in keywords:
        result = score_trend(keyword)
        if result:
            result["keyword"] = keyword
            results.append(result)
    return results
