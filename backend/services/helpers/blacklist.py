"""
Keyword blacklist to avoid wasting API calls on known-bad keywords.
Filters out brand names, copyrighted content, and high-risk terms.
"""

# Known brand names and copyrighted terms
BRAND_BLACKLIST = {
    "nike", "adidas", "puma", "reebok", "under armour",
    "disney", "marvel", "dc comics", "star wars", "harry potter",
    "netflix", "spotify", "amazon", "apple", "google",
    "coca cola", "pepsi", "starbucks", "mcdonalds", "mcdonald's",
    "gucci", "prada", "louis vuitton", "chanel",
    "fortnite", "minecraft", "pokemon", "roblox",
    "playstation", "xbox", "nintendo",
    "supreme", "rolex", "ferrari", "porsche",
    "coca-cola", "red bull", "monster energy",
}

# Profanity and offensive terms (add as needed)
OFFENSIVE_BLACKLIST = {
    # Add specific terms as you encounter them
    # Keep this list private and update as needed
}

# Medical/legal risk terms
MEDICAL_BLACKLIST = {
    "cure", "treat", "diagnose", "medical", "doctor",
    "prescription", "medicine", "drug", "therapy",
    "lose weight fast", "guaranteed results", "miracle cure",
    "fda approved", "clinical", "pharmaceutical",
}


def is_blacklisted(keyword: str) -> tuple[bool, str]:
    """
    Check if keyword should be blacklisted.
    Returns: (is_blacklisted: bool, reason: str)

    Usage:
        blocked, reason = is_blacklisted("nike shoes")
        if blocked:
            print(f"Skipping: {reason}")
    """
    keyword_lower = keyword.lower()

    # Check brands
    for brand in BRAND_BLACKLIST:
        if brand in keyword_lower:
            return (True, f"brand_violation:{brand}")

    # Check offensive
    for term in OFFENSIVE_BLACKLIST:
        if term in keyword_lower:
            return (True, "offensive_content")

    # Check medical claims
    for term in MEDICAL_BLACKLIST:
        if term in keyword_lower:
            return (True, "medical_claim_risk")

    return (False, "")


def filter_blacklisted_keywords(keywords: list[str]) -> tuple[list[str], list[dict]]:
    """
    Filter a list of keywords, removing blacklisted ones.

    Returns:
        (clean_keywords, blocked_info)

    Example:
        clean, blocked = filter_blacklisted_keywords(["stoic quotes", "nike swoosh"])
        # clean = ["stoic quotes"]
        # blocked = [{"keyword": "nike swoosh", "reason": "brand_violation:nike"}]
    """
    clean = []
    blocked = []

    for keyword in keywords:
        is_blocked, reason = is_blacklisted(keyword)
        if is_blocked:
            blocked.append({"keyword": keyword, "reason": reason})
        else:
            clean.append(keyword)

    return clean, blocked
