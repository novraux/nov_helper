from typing import List, Dict, Any
import asyncio
from services.research.competitor_analysis import analyze_etsy_competitors, analyze_redbubble_competitors
from services.ai.gap_analyzer import generate_market_gap_report
from services.ai.groq_client import client, GROQ_FAST_MODEL
import statistics
import json

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
        
        # 4. Calculate Opportunity Score using AI
        # Higher score if many competitors but AI finds clear gaps
        opportunity_score = await self._calculate_ai_opportunity_score(keyword, len(all_listings), report)
        
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

    async def _calculate_ai_opportunity_score(self, keyword: str, count: int, report: str) -> int:
        """
        Uses Tier 1 Groq to evaluate the niche potential based on volume and gap analysis.
        """
        if not client:
            return 50

        prompt = f"""
        Evaluate the "POD Opportunity Score" (0-100) for the niche: "{keyword}"
        
        DATA:
        - Competitor Count: {count}
        - Market Gap Report: {report}
        
        SCORING RULES:
        - 80-100: "Goldmine" - High demand, clear underserved gap.
        - 60-79: "High Opportunity" - Healthy competition, strong entry logic.
        - 40-59: "Moderate" - Crowded but possible with high effort.
        - 0-39: "Saturated" or "Unproven" - High risk or zero demand.
        
        Return ONLY a JSON object: {{"score": <int>, "logic": "<one short sentence>"}}
        """

        try:
            # Run in executor because client is synchronous
            loop = asyncio.get_event_loop()
            completion = await loop.run_in_executor(
                None, 
                lambda: client.chat.completions.create(
                    model=GROQ_FAST_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
            )
            data = json.loads(completion.choices[0].message.content)
            return int(data.get("score", 50))
        except Exception as e:
            print(f"[Niche Validator] AI Scoring Error: {e}")
            return 50

niche_validator = NicheValidator()
