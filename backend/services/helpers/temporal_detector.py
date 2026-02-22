"""
Temporal context detection for trends.
Automatically tags trends with seasonality, holidays, and urgency levels.
"""
from datetime import datetime

HOLIDAY_KEYWORDS = {
    "valentine": ["valentine", "love day", "couple goals", "relationship"],
    "mothers_day": ["mom", "mother", "mama", "mommy"],
    "fathers_day": ["dad", "father", "papa", "daddy"],
    "christmas": ["christmas", "xmas", "santa", "holiday gift"],
    "halloween": ["halloween", "spooky", "witch", "pumpkin"],
    "thanksgiving": ["thanksgiving", "grateful", "turkey"],
    "easter": ["easter", "bunny", "egg hunt"],
    "back_to_school": ["school", "teacher", "student", "college"],
    "new_year": ["new year", "resolution", "2026", "2027"],
    "summer": ["summer", "beach", "vacation", "poolside"],
    "ramadan": ["ramadan", "eid", "iftar"],
}


def detect_temporal_tags(keyword: str, scraped_date: datetime, scrape_count: int = 1) -> list[str]:
    """
    Auto-detect temporal context for a keyword.
    Returns list of tags like: ["Q1", "valentine", "winter", "evergreen"]
    """
    tags = []
    keyword_lower = keyword.lower()

    # Detect holiday association
    for holiday, triggers in HOLIDAY_KEYWORDS.items():
        if any(trigger in keyword_lower for trigger in triggers):
            tags.append(holiday)

    # Detect season
    month = scraped_date.month
    if month in [12, 1, 2]:
        tags.append("winter")
    elif month in [3, 4, 5]:
        tags.append("spring")
    elif month in [6, 7, 8]:
        tags.append("summer")
    else:
        tags.append("fall")

    # Quarter tag
    quarter = (month - 1) // 3 + 1
    tags.append(f"Q{quarter}")

    # Evergreen detection (if seen multiple times across different seasons)
    if scrape_count >= 3:
        tags.append("evergreen")

    return tags


def detect_urgency(temporal_tags: list[str], avg_interest: int, trend_direction: str) -> str:
    """
    Determine urgency level based on temporal context and momentum.
    Returns: "urgent", "plan_ahead", "evergreen", "standard"
    """
    # High interest + rising = urgent
    if avg_interest >= 60 and trend_direction == "rising":
        return "urgent"

    # Holiday coming up in 1-2 months = plan ahead
    current_month = datetime.now().month
    if "valentine" in temporal_tags and current_month == 1:
        return "plan_ahead"
    if "mothers_day" in temporal_tags and current_month in [3, 4]:
        return "plan_ahead"
    if "halloween" in temporal_tags and current_month in [8, 9]:
        return "plan_ahead"
    if "christmas" in temporal_tags and current_month in [9, 10, 11]:
        return "plan_ahead"

    # Evergreen = always relevant
    if "evergreen" in temporal_tags:
        return "evergreen"

    return "standard"


def assign_emoji_tag(keyword: str, temporal_tags: list[str]) -> str:
    """
    Assign a visual emoji tag for quick categorization.
    """
    keyword_lower = keyword.lower()

    # Motivation & mindset
    if any(w in keyword_lower for w in ["motivat", "stoic", "mindset", "discipline", "success"]):
        return "💪 Motivational"

    # Humor
    if any(w in keyword_lower for w in ["funny", "humor", "meme", "joke", "sarcastic"]):
        return "😂 Humor"

    # Animals
    if any(w in keyword_lower for w in ["dog", "cat", "pet", "animal", "puppy", "kitten"]):
        return "🐾 Animals"

    # Love & relationships
    if any(w in keyword_lower for w in ["love", "couple", "relationship", "valentine"]):
        return "❤️ Love"

    # Fitness
    if any(w in keyword_lower for w in ["gym", "workout", "fitness", "muscle", "lift"]):
        return "🏋️ Fitness"

    # Food & drink
    if any(w in keyword_lower for w in ["coffee", "food", "wine", "beer", "pizza"]):
        return "☕ Food & Drink"

    # Fashion & style
    if any(w in keyword_lower for w in ["fashion", "style", "aesthetic", "streetwear"]):
        return "👕 Fashion"

    # Holidays
    if "christmas" in temporal_tags:
        return "🎄 Christmas"
    if "halloween" in temporal_tags:
        return "🎃 Halloween"
    if "valentine" in temporal_tags:
        return "💝 Valentine"

    return "🔍 General"
