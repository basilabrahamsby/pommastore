import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def clear_store_transaction_data():
    """
    Clears all orders, transactions, customer details, sales history, and inventory stock batches/movements.
    Preserves: Products, Product Variants, Images, Brands, Categories, System Settings, Offer definitions, and Admin Users.
    """
    async with AsyncSessionLocal() as db:
        print("--- Starting Pommastore Data Cleanup ---")
        
        # 1. Clear Order & Transaction History
        await db.execute(text("DELETE FROM order_status_history;"))
        await db.execute(text("DELETE FROM order_items;"))
        await db.execute(text("DELETE FROM orders;"))
        print("✔ Cleared all Orders, Order Items, and Status History.")
        
        # 2. Clear Customers & Addresses
        await db.execute(text("DELETE FROM customer_addresses;"))
        await db.execute(text("DELETE FROM customers;"))
        print("✔ Cleared all Customers and Saved Customer Addresses.")
        
        # 3. Clear Inventory Movements & Batches (Stock Ledger)
        await db.execute(text("DELETE FROM inventory_movements;"))
        await db.execute(text("DELETE FROM inventory_batches;"))
        print("✔ Cleared all Inventory Batches and Stock Movements.")
        
        # 4. Reset Offer Performance Metrics (Keep Offer Definitions)
        await db.execute(text("""
            UPDATE offers 
            SET redemption_count = 0, 
                attributed_revenue = 0.00, 
                aov_lift = 0.00, 
                ctr = 0.00;
        """))
        print("✔ Reset Offer Sales & Redemption Counters.")
        
        await db.commit()
        print("--- Pommastore Cleanup Completed Successfully! ---")

if __name__ == "__main__":
    asyncio.run(clear_store_transaction_data())
