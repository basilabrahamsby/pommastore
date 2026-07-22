import asyncio, json
from app.services.delivery_panda import book_delivery_panda_shipment
from app.core.database import AsyncSessionLocal
from app.models.order import Order
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        q = select(Order).where(Order.order_number == "PS-2026-008")
        order = (await db.execute(q)).scalar_one_or_none()
        if order:
            print("Booking Delivery Panda shipment for PS-2026-008...")
            res = await book_delivery_panda_shipment(order)
            print("DELIVERY PANDA BOOKING RESPONSE:")
            print(json.dumps(res, indent=2))
            
            if res.get("status") == "success":
                order.carrier = "Delivery Panda"
                order.tracking_number = res.get("awb_number")
                order.payment_details = {
                    **(order.payment_details or {}),
                    "awb_number": res.get("awb_number"),
                    "awb_pdf": res.get("awb_pdf"),
                    "carrier": "Delivery Panda"
                }
                db.add(order)
                await db.commit()
                print("ORDER UPDATED IN DB WITH AWB:", res.get("awb_number"))

if __name__ == "__main__":
    asyncio.run(main())
