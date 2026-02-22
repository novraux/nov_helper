"""
Claude client — deep analysis for high-scoring trends (7+).
Produces design briefs, target audience profiles, and copy angles.
"""
import anthropic
from config import settings

# Initialize lazily so the app doesn't crash if the key is missing
_client = None


def get_client():
    global _client
    if _client is None:
        if not settings.ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY is not set in .env")
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


DEEP_ANALYSIS_PROMPT = """You are an expert Print-on-Demand brand strategist for Novraux, a premium POD brand.

A trending keyword has scored 7+ on POD viability. Provide a deep analysis to guide design creation.

Return your response in this exact format (use markdown headers exactly as shown):

## Design Brief
[2-3 sentences describing the visual direction: style, mood, typography approach, color palette]

## Target Audience
[Who buys this: age range, interests, values, buying motivation — 2-3 sentences]

## Copy Angles
- [Angle 1: specific phrase or hook for the design]
- [Angle 2: alternative hook]
- [Angle 3: third option]

## Best Products
[Which POD products this works best on and why — t-shirts, hoodies, mugs, posters, etc.]

Trending keyword: "{keyword}"
Groq score: {score}/10
Product suggestions from scoring: {product_suggestions}
"""


def deep_analyze(keyword: str, score: float, product_suggestions: list) -> dict:
    """Run deep Claude analysis on a high-scoring trend."""
    try:
        client = get_client()
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=800,
            messages=[
                {
                    "role": "user",
                    "content": DEEP_ANALYSIS_PROMPT.format(
                        keyword=keyword,
                        score=score,
                        product_suggestions=", ".join(product_suggestions or []),
                    ),
                }
            ],
        )
        full_text = response.content[0].text

        # Parse sections
        sections = {}
        current_section = None
        current_lines = []

        for line in full_text.split("\n"):
            if line.startswith("## "):
                if current_section:
                    sections[current_section] = "\n".join(current_lines).strip()
                current_section = line[3:].strip()
                current_lines = []
            else:
                current_lines.append(line)

        if current_section:
            sections[current_section] = "\n".join(current_lines).strip()

        return {
            "design_brief": sections.get("Design Brief", ""),
            "target_audience": sections.get("Target Audience", ""),
            "deep_analysis": full_text,
        }

    except Exception as e:
        print(f"[Claude] Failed to analyze '{keyword}': {e}")
        return {"design_brief": None, "target_audience": None, "deep_analysis": None}
