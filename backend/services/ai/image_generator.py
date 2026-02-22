"""
Image Generator Service
Uses DALL-E to generate design mockup images for POD products.
"""
import os
import json
from openai import OpenAI

# Initialize OpenAI client (lazy)
_openai_client = None

def _get_openai_client():
    """Lazy initialization of OpenAI client"""
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set. Please add it to .env")
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


class ImageGenerator:
    """Generate design mockup images using DALL-E."""
    
    @staticmethod
    def generate_mockup_image(
        design_title: str,
        design_concept: str,
        design_text: str,
        product_type: str,
        niche: str,
        style_preference: str = "Balanced"
    ) -> dict:
        """
        Generate a mockup image for a POD design using DALL-E.
        Returns a dict with image URL and metadata.
        """
        print(f"[Image Generator] Creating {style_preference} mockup for: {design_title} ({product_type})")
        
        # Style-specific direction
        style_guidance = ""
        if "Text-Only" in style_preference or "Typography" in style_preference:
            style_guidance = "STYLE: Pure typography composition. NO illustrations, NO icons, NO clipart. The text IS the entire design, styled with beautiful lettering."
        elif "Graphic-Heavy" in style_preference or "Illustration" in style_preference:
            style_guidance = "STYLE: Richly illustrated design with the text seamlessly integrated into the artwork."
        elif "Vintage" in style_preference or "Retro" in style_preference:
            style_guidance = "STYLE: Vintage retro aesthetic. Distressed badge shape, worn textures, classic Americana color palette (cream, burgundy, navy)."
        elif "Minimalist" in style_preference:
            style_guidance = "STYLE: Ultra-clean minimalist design. Maximum white space, single accent color, simple geometric forms."
        else:
            style_guidance = "STYLE: Balanced design combining clean typography with tasteful supporting graphic elements."

        # ── TEXT-FIRST PROMPT STRUCTURE ────────────────────────────────────────
        # DALL-E achieves best text accuracy when:
        # 1. The exact text string appears at the very TOP of the prompt
        # 2. It is wrapped in angle brackets < > which signal verbatim rendering
        # 3. It is written in ALL CAPS in the instruction
        # 4. It is re-affirmed at the bottom of the prompt
        # ────────────────────────────────────────────────────────────────────────
        prompt = f"""TEXT TO RENDER VERBATIM: <{design_text.upper()}>

This is a flat print-on-demand graphic design artwork on a pure white background.

━━━ DESIGN SPECIFICATION ━━━
Niche / Theme: {niche}
Design Title: {design_title}
Visual Concept: {design_concept}
{style_guidance}

━━━ LAYOUT ━━━
- Center the design in the frame.
- The primary wording in the design is the following text, spelled EXACTLY letter-for-letter: "{design_text}"
- Do not add any extra words, do not alter, abbreviate, or paraphrase the text.
- Render all characters in the text with precise letterforms.

━━━ TECHNICAL PRINTFUL REQUIREMENTS ━━━
- Output: a single flat vector-style graphic design (NOT a product mockup).
- Background: solid pure white (#FFFFFF). NO gradients, shadows, or patterns in the background.
- NO t-shirts, mugs, frames, hangers, models, or lifestyle photography.
- High-contrast colors for DTG/screen printing. Scalable, clean linework.
- Single unified design — NO collage, NO grid, NO multiple panels.

FINAL CHECK — the exact text in the design must read: "{design_text}" (copy this exactly, character by character)."""

        try:
            response = _get_openai_client().images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="hd",
                n=1,
            )
            
            image_url = response.data[0].url
            print(f"[Image Generator] Successfully generated image for {design_title}")
            
            return {
                "success": True,
                "image_url": image_url,
                "design_title": design_title,
                "product_type": product_type,
                "niche": niche,
                "prompt_used": prompt[:200] + "..."  # Store first 200 chars for reference
            }
        except Exception as e:
            print(f"[Image Generator] ERROR: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "design_title": design_title,
                "product_type": product_type,
                "niche": niche,
                "fallback_url": f"https://via.placeholder.com/1024x1024?text={design_title.replace(' ', '+')}"
            }
    
    @staticmethod
    def generate_product_variations(
        design_title: str,
        design_concept: str,
        niche: str,
        num_variations: int = 3,
        style_preference: str = "Balanced"
    ) -> dict:
        """
        Generate multiple product variations (same design on different products).
        E.g., same design on t-shirt, mug, hoodie
        """
        print(f"[Image Generator] Creating {num_variations} variations ({style_preference}) for: {design_title}")
        
        # Adjust prompt based on style preference
        style_guidance = ""
        if "Text-Only" in style_preference or "Typography" in style_preference:
            style_guidance = "The design MUST consist ONLY of beautiful typography and text. NO illustrations."
        elif "Graphic-Heavy" in style_preference or "Illustration" in style_preference:
            style_guidance = "The design MUST be heavily illustrated."
        elif "Vintage" in style_preference:
            style_guidance = "The design MUST have a vintage, retro aesthetic."

        product_types = ["t-shirt", "mug", "hoodie", "tote bag", "phone case"][:num_variations]
        variations = []
        
        for product_type in product_types:
            prompt = f"""Professional POD product mockup for e-commerce.
            
Niche: {niche}
Design: {design_title}
Concept: {design_concept}
Product: {product_type}
Style Preference: {style_preference}

{style_guidance}
Generate a high-quality mockup showing this design on a {product_type}.
Professional product photography style, suitable for Etsy listing."""

            try:
                response = _get_openai_client().images.generate(
                    model="dall-e-3",
                    prompt=prompt,
                    size="1024x1024",
                    quality="standard",
                    n=1,
                )
                
                variations.append({
                    "product_type": product_type,
                    "image_url": response.data[0].url,
                    "success": True
                })
                print(f"[Image Generator] Generated variation: {product_type}")
            except Exception as e:
                print(f"[Image Generator] Variation failed for {product_type}: {str(e)}")
                variations.append({
                    "product_type": product_type,
                    "error": str(e),
                    "success": False,
                    "fallback_url": f"https://via.placeholder.com/1024x1024?text={product_type}"
                })
        
        return {
            "success": True,
            "design_title": design_title,
            "niche": niche,
            "variations": variations,
            "total_generated": len([v for v in variations if v.get("success")])
        }


# Singleton instance
image_generator = ImageGenerator()
