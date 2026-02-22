"""
Design Generator Service
Uses LLMs to generate design ideas, briefs, and mockup descriptions for POD niches.
"""
import os
import json
from typing import Optional
from groq import Groq

# Initialize Groq client (will be created on first use if API key exists)
_groq_client = None

def _get_groq_client():
    """Lazy initialization of Groq client"""
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("AI_API_KEY")
        if not api_key:
            raise ValueError("AI_API_KEY environment variable not set. Please add it to .env")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


class DesignGenerator:
    """Generate design concepts and briefs for POD niches using Groq."""
    
    @staticmethod
    def generate_design_ideas(niche: str, num_ideas: int = 5, style_preference: str = "Balanced") -> dict:
        """
        Generate design ideas for a given niche with a specific style preference.
        Returns: List of design concepts with descriptions.
        """
        print(f"[Design Generator] Starting {style_preference} design generation for niche: {niche}")
        prompt = f"""You are a creative POD (Print-On-Demand) design expert specializing in Etsy.
        
Generate {num_ideas} unique, profitable design ideas for the niche: "{niche}"
The designs MUST strictly follow this visual style preference: {style_preference}.
If the style is "Text-Only/Typography", focus heavily on catchy phrases and font choices rather than illustrations. If it's "Graphic-Heavy/Illustration", focus on the visual art with minimal text.

For each design idea, provide:
1. Design Title (catchy, SEO-friendly)
2. Design Concept (2-3 sentence description)
3. Design Elements (what visual/text elements to include)
4. Target Product (t-shirt, mug, hoodie, etc.)
5. Estimated Demand Score (1-10)
6. Design Text/Phrase (what should appear on the design)

Format as JSON array with these exact fields. Make them POD-ready and copyright-safe.

Example format:
[
  {{
    "title": "Design Title",
    "concept": "Description",
    "elements": ["element1", "element2"],
    "product": "t-shirt",
    "demand_score": 8,
    "design_text": "Text to appear on product"
  }}
]

Niche: {niche}
Generate {num_ideas} designs now:"""

        try:
            message = _get_groq_client().chat.completions.create(
                model="llama-3.1-8b-instant",  # Fast Groq model
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000,
            )
            
            response_text = message.choices[0].message.content.strip()
            print(f"[Design Generator] Got response from Groq, length: {len(response_text)}")
            
            # Extract JSON from response
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                designs = json.loads(json_str)
                print(f"[Design Generator] Successfully parsed {len(designs)} designs")
                return {
                    "success": True,
                    "designs": designs,
                    "niche": niche,
                    "total": len(designs)
                }
            else:
                print(f"[Design Generator] Could not find JSON brackets in response")
                return {
                    "success": False,
                    "error": "Could not parse design ideas",
                    "raw_response": response_text
                }
        except Exception as e:
            print(f"[Design Generator] ERROR: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "niche": niche
            }
    
    @staticmethod
    def generate_design_brief(niche: str, design_title: str, design_concept: str, style_preference: str = "Balanced") -> dict:
        """
        Generate a detailed design brief for a specific design concept.
        Includes target audience, color palette, typography, and creation instructions.
        """
        prompt = f"""You are an expert POD designer creating a detailed design brief for Etsy.

Niche: {niche}
Design Title: {design_title}
Design Concept: {design_concept}
Style Preference: {style_preference}
Ensure the entire brief, especially typography and visual style, adheres to the requested Style Preference.

Generate a detailed design brief including:
1. Target Audience (who will buy this)
2. Color Palette Recommendation (3-5 colors with hex codes)
3. Typography Style (font style and mood)
4. Visual Style (minimalist, vintage, modern, etc.)
5. Key Messages (main copy and supporting text)
6. Design Dimensions (for t-shirts, mugs, etc.)
7. Copyright/IP Considerations
8. Alternative Variations (3 ways to modify this design)
9. Estimated Price Point
10. Marketing Hooks (how to describe this in the listing)

Provide comprehensive but concise guidance for a designer to create this.
Format as JSON with these fields."""

        try:
            message = _get_groq_client().chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000,
            )
            
            response_text = message.choices[0].message.content.strip()
            print(f"[Design Generator] Got brief response from Groq, length: {len(response_text)}")
            
            # Try to extract JSON
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                brief = json.loads(json_str)
                print(f"[Design Generator] Successfully parsed design brief")
                return {
                    "success": True,
                    "brief": brief,
                    "niche": niche,
                    "design_title": design_title
                }
            else:
                print(f"[Design Generator] Could not find JSON braces in brief response")
                return {
                    "success": False,
                    "error": "Could not parse brief",
                    "raw_response": response_text[:500]  # Return first 500 chars
                }
        except Exception as e:
            print(f"[Design Generator] ERROR in generate_design_brief: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "niche": niche
            }
    
    @staticmethod
    def generate_listing_description(niche: str, design_title: str, design_text: str) -> dict:
        """
        Generate SEO-optimized listing description and tags for Etsy.
        """
        prompt = f"""You are an expert Etsy SEO specialist.

Create a high-converting Etsy listing for a POD product.

Niche: {niche}
Design Title: {design_title}
Design Text/Phrase: {design_text}

Generate:
1. Product Title (80 characters max, SEO-optimized)
2. Short Description (2 sentences, benefits-focused)
3. Full Description (5-7 sentences, including use cases, quality, care)
4. Tags (13 tags, mix of broad and long-tail keywords)
5. Category Suggestions (for Etsy)
6. Shipping Details (standard POD info)

Format as JSON with these fields."""

        try:
            message = _get_groq_client().chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500,
            )
            
            response_text = message.choices[0].message.content.strip()
            print(f"[Design Generator] Got listing response from Groq, length: {len(response_text)}")
            
            # Extract JSON
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                listing = json.loads(json_str)
                print(f"[Design Generator] Successfully parsed listing description")
                return {
                    "success": True,
                    "listing": listing,
                    "niche": niche,
                    "design_title": design_title
                }
            else:
                print(f"[Design Generator] Could not find JSON braces in listing response")
                return {
                    "success": False,
                    "error": "Could not parse listing",
                    "raw_response": response_text[:500]
                }
        except Exception as e:
            print(f"[Design Generator] ERROR in generate_listing_description: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "niche": niche
            }


# Singleton instance
design_generator = DesignGenerator()
