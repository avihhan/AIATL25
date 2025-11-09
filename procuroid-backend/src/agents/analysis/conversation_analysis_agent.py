"""
ConversationAnalysisAgent: 
Analyzes call transcripts using Google Gemini to extract:
- Quotation details (price, delivery, terms)
- Sentiment analysis
- Key points and concerns
- Meeting scheduling needs
- Comparison metrics
"""

import asyncio
import json
from typing import Dict, List
from datetime import datetime
from google import genai

genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


class ConversationAnalysisAgent:
    """
    Analyzes conversation transcripts and extracts structured data.
    Uses Google Gemini for intelligent parsing.
    """
    
    def __init__(self):
        self.agent_name = "ConversationAnalysisAgent"
    
    async def analyze_conversation(
        self, 
        transcript: str, 
        supplier_name: str,
        product_details: Dict
    ) -> Dict:
        """
        Main analysis method: Extract all relevant information from transcript.
        
        Returns structured data for:
        - Quotation details
        - Meeting requirements
        - Sentiment
        - Key points
        - Comparison metrics
        """
        
        print(f"🔍 Analyzing conversation with {supplier_name}...")
        
        # Run multiple analyses in parallel for speed
        results = await asyncio.gather(
            self._extract_quotation_details(transcript, product_details),
            self._analyze_sentiment(transcript),
            self._extract_key_points(transcript),
            self._detect_meeting_request(transcript),
            self._calculate_comparison_metrics(transcript, product_details)
        )
        
        quotation, sentiment, key_points, meeting_info, metrics = results
        
        # Combine all analyses
        analysis = {
            "supplier_name": supplier_name,
            "timestamp": datetime.now().isoformat(),
            "response_type": self._determine_response_type(quotation, meeting_info),
            "quotation": quotation,
            "sentiment": sentiment,
            "key_points": key_points,
            "meeting_info": meeting_info,
            "comparison_metrics": metrics,
            "transcript": transcript
        }
        
        print(f"  ✓ Analysis completed for {supplier_name}")
        
        return analysis
    
    async def _extract_quotation_details(self, transcript: str, product_details: Dict) -> Dict:
        """Extract pricing, delivery, and terms using AI"""
        
        prompt = f"""
        Analyze this supplier conversation transcript and extract quotation details.
        
        TRANSCRIPT:
        {transcript}
        
        PRODUCT REQUESTED:
        {json.dumps(product_details, indent=2)}
        
        Extract and return ONLY valid JSON with these fields:
        {{
            "has_quotation": true/false,
            "pricing": {{
                "price_per_unit": <number or null>,
                "total_price": <number or null>,
                "currency": "USD",
                "breakdown": "any additional pricing notes"
            }},
            "delivery": {{
                "lead_time_days": <number or null>,
                "estimated_delivery_date": "YYYY-MM-DD or null",
                "shipping_method": "string or null",
                "shipping_cost": <number or null>
            }},
            "terms": {{
                "payment_terms": "string (e.g., Net 30, 50% upfront)",
                "minimum_order_quantity": <number or null>,
                "warranty": "string or null",
                "return_policy": "string or null"
            }},
            "availability": {{
                "in_stock": true/false/null,
                "stock_quantity": <number or null>,
                "can_fulfill": true/false
            }},
            "confidence_score": <0-100 integer>
        }}
        
        If information is not mentioned, use null. Be conservative with confidence score.
        """
        
        try:
            response = await asyncio.to_thread(
                genai_client.models.generate_content,
                model="gemini-2.0-flash-exp",
                contents=prompt
            )
            
            text = response.text.strip()
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            
            return json.loads(text)
            
        except Exception as e:
            print(f"  ⚠️ Quotation extraction failed: {e}")
            return {
                "has_quotation": False,
                "confidence_score": 0,
                "error": str(e)
            }
    
    async def _analyze_sentiment(self, transcript: str) -> Dict:
        """Analyze supplier's sentiment and enthusiasm"""
        
        prompt = f"""
        Analyze the sentiment of this supplier conversation.
        
        TRANSCRIPT:
        {transcript}
        
        Return ONLY valid JSON:
        {{
            "overall_sentiment": "positive|neutral|negative",
            "enthusiasm_level": <1-10 integer>,
            "concerns_raised": ["list", "of", "concerns"],
            "positive_indicators": ["list", "of", "positive", "signals"],
            "negotiation_openness": "high|medium|low",
            "professionalism_score": <1-10 integer>,
            "summary": "brief 1-2 sentence summary"
        }}
        """
        
        try:
            response = await asyncio.to_thread(
                genai_client.models.generate_content,
                model="gemini-2.0-flash-exp",
                contents=prompt
            )
            
            text = response.text.strip()
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            
            return json.loads(text)
            
        except Exception as e:
            print(f"  ⚠️ Sentiment analysis failed: {e}")
            return {
                "overall_sentiment": "neutral",
                "enthusiasm_level": 5,
                "error": str(e)
            }
    
    async def _extract_key_points(self, transcript: str) -> List[str]:
        """Extract main discussion points"""
        
        prompt = f"""
        Extract 3-5 key points from this supplier conversation.
        Focus on important details, commitments, or concerns.
        
        TRANSCRIPT:
        {transcript}
        
        Return ONLY a JSON array of strings:
        ["key point 1", "key point 2", "key point 3"]
        """
        
        try:
            response = await asyncio.to_thread(
                genai_client.models.generate_content,
                model="gemini-2.0-flash-exp",
                contents=prompt
            )
            
            text = response.text.strip()
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            
            return json.loads(text)
            
        except Exception as e:
            print(f"  ⚠️ Key points extraction failed: {e}")
            return []
    
    async def _detect_meeting_request(self, transcript: str) -> Dict:
        """Detect if supplier wants a meeting"""
        
        prompt = f"""
        Analyze if the supplier requested a meeting or follow-up call.
        
        TRANSCRIPT:
        {transcript}
        
        Return ONLY valid JSON:
        {{
            "meeting_requested": true/false,
            "reason": "why they want to meet (or null)",
            "preferred_times": ["list of mentioned times or empty array"],
            "discussion_topics": ["what they want to discuss"],
            "urgency": "high|medium|low|none"
        }}
        """
        
        try:
            response = await asyncio.to_thread(
                genai_client.models.generate_content,
                model="gemini-2.0-flash-exp",
                contents=prompt
            )
            
            text = response.text.strip()
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            
            return json.loads(text)
            
        except Exception as e:
            print(f"  ⚠️ Meeting detection failed: {e}")
            return {
                "meeting_requested": False,
                "urgency": "none"
            }
    
    async def _calculate_comparison_metrics(self, transcript: str, product_details: Dict) -> Dict:
        """Calculate metrics for easy comparison between suppliers"""
        
        prompt = f"""
        Calculate comparison metrics for this supplier conversation.
        
        TRANSCRIPT:
        {transcript}
        
        PRODUCT DETAILS:
        {json.dumps(product_details, indent=2)}
        
        Return ONLY valid JSON:
        {{
            "value_score": <1-100 integer>,
            "reliability_score": <1-100 integer>,
            "responsiveness_score": <1-100 integer>,
            "flexibility_score": <1-100 integer>,
            "overall_recommendation_score": <1-100 integer>,
            "pros": ["list", "of", "advantages"],
            "cons": ["list", "of", "disadvantages"],
            "deal_breakers": ["critical issues or empty array"]
        }}
        
        Scores should be based on:
        - Value: Price competitiveness, terms
        - Reliability: Track record mentions, confidence in delivery
        - Responsiveness: How quickly/clearly they responded
        - Flexibility: Willingness to negotiate, customize
        - Overall: Weighted combination of above
        """
        
        try:
            response = await asyncio.to_thread(
                genai_client.models.generate_content,
                model="gemini-2.0-flash-exp",
                contents=prompt
            )
            
            text = response.text.strip()
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            
            return json.loads(text)
            
        except Exception as e:
            print(f"  ⚠️ Metrics calculation failed: {e}")
            return {
                "value_score": 50,
                "reliability_score": 50,
                "responsiveness_score": 50,
                "flexibility_score": 50,
                "overall_recommendation_score": 50,
                "pros": [],
                "cons": [],
                "deal_breakers": []
            }
    
    def _determine_response_type(self, quotation: Dict, meeting_info: Dict) -> str:
        """Determine final response type"""
        
        if quotation.get("has_quotation") and quotation.get("confidence_score", 0) > 60:
            return "quotation_received"
        elif meeting_info.get("meeting_requested"):
            return "meeting_requested"
        elif quotation.get("availability", {}).get("can_fulfill") == False:
            return "declined"
        else:
            return "unclear"

