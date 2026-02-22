import httpx
from bs4 import BeautifulSoup
import re
from typing import List, Dict

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
}

def analyze_etsy_competitors(keyword: str) -> List[Dict]:
    """
    Search Etsy for a keyword and extract top listing data for gap analysis.
    """
    query = keyword.replace(" ", "+")
    url = f"https://www.etsy.com/search?q={query}&ref=pagination&page=1"
    
    print(f"[Etsy Analysis] Searching for: {keyword}...")
    
    try:
        with httpx.Client(headers=HEADERS, timeout=30, follow_redirects=True) as client:
            response = client.get(url)
            if response.status_code != 200:
                print(f"[Etsy Analysis] Error {response.status_code}. Blocked or changed.")
                return []
            
            soup = BeautifulSoup(response.text, "html.parser")
            listings = []
            
            # Find listing items - Etsy often uses 'div' with specific classes or data attributes
            # Strategy: Find <a> tags with 'listing-link' or similar
            items = soup.find_all("div", class_=re.compile(r"listing-card|v2-listing-card"))
            
            for item in items[:10]: # Top 10 for analysis
                title_elem = item.find("h3") or item.find("h2")
                price_elem = item.find("span", class_="currency-value")
                
                if title_elem and price_elem:
                    listings.append({
                        "title": title_elem.text.strip(),
                        "price": price_elem.text.strip(),
                        "url": item.find("a")["href"] if item.find("a") else None
                    })
            
            print(f"[Etsy Analysis] Found {len(listings)} listings.")
            return listings

    except Exception as e:
        print(f"[Etsy Analysis] Error: {e}")
        return []

import json

def analyze_redbubble_competitors(keyword: str) -> List[Dict]:
    """
    Search Redbubble for a keyword and extract top listing data from __NEXT_DATA__.
    """
    query = keyword.replace(" ", "+")
    url = f"https://www.redbubble.com/shop/?query={query}&iaCode=all-departments"
    
    print(f"[Redbubble Analysis] Searching for: {keyword}...")
    
    try:
        with httpx.Client(headers=HEADERS, timeout=30, follow_redirects=True) as client:
            response = client.get(url)
            if response.status_code != 200:
                print(f"[Redbubble Analysis] Error {response.status_code}.")
                return []
            
            html = response.text
            # Extract __NEXT_DATA__
            match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
            if not match:
                print("[Redbubble Analysis] Could not find __NEXT_DATA__.")
                return []
            
            data = json.loads(match.group(1))
            
            results = []
            try:
                # Find the search results in the complex JSON structure
                # It's usually in props.pageProps.results
                inventory = data.get('props', {}).get('pageProps', {}).get('results', [])
                if not inventory:
                    # Alternative path
                    inventory = data.get('props', {}).get('pageProps', {}).get('initialState', {}).get('search', {}).get('results', [])
                
                for item in inventory[:15]:
                    inventory_item = item.get("inventoryItem", {})
                    work = inventory_item.get("work", {})
                    price = inventory_item.get("price", {})
                    
                    results.append({
                        "title": work.get("title"),
                        "price": price.get("amount"),
                        "url": inventory_item.get("productPageUrl"),
                        "platform": "redbubble",
                        "tags": work.get("tags", [])
                    })
            except Exception as e:
                print(f"[Redbubble Analysis] JSON parsing error: {e}")
                return []
            
            print(f"[Redbubble Analysis] Found {len(results)} listings via JSON.")
            return results
    except Exception as e:
        print(f"[Redbubble Analysis] Error: {e}")
        return []

if __name__ == "__main__":
    # Test with a common niche
    results = analyze_redbubble_competitors("personalized dog shirt")
    for i, res in enumerate(results):
        print(f"{i+1}. [{res['price']}] {res['title']}")
