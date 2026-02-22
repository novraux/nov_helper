from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from services.research.competitor_analysis import analyze_redbubble_competitors
from services.research.niche_validator import niche_validator
from services.ai.gap_analyzer import generate_market_gap_report
from services.ai.design_generator import design_generator
from services.ai.image_generator import image_generator

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
@router.post("/niche/analyze")
async def analyze_niche_pod(niche: str, generate_designs: bool = True, style_preference: str = "Balanced"):
    """
    Complete niche analysis for POD including:
    - Market validation
    - Gap analysis
    - Design generation (if enabled)
    Returns everything needed to start creating designs.
    """
    print(f"[Research API] Analyzing niche for POD ({style_preference}): {niche}")
    
    # Step 1: Validate niche across platforms
    validation = await niche_validator.explore_niche(niche)
    
    # Step 2: Generate gap report
    competitors = analyze_redbubble_competitors(niche)
    gap_report = generate_market_gap_report(niche, competitors) if competitors else "No competitor data"
    
    # Step 3: Generate design ideas (if enabled)
    designs = None
    if generate_designs:
        print(f"[Research API] Calling design_generator.generate_design_ideas for {niche} with style {style_preference}")
        designs_result = design_generator.generate_design_ideas(niche, num_ideas=5, style_preference=style_preference)
        print(f"[Research API] Design generation result: {designs_result.get('success')}")
        designs = designs_result if designs_result.get("success") else None
        if designs is None:
            print(f"[Research API] Design generation failed: {designs_result.get('error', 'Unknown error')}")
    
    return {
        "success": True,
        "niche": niche,
        "validation": validation,
        "competitor_count": len(competitors) if competitors else 0,
        "gap_analysis": gap_report,
        "designs": designs,
        "next_step": "Click on a design to generate full brief and listing copy"
    }

@router.post("/design/brief")
async def get_design_brief(niche: str, design_title: str, design_concept: str, style_preference: str = "Balanced"):
    """
    Generate a detailed design brief for a specific design concept.
    Includes target audience, colors, typography, creation instructions.
    """
    print(f"[Research API] Generating brief for design: {design_title} in niche: {niche} ({style_preference})")
    
    brief_result = design_generator.generate_design_brief(niche, design_title, design_concept, style_preference=style_preference)
    
    if not brief_result.get("success"):
        raise HTTPException(status_code=500, detail=brief_result.get("error", "Failed to generate brief"))
    
    return brief_result

@router.post("/design/listing")
async def get_listing_copy(niche: str, design_title: str, design_text: str):
    """
    Generate SEO-optimized Etsy listing title, description, and tags.
    Ready to copy-paste to Etsy.
    """
    print(f"[Research API] Generating listing for: {design_title}")
    
    listing_result = design_generator.generate_listing_description(niche, design_title, design_text)
    
    if not listing_result.get("success"):
        raise HTTPException(status_code=500, detail=listing_result.get("error", "Failed to generate listing"))
    
    return listing_result

@router.post("/design/mockup")
async def generate_design_mockup(
    niche: str,
    design_title: str,
    design_concept: str,
    design_text: str,
    product_type: str,
    style_preference: str = "Balanced"
):
    """
    Generate an AI mockup image of a design on a product.
    Uses DALL-E to create a realistic product mockup for the design.
    """
    print(f"[Research API] Generating mockup image for: {design_title} ({style_preference})")
    
    mockup_result = image_generator.generate_mockup_image(
        design_title=design_title,
        design_concept=design_concept,
        design_text=design_text,
        product_type=product_type,
        niche=niche,
        style_preference=style_preference
    )
    
    if not mockup_result.get("success"):
        # Return with fallback placeholder
        print(f"[Research API] Mockup generation had issues, returning with fallback")
    
    return mockup_result

@router.post("/design/variations")
async def generate_design_variations(
    niche: str,
    design_title: str,
    design_concept: str,
    num_variations: int = 3,
    style_preference: str = "Balanced"
):
    """
    Generate the same design as mockups on multiple product types.
    E.g., t-shirt, mug, hoodie all showing the same design.
    """
    print(f"[Research API] Generating {num_variations} variations ({style_preference}) for: {design_title}")
    
    # Limit variations
    if num_variations < 1 or num_variations > 5:
        num_variations = 3
    
    variations_result = image_generator.generate_product_variations(
        design_title=design_title,
        design_concept=design_concept,
        niche=niche,
        num_variations=num_variations,
        style_preference=style_preference
    )
    
    return variations_result