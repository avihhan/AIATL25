import asyncio
import os
from supabase import create_async_client
from conversation_analysis_agent import ConversationAnalysisAgent
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

agent = ConversationAnalysisAgent()


async def on_new_call(payload):
    """Triggered when a new supplier call is inserted."""
    new_row = payload.get("new", {})
    call_id = new_row.get("id")
    supplier_name = new_row.get("supplier_name", "Unknown")

    print(f"\n🆕 New call detected — {supplier_name} (ID: {call_id})")
    try:
        result = await agent.analyze_call(call_id)
        print("📤 Analysis Result:")
        print(result)
    except Exception as e:
        print(f"❌ Error analyzing call {call_id}: {e}")


async def main():
    print("🟢 Starting Realtime AI Listener...")

    # 1️⃣ Create async Supabase client
    supabase = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Async client created successfully")

    # 2️⃣ Create a realtime channel for supplier_calls
    channel = supabase.realtime.channel("realtime:supplier_calls")

    # 3️⃣ Attach listener for INSERT events
    channel.on_postgres_changes(
        event="INSERT",
        schema="public",
        table="supplier_calls",
        callback=on_new_call
    )

    # 4️⃣ Subscribe to the channel
    await channel.subscribe()
    print("✅ Listening for new supplier_calls inserts...\n")

    # 5️⃣ Heartbeat loop to show script is alive
    try:
        while True:
            print("⏳ Waiting for new calls...")
            await asyncio.sleep(5)
    except KeyboardInterrupt:
        print("\n👋 Stopping realtime listener...")
        await channel.unsubscribe()
        await supabase.realtime.close()


if __name__ == "__main__":
    asyncio.run(main())
