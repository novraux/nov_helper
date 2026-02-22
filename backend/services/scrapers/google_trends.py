"""
Google Trends scraper using pytrends.
No API key required — uses the unofficial Google Trends API.

NOTE: The `trending_searches` endpoint is unreliable (returns 404 for many regions).
We rely primarily on `related_queries` from POD seed keywords, which is more stable.
"""
from pytrends.request import TrendReq
from pytrends.exceptions import TooManyRequestsError
import time
import random


# POD-relevant seed categories to explore
POD_SEED_KEYWORDS = [
    # Mindset & motivation
    "stoic quotes", "motivational phrases", "self improvement",
    # Gym / fitness
    "gym motivation quotes", "workout motivation", "fitness lifestyle",
    # Lifestyle niches
    "coffee lover", "introvert gifts", "cat mom gifts",
    # Fashion / streetwear
    "minimalist style", "aesthetic fashion", "vintage streetwear",
    # Occasions
    "mothers day gift ideas", "fathers day gifts",
    # Emerging niches
    "dark humor", "cottagecore aesthetic", "retrowave",
    # POD proven niches
    "funny dog shirts", "nurse appreciation gifts", "teacher gifts",
]


def get_related_queries(keywords: list[str], timeframe: str = "now 7-d", geo: str = "") -> list[str]:
    """
    Fetch related rising queries for given seed keywords.
    Returns a deduplicated list of trending phrase strings.
    """
    pytrends = TrendReq(hl="en-US", tz=0, timeout=(10, 25), retries=2, backoff_factor=0.5)
    all_phrases = []

    # Process in batches of 1 (most reliable way to avoid quota issues)
    for keyword in keywords:
        try:
            pytrends.build_payload([keyword], timeframe=timeframe, geo=geo)
            related = pytrends.related_queries()

            if keyword in related:
                rising_df = related[keyword].get("rising")
                top_df = related[keyword].get("top")

                if rising_df is not None and not rising_df.empty:
                    all_phrases.extend(rising_df["query"].tolist()[:5])  # top 5 rising only
                elif top_df is not None and not top_df.empty:
                    all_phrases.extend(top_df["query"].tolist()[:5])  # fallback to top

            # Polite delay — avoids rate-limiting from Google
            time.sleep(random.uniform(2.5, 5.0))

        except TooManyRequestsError:
            print(f"[Google Trends] Rate limited on '{keyword}', sleeping 90s...")
            time.sleep(90)
        except Exception as e:
            print(f"[Google Trends] Error on '{keyword}': {e}")
            time.sleep(3)

    # Deduplicate and clean
    seen = set()
    unique = []
    for phrase in all_phrases:
        if phrase:
            cleaned = phrase.strip().lower()
            if cleaned and cleaned not in seen:
                seen.add(cleaned)
                unique.append(phrase.strip())

    return unique


def scrape_google_trends(custom_seeds: list[str] | None = None) -> list[str]:
    """
    Main entry point: scrape Google Trends.
    Returns a list of trending keyword/phrase strings ready for AI scoring.
    Limits to first 6 seeds per run to keep execution under 2 minutes.
    """
    seeds = custom_seeds or POD_SEED_KEYWORDS

    # Rotate through seeds each run (6 per call to stay fast)
    batch = seeds[:6]
    print(f"[Google Trends] Scraping {len(batch)} seed keyword groups...")

    related = get_related_queries(batch)
    print(f"[Google Trends] Found {len(related)} unique keywords")
    return related
