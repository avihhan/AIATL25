import asyncio
from conversation_analysis_agent import ConversationAnalysisAgent, supabase

async def test_latest_call():
    # Step 1: Fetch the latest call (most recent created_at)
    result = await asyncio.to_thread(
        lambda: supabase.table("supplier_calls")
        .select("*")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        print("❌ No supplier_calls found in the database.")
        return

    latest_call = result.data[0]
    call_id = latest_call["id"]
    supplier_name = latest_call.get("supplier_name", "Unknown")

    print(f"🧪 Analyzing LATEST call — {supplier_name} (ID: {call_id})")

    # Step 2: Analyze it
    agent = ConversationAnalysisAgent()
    result = await agent.analyze_call(call_id)

    # Step 3: Print the output
    print("\n📤 Analysis Result:")
    print(result)

if __name__ == "__main__":
    asyncio.run(test_latest_call())
