import asyncio
from app.core.database import AsyncSessionLocal
from app.models.order import Order
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        q = select(Order).where(Order.order_number == "PS-2026-008")
        order = (await db.execute(q)).scalar_one_or_none()
        if order:
            order.carrier = "Delivery Panda"
            order.tracking_number = "DD317670"
            order.payment_details = {
                **(order.payment_details or {}),
                "carrier": "Delivery Panda",
                "awb_number": "DD317670",
                "awb_pdf": "https://app.deliverypanda.me/webservice/GetPdf/DD317670"
            }
            db.add(order)
            await db.commit()
            print("ORDER PS-2026-008 UPDATED WITH AWB DD317670 IN DB!")

if __name__ == "__main__":
    asyncio.run(main())
