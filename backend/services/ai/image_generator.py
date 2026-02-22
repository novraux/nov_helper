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
        
        # Adjust prompt based on style preference
        style_guidance = ""
        if "Text-Only" in style_preference or "Typography" in style_preference:
            style_guidance = "The design MUST consist ONLY of beautiful typography and text. NO illustrations, NO complex graphics, NO characters. Just the text styled professionally."
        elif "Graphic-Heavy" in style_preference or "Illustration" in style_preference:
            style_guidance = "The design MUST be heavily illustrated with high-quality graphics and minimal, well-integrated text."
        elif "Vintage" in style_preference:
            style_guidance = "The design MUST have a vintage, retro aesthetic with distressed textures and classic retro colors."
        
        # Create a detailed prompt for DALL-E
        prompt = f"""Professional product mockup design for POD e-commerce.
        
Design Theme: {niche}
Product Type: {product_type}
Design Title: {design_title}
Design Concept: {design_concept}
Text on Design: "{design_text}"
Style Preference: {style_preference}

{style_guidance}

Create a professional, market-ready mockup image showing this design on a {product_type}.
- High quality, realistic lighting
- Professional product photography style
- Clear view of the design/text on the product
- Suitable for Etsy/e-commerce listing
- Clean background
- Modern, appealing aesthetic

The design should visually represent: {design_concept}"""

        try:
            response = _get_openai_client().images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
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
