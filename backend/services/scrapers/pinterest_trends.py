import httpx
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Target regions for POD
TARGET_REGIONS = ["US", "GB", "DE", "CA", "AU"]

# Browser-like headers
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://trends.pinterest.com/",
    "X-Requested-With": "XMLHttpRequest",
}

def scrape_pinterest_trends(client: httpx.Client, region: str = "US") -> List[str]:
    """
    Scrape trending keywords from Pinterest Trends API using an existing session.
    """
    p_region = "GB+IE" if region == "GB" else region
    
    # Pinterest API can be picky about the endDate. 
    # Let's try omitting it or using a more conservative one if we get 400s.
    # The browser interception used 2026-02-13.
    # We'll use a date from about a week ago to be safe.
    end_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    url = (
        f"https://trends.pinterest.com/top_trends_filtered/"
        f"?lookbackWindow=2&endDate={end_date}&rankingMethod=3"
        f"&country={p_region}&trendsPreset=3&numTermsToReturn=30"
    )
    
    print(f"[Pinterest] Scraping trends for region: {region}...")
    
    try:
        response = client.get(url)
        if response.status_code != 200:
            print(f"[Pinterest] Error {response.status_code} for {region}. Response: {response.text[:100]}")
            return []
            
        data = response.json()
        
        # New logic: access the 'values' key
        values = data.get("values", [])
        if not isinstance(values, list):
            print(f"[Pinterest] Warning: 'values' is not a list for {region}")
            return []

        keywords = [item.get("term") for item in values if isinstance(item, dict) and item.get("term")]
        print(f"[Pinterest] Found {len(keywords)} trends for {region}")
        return keywords

    except Exception as e:
        print(f"[Pinterest] Error scraping {region}: {e}")
        return []

def get_all_pinterest_trends() -> List[str]:
    """
    Initialize session and scrape Pinterest trends across all target regions.
    """
    all_keywords = set()
    
    with httpx.Client(headers=HEADERS, timeout=30, follow_redirects=True) as client:
        try:
            # Initial hit to get cookies and CSRF
            print("[Pinterest] Initializing session...")
            resp = client.get("https://trends.pinterest.com/")
            csrftoken = client.cookies.get("csrftoken")
            if csrftoken:
                client.headers["X-CSRFToken"] = csrftoken
                print("[Pinterest] CSRF token acquired.")
            else:
                print("[Pinterest] Warning: No csrftoken found.")
        except Exception as e:
            print(f"[Pinterest] Initialization failed: {e}")
            return []

        for region in TARGET_REGIONS:
            terms = scrape_pinterest_trends(client, region)
            all_keywords.update(terms)
    
    filtered = [t for t in all_keywords if len(t) > 2]
    print(f"[Pinterest] Total unique trends found: {len(filtered)}")
    return filtered

if __name__ == "__main__":
    # Test script
    results = get_all_pinterest_trends()
    for i, tag in enumerate(results[:20]):
        print(f"{i+1}. {tag}")
