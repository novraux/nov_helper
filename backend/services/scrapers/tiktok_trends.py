import httpx
import json
import re
from typing import List, Dict, Any

# Target regions for POD (Shopify/Etsy markets)
TARGET_REGIONS = ["US", "GB", "DE", "AU", "CA"]

# Browser-like headers to avoid bot detection
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Referer": "https://ads.tiktok.com/",
}

def scrape_tiktok_hashtags(region: str = "US") -> List[str]:
    """
    Scrape trending hashtags from TikTok Creative Center for a specific region.
    Returns a list of hashtag strings (without #).
    """
    url = f"https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en?region={region}"
    print(f"[TikTok] Scraping trends for region: {region}...")

    try:
        with httpx.Client(headers=HEADERS, timeout=30, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            html = response.text

            # Extract __NEXT_DATA__ JSON
            match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
            if not match:
                print(f"[TikTok] Could not find __NEXT_DATA__ in HTML for {region}")
                return []

            data = json.loads(match.group(1))
            
            # Navigate the JSON structure to find the hashtag list
            # Path: props -> pageProps -> dehydratedState -> queries -> state -> data -> pages -> list
            hashtags = []
            queries = data.get("props", {}).get("pageProps", {}).get("dehydratedState", {}).get("queries", [])
            
            for query in queries:
                data_obj = query.get("state", {}).get("data", {})
                if isinstance(data_obj, dict):
                    # Check for keywords like 'list' or 'pages'
                    pages = data_obj.get("pages", [])
                    if pages and isinstance(pages, list):
                        for page in pages:
                            items = page.get("list", [])
                            if items:
                                for item in items:
                                    name = item.get("hashtagName")
                                    if name:
                                        hashtags.append(name)
            
            print(f"[TikTok] Found {len(hashtags)} trending hashtags for {region}")
            return hashtags

    except Exception as e:
        print(f"[TikTok] Error scraping {region}: {e}")
        return []

def get_all_tiktok_trends() -> List[str]:
    """
    Scrape TikTok trends across all target regions and return a unique list.
    """
    all_hashtags = set()
    for region in TARGET_REGIONS:
        tags = scrape_tiktok_hashtags(region)
        all_hashtags.update(tags)
    
    # Filter out 1-2 character tags or generic ones if necessary
    filtered = [t for t in all_hashtags if len(t) > 2]
    print(f"[TikTok] Total unique trends found: {len(filtered)}")
    return filtered

if __name__ == "__main__":
    # Test script
    results = get_all_tiktok_trends()
    for i, tag in enumerate(results[:20]):
        print(f"{i+1}. #{tag}")
