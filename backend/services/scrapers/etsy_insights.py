import httpx
from typing import List

# Etsy headers to pass as a browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.etsy.com/",
}

def scrape_etsy_suggestions(query: str = "gift for") -> List[str]:
    """
    Get search completion suggestions from Etsy. 
    Ideal for finding 'gift for' niches.
    """
    url = f"https://www.etsy.com/api/v3/ajax/search/completions?query={query}&locale=en-US"
    
    print(f"[Etsy] Fetching suggestions for: '{query}'...")
    try:
        with httpx.Client(headers=HEADERS, timeout=15, follow_redirects=True) as client:
            response = client.get(url)
            if response.status_code != 200:
                print(f"[Etsy] Error {response.status_code}. Etsy might be blocking.")
                return []
            
            data = response.json()
            # Data structure: { "results": [ { "query": "..." }, ... ] }
            results = data.get("results", [])
            keywords = [r.get("query") for r in results if r.get("query")]
            
            print(f"[Etsy] Found {len(keywords)} suggestions.")
            return keywords

    except Exception as e:
        print(f"[Etsy] Scrape error: {e}")
        return []

def get_all_etsy_trends() -> List[str]:
    """
    Scrape multiple Etsy search entry points for broad niche coverage.
    """
    seeds = ["gift for", "custom", "funny", "aesthetic", "vintage"]
    all_keywords = set()
    for seed in seeds:
        all_keywords.update(scrape_etsy_suggestions(seed))
    
    return list(all_keywords)

if __name__ == "__main__":
    trends = get_all_etsy_trends()
    for i, t in enumerate(trends[:20]):
        print(f"{i+1}. {t}")
