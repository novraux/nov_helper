import httpx
import re
from bs4 import BeautifulSoup
from typing import List

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

def scrape_redbubble_popular_tags() -> List[str]:
    """
    Scrape popular tags from Redbubble by looking at 'Popular Designs' sections.
    """
    # Explore page for popular designs
    url = "https://www.redbubble.com/explore/for-you"
    
    print(f"[Redbubble] Scraping popular tags from: {url}...")
    
    try:
        with httpx.Client(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            response = client.get(url)
            if response.status_code != 200:
                print(f"[Redbubble] Error {response.status_code}. Access might be restricted.")
                return []
            
            html = response.text
            # Use BeautifulSoup to find tags or just regex the keywords
            soup = BeautifulSoup(html, "html.parser")
            
            # Often tags are in link elements with 'shop' or 'keywords' in the href
            tags = set()
            
            # Strategy 1: Find all links to search results
            for link in soup.find_all("a", href=re.compile(r"/shop/")):
                text = link.text.strip().lower()
                if len(text) > 3 and "redbubble" not in text and "login" not in text:
                    tags.add(text)
            
            # Strategy 2: Look for 'Trending' or 'Popular' headers and their neighbors
            # (Heuristic based on Redbubble's typical layout)
            
            refined_tags = [t for t in tags if " " in t] # Multi-word tags are better for niches
            if not refined_tags:
                refined_tags = list(tags)
                
            print(f"[Redbubble] Extracted {len(refined_tags)} potential tags/keywords.")
            return refined_tags[:50]

    except Exception as e:
        print(f"[Redbubble] Error during scrape: {e}")
        return []

if __name__ == "__main__":
    tags = scrape_redbubble_popular_tags()
    for i, t in enumerate(tags[:20]):
        print(f"{i+1}. {t}")
