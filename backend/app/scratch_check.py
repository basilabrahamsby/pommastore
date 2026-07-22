import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import AsyncSessionLocal
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.order import Order, OrderStatusHistory

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Order)
            .where(Order.order_number == "PS-2026-013")
            .options(selectinload(Order.status_history))
        )
        o = res.scalar_one_or_none()
        if o:
            print(f"Order: {o.order_number}")
            print(f"Carrier: {o.carrier}")
            print(f"Tracking: {o.tracking_number}")
            print(f"Status: {o.status}")
            print(f"Payment Status: {o.payment_status}")
            print("History:")
            for h in o.status_history:
                print(f" - {h.status}: {h.notes}")
        else:
            print("Order not found")

if __name__ == "__main__":
    asyncio.run(check())
