import asyncio
import os
from supabase import create_async_client
from conversation_analysis_agent import ConversationAnalysisAgent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

agent = ConversationAnalysisAgent()


async def process_new_calls(supabase):
    """
    Poll supplier_calls table and analyze any calls that
    are not yet in quotation_details.
    """
    print("🔄 Polling for new supplier calls...")

    # Fetch all calls
    calls_result = await supabase.table("supplier_calls").select("*").execute()
    all_calls = calls_result.data or []

    for call in all_calls:
        call_id = call.get("id")
        supplier_name = call.get("supplier_name", "Unknown")

        # Skip if already processed
        existing = await supabase.table("quotation_details").select("id").eq("call_id", call_id).execute()
        if existing.data:
            continue

        print(f"\n🆕 New call detected — {supplier_name} (ID: {call_id})")
        try:
            result = await agent.analyze_call(call_id)
            print("📤 Analysis Result:")
            print(result)
        except Exception as e:
            print(f"❌ Error analyzing call {call_id}: {e}")


async def main():
    print("🟢 Starting Polling AI Listener...")

    supabase = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Async client created successfully")

    try:
        while True:
            await process_new_calls(supabase)
            await asyncio.sleep(5)  # poll every 5 seconds
    except KeyboardInterrupt:
        print("\n👋 Stopping Polling AI Listener...")


if __name__ == "__main__":
    asyncio.run(main())
