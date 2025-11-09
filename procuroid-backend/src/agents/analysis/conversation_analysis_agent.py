"""
conversation_analysis_agent.py
Analyzes supplier call transcripts and extracts quotation information.
Saves results to quotation_details table using Google Gemini API.
"""

import os
import json
import asyncio
from typing import Dict, Optional, List
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from supabase import create_client, Client

load_dotenv()

# Initialize clients
genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


class ConversationAnalysisAgent:
    """Analyzes supplier call transcripts and extracts quotation details"""
    
    def __init__(self):
        self.model = "gemini-2.0-flash-exp"
    
    async def analyze_call(self, call_id: str, user_id: Optional[str] = None) -> Dict:
        """
        Analyze a single supplier call and extract quotation details.
        
        Args:
            call_id: ID of the call in supplier_calls table
            user_id: Optional user ID who triggered the analysis
            
        Returns:
            Dict with success status and extracted information
        """
        try:
            # Fetch the call record
            result = await asyncio.to_thread(
                lambda: supabase.table("supplier_calls")
                .select("*")
                .eq("id", call_id)
                .single()
                .execute()
            )
            
            call_data = result.data
            
            if not call_data:
                return {"success": False, "error": "Call not found"}
            
            transcript = call_data.get("transcript")
            supplier_name = call_data.get("supplier_name", "Unknown")
            supplier_id = call_data.get("supplier_id")
            job_id = call_data.get("job_id")
            
            if not transcript:
                return {"success": False, "error": "No transcript available"}
            
            print(f"🔍 Analyzing {supplier_name} call...")
            
            # Extract information using Gemini AI
            extracted_info = await self._extract_quotation_details(transcript, supplier_name)
            
            # Save to quotation_details table
            await self._save_quotation_details(
                call_id=call_id,
                supplier_id=supplier_id,
                job_id=job_id,
                supplier_name=supplier_name,
                extracted_info=extracted_info,
                user_id=user_id
            )
            
            # Format output message
            price_msg = f"${extracted_info['price_per_unit']}/unit" if extracted_info['price_per_unit'] else "No price"
            delivery_msg = extracted_info.get('delivery_date', 'No delivery info') or "No delivery info"

            
            print(f"✅ {supplier_name}: {price_msg} | {delivery_msg} | Sentiment: {extracted_info['sentiment_score']}/10 | Confidence: {extracted_info['confidence_score']}/10")
            
            return {
                "success": True,
                "call_id": call_id,
                "supplier_name": supplier_name,
                "extracted_info": extracted_info
            }
            
        except Exception as e:
            print(f"❌ Error analyzing call {call_id}: {e}")
            return {"success": False, "error": str(e)}
    
    async def _extract_quotation_details(self, transcript: str, supplier_name: str) -> Dict:
        """
        Use Gemini AI to extract quotation details from transcript.
        Only extracts the required fields.
        """
        
        prompt = f"""
Analyze this supplier phone call transcript and extract quotation information.

SUPPLIER: {supplier_name}

TRANSCRIPT:
{transcript}

Extract and return ONLY valid JSON with these exact fields:

{{
    "price_per_unit": <number or null>,
    "minimum_quantity": <integer or null>,
    "quantity_required": <integer or null>,
    "delivery_date": "YYYY-MM-DD or null",
    "payment_terms": "string or null",
    "sentiment_score": <1-10 integer>,
    "confidence_score": <1-10 integer>
}}

FIELD DEFINITIONS:

1. price_per_unit: The price for ONE unit of the product (extract the per-unit cost)

2. minimum_quantity: The minimum order quantity the supplier requires

3. quantity_required: The quantity the buyer requested in the call

4. delivery_date: Extract exact delivery date if mentioned, format as YYYY-MM-DD
   - If they say "2 weeks", calculate from today
   - If they say "by end of month", use last day of current month
   - If only timeframe given (no exact date), use null

5. payment_terms: Payment conditions
   - Examples: "Net 30", "50% upfront, 50% on delivery", "COD", "Payment on delivery"
   - Extract exactly as stated

6. sentiment_score: Rate 1-10 how positive/enthusiastic the supplier was
   * 1-3: Negative, reluctant, unhelpful
   * 4-6: Neutral, professional but not enthusiastic  
   * 7-8: Positive, helpful, engaged
   * 9-10: Very enthusiastic, eager to work with you

7. confidence_score: Rate 1-10 how confident you are in the extracted data
   * 1-3: Very uncertain, missing key information
   * 4-6: Moderate confidence, some details unclear
   * 7-8: High confidence, most details clear
   * 9-10: Very confident, all details explicitly stated

IMPORTANT:
- If information is not mentioned in the transcript, use null
- Be honest and conservative with confidence_score
- Do not make assumptions or infer information not in the transcript
"""

        try:
            response = await asyncio.to_thread(
                genai_client.models.generate_content,
                model=self.model,
                contents=prompt
            )
            
            # Extract JSON from response
            text = response.text.strip()
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            extracted_data = json.loads(text)
            
            # Ensure all required fields exist with validation
            result = {
                "price_per_unit": extracted_data.get("price_per_unit"),
                "minimum_quantity": extracted_data.get("minimum_quantity"),
                "quantity_required": extracted_data.get("quantity_required"),
                "delivery_date": extracted_data.get("delivery_date"),
                "payment_terms": extracted_data.get("payment_terms"),
                "sentiment_score": max(1, min(10, extracted_data.get("sentiment_score", 5))),
                "confidence_score": max(1, min(10, extracted_data.get("confidence_score", 5)))
            }
            
            return result
            
        except Exception as e:
            print(f"❌ Extraction failed: {e}")
            # Return default values on error
            return {
                "price_per_unit": None,
                "minimum_quantity": None,
                "quantity_required": None,
                "delivery_date": None,
                "payment_terms": None,
                "sentiment_score": 5,
                "confidence_score": 1
            }
    
    async def _save_quotation_details(
        self, 
        call_id: str,
        supplier_id: str,
        job_id: str,
        supplier_name: str,
        extracted_info: Dict,
        user_id: Optional[str] = None
    ):
        """Save extracted quotation details to database"""
        
        quotation_data = {
            "call_id": call_id,
            "supplier_id": supplier_id,
            "job_id": job_id,
            "supplier_name": supplier_name,
            "price_per_unit": extracted_info["price_per_unit"],
            "minimum_quantity": extracted_info["minimum_quantity"],
            "quantity_required": extracted_info["quantity_required"],
            "delivery_date": extracted_info["delivery_date"],
            "payment_terms": extracted_info["payment_terms"],
            "sentiment_score": extracted_info["sentiment_score"],
            "confidence_score": extracted_info["confidence_score"],
            "extraction_method": "gemini_ai",
            "status": "extracted",
            "extracted_by": user_id,
            "created_at": datetime.now().isoformat()
        }
        
        # Check if quotation already exists for this call
        existing = await asyncio.to_thread(
            lambda: supabase.table("quotation_details")
            .select("id")
            .eq("call_id", call_id)
            .execute()
        )
        
        if existing.data:
            # Update existing record
            await asyncio.to_thread(
                lambda: supabase.table("quotation_details")
                .update(quotation_data)
                .eq("call_id", call_id)
                .execute()
            )
            print(f"  ↻ Updated existing quotation")
        else:
            # Insert new record
            await asyncio.to_thread(
                lambda: supabase.table("quotation_details")
                .insert(quotation_data)
                .execute()
            )
            print(f"  ✓ Created new quotation")
    
    async def analyze_all_pending_calls(self, job_id: Optional[str] = None, user_id: Optional[str] = None) -> Dict:
        """
        Analyze all supplier calls that haven't been processed yet.
        
        Args:
            job_id: Optional job ID to filter calls
            user_id: Optional user ID who triggered the analysis
            
        Returns:
            Dict with processing statistics
        """
        try:
            # Get all call IDs
            query = supabase.table("supplier_calls").select("id")
            
            # Filter by job if provided
            if job_id:
                query = query.eq("job_id", job_id)
            
            calls_result = await asyncio.to_thread(lambda: query.execute())
            call_ids = [call["id"] for call in calls_result.data]
            
            if not call_ids:
                print("✓ No calls found")
                return {"processed": 0, "results": []}
            
            # Get existing quotation_details to find pending calls
            existing_result = await asyncio.to_thread(
                lambda: supabase.table("quotation_details")
                .select("call_id")
                .in_("call_id", call_ids)
                .execute()
            )
            
            existing_call_ids = {q["call_id"] for q in existing_result.data}
            pending_call_ids = [cid for cid in call_ids if cid not in existing_call_ids]
            
            if not pending_call_ids:
                print("✓ No pending calls to analyze")
                return {"processed": 0, "results": []}
            
            print(f"📞 Analyzing {len(pending_call_ids)} supplier calls...\n")
            
            # Process each pending call
            results = []
            for call_id in pending_call_ids:
                result = await self.analyze_call(call_id, user_id)
                results.append(result)
                
                # Small delay between API calls to avoid rate limits
                await asyncio.sleep(1)
            
            successful = len([r for r in results if r.get("success")])
            print(f"\n✅ Completed: {successful}/{len(pending_call_ids)} calls analyzed successfully")
            
            return {
                "processed": len(pending_call_ids),
                "successful": successful,
                "results": results
            }
            
        except Exception as e:
            print(f"❌ Batch processing error: {e}")
            return {"processed": 0, "error": str(e)}
    
    async def get_quotation_summary(self, job_id: str) -> List[Dict]:
        """
        Get a summary of all quotations for a job, sorted by price.
        
        Args:
            job_id: The procurement job ID
            
        Returns:
            List of quotation details
        """
        try:
            result = await asyncio.to_thread(
                lambda: supabase.table("quotation_details")
                .select("*")
                .eq("job_id", job_id)
                .order("price_per_unit", desc=False)
                .execute()
            )
            
            quotations = result.data
            
            if not quotations:
                print(f"No quotations found for job {job_id}")
                return []
            
            print(f"\n📊 Quotation Summary for Job {job_id}")
            print("=" * 100)
            
            for q in quotations:
                price = f"${q['price_per_unit']}/unit" if q['price_per_unit'] else "No price"
                delivery = q['delivery_date'] if q['delivery_date'] else "TBD"
                sentiment_emoji = "😊" * (q['sentiment_score'] // 2) if q['sentiment_score'] else "❓"
                confidence = f"{q['confidence_score']}/10"
                
                print(f"• {q['supplier_name']:30} | {price:15} | {delivery:12} | Confidence: {confidence:5} | {sentiment_emoji}")
                
                if q['payment_terms']:
                    print(f"  💳 Payment: {q['payment_terms']}")
                if q['minimum_quantity']:
                    print(f"  📦 Min Qty: {q['minimum_quantity']}")
                print()
            
            return quotations
            
        except Exception as e:
            print(f"❌ Error getting quotation summary: {e}")
            return []


# Example usage
async def main():
    agent = ConversationAnalysisAgent()
    
    # Option 1: Analyze a single call
    # result = await agent.analyze_call("call-id-here")
    # print(json.dumps(result, indent=2))
    
    # Option 2: Analyze all pending calls
    result = await agent.analyze_all_pending_calls()
    
    # Option 3: Analyze calls for a specific job
    # result = await agent.analyze_all_pending_calls(job_id="job-123")
    
    # Option 4: Get quotation summary for comparison
    # quotations = await agent.get_quotation_summary(job_id="job-123")


if __name__ == "__main__":
    asyncio.run(main())