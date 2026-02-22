from typing import List, Dict, Any
from services.research.competitor_analysis import analyze_etsy_competitors, analyze_redbubble_competitors
from services.ai.gap_analyzer import generate_market_gap_report
import statistics

class NicheValidator:
    """
    Unified service to validate a product niche across multiple marketplaces.
    """
    
    async def explore_niche(self, keyword: str) -> Dict[str, Any]:
        """
        Runs a deep search on Etsy and Redbubble to benchmark competition and find gaps.
        """
        print(f"[Niche Explorer] Starting deep dive for: {keyword}")
        
        # 1. Fetch Competitor Data
        # Note: These are currently synchronous but wrapped for potential async expansion
        etsy_listings = analyze_etsy_competitors(keyword)
        rb_listings = analyze_redbubble_competitors(keyword)
        
        all_listings = etsy_listings + rb_listings
        
        if not all_listings:
            return {
                "success": False,
                "message": "No competitors found for this niche.",
                "keyword": keyword
            }
            
        # 2. Extract Price Metrics
        prices = []
        for l in all_listings:
            try:
                # Basic cleanup of price strings (e.g., "$12.50" -> 12.50)
                price_str = str(l.get("price", "0")).replace("$", "").replace(",", "")
                prices.append(float(price_str))
            except ValueError:
                continue
        
        price_stats = {
            "min": min(prices) if prices else 0,
            "max": max(prices) if prices else 0,
            "avg": statistics.mean(prices) if prices else 0,
            "median": statistics.median(prices) if prices else 0
        }
        
        # 3. Generate Market Gap Report using AI
        # We pass a subset of top listings to the AI to keep context manageable
        report = generate_market_gap_report(keyword, all_listings[:15])
        
        # 4. Calculate Opportunity Score (Initial logic)
        # Higher score if many competitors but AI finds clear gaps
        # Lower score if no one is selling (risk) or everyone is selling exactly the same
        opportunity_score = self._calculate_opportunity_score(len(all_listings), report)
        
        return {
            "success": True,
            "keyword": keyword,
            "listing_count": len(all_listings),
            "price_stats": price_stats,
            "market_gap_report": report,
            "opportunity_score": opportunity_score,
            "platforms": {
                "etsy": len(etsy_listings),
                "redbubble": len(rb_listings)
            },
            "top_competitors": all_listings[:6] # Return few for UI cards
        }

    def _calculate_opportunity_score(self, count: int, report: str) -> int:
        """
        Basic scoring algorithm based on competition volume and AI sentiment.
        """
        score = 50 # Start neutral
        
        # Volume factor
        if count < 5: score -= 10 # Too low (unproven)
        elif count > 50: score -= 15 # Too high (saturated)
        else: score += 10 # Healthy competition (sweet spot)
        
        # AI Sentiment factor (mocked logic for now, could be enhanced by parsing report)
        if "gap" in report.lower() or "unique" in report.lower():
            score += 20
        
        return min(max(score, 0), 100)

niche_validator = NicheValidator()
