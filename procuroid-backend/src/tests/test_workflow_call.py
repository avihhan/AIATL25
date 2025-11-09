import sys, os
from dotenv import load_dotenv

# Add project root to sys.path so imports work
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from src.agents.quotation.quotation_agent import QuotationAgent

# Load .env variables
load_dotenv()

# Dummy supplier
supplier = {
    "id": "test-supplier-001",
    "name": "Tichkule Prodctions Ltd.",
    "phone": os.getenv("TEST_SUPPLIER_PHONE", "+14709299380"),  
    "email": "thedynamic2508@gmail.com",
}

# Dummy product details
product_details = """
High-grade steel bolts, M8 x 40 mm
Quantity: 500 units
Delivery deadline: November 30 2025
"""

if __name__ == "__main__":
    try:
        # Initialize the agent
        agent = QuotationAgent()

        # Request a quote
        result = agent.get_quote(supplier, product_details)

        print("\n=== Test Result ===")
        print(result)

    except Exception as e:
        print(f"❌ Test failed: {e}")
