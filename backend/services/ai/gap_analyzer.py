from typing import List, Dict
from config import settings
from groq import Groq

# Initialize Groq client
client = Groq(api_key=settings.AI_API_KEY) if settings.AI_API_KEY else None

def generate_market_gap_report(keyword: str, competitors: List[Dict]) -> str:
    """
    Analyzes competitor data and generates a "Market Gap" report using Groq.
    """
    if not client:
        return "Groq API key not configured."
    
    if not competitors:
        return f"No competitor data found for '{keyword}'. Market may be wide open or extremely niche."

    # Format competitor data for the prompt
    comp_context = ""
    for i, c in enumerate(competitors[:10]):
        comp_context += f"- Title: {c['title']}, Price: {c['price']}\n"

    prompt = f"""
    Analyze the following competitor data for the POD niche: "{keyword}"
    
    COMPETITOR LISTINGS:
    {comp_context}
    
    TASK:
    Identify a "Market Gap" where a new seller could enter and stand out. 
    Consider:
    1. Visual Style (Are they all quotes? All illustrations?)
    2. Pricing Strategy (Is there a premium or budget gap?)
    3. Messaging/Angle (What's missing? Personalized vs generic?)
    
    FORMAT:
    Return a concise report with:
    - Saturated Elements: (What everyone is doing)
    - The Gap: (One clear opportunity)
    - Recommended Angle: (Concrete advice for the next design)
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Error generating gap report: {e}"

if __name__ == "__main__":
    # Test with sample data
    test_keyword = "personalized dog shirt"
    test_comps = [
        {"title": "Best Dog Dad Ever Funny", "price": "25.00"},
        {"title": "Custom Pet Portrait Minimalist", "price": "45.00"},
        {"title": "I love my dog quote t-shirt", "price": "22.00"}
    ]
    print(generate_market_gap_report(test_keyword, test_comps))
