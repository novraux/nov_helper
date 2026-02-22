from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from services.research.competitor_analysis import analyze_redbubble_competitors
from services.research.niche_validator import niche_validator
from services.ai.gap_analyzer import generate_market_gap_report

router = APIRouter(prefix="/research", tags=["Research"])

@router.get("/gap-analysis")
def get_market_gap(keyword: str, platform: str = "redbubble"):
    """
    Search competitors on a platform and generate an AI market gap report.
    """
    print(f"[Research API] Analyzing market gap for: {keyword} on {platform}")
    
    if platform.lower() == "redbubble":
        competitors = analyze_redbubble_competitors(keyword)
    else:
        # Fallback to redbubble if platform not supported yet
        competitors = analyze_redbubble_competitors(keyword)
        
    if not competitors:
        return {
            "keyword": keyword,
            "report": "No competitor data found. The market may be wide open or extremely niche.",
            "competitors": []
        }
        
    report = generate_market_gap_report(keyword, competitors)
    
    return {
        "keyword": keyword,
        "platform": platform,
        "listing_count": len(competitors),
        "report": report,
        "competitors": competitors[:5] # Return top 5 for reference
    }

@router.post("/explore")
async def explore_niche(keyword: str):
    """
    Perform a unified niche deep dive across Etsy and Redbubble.
    """
    print(f"[Research API] Deep exploration triggered for: {keyword}")
    result = await niche_validator.explore_niche(keyword)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result
