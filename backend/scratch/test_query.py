import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import engine
from sqlalchemy import text, select, or_, and_, func
from app.models.customer import Customer, CustomerAddress
from app.models.order import Order
from app.core.database import AsyncSessionLocal
from sqlalchemy.orm import selectinload, joinedload

async def main():
    async with AsyncSessionLocal() as db:
        cust_res = await db.execute(select(Customer).where(Customer.email == "basilabrahamsby@gmail.com"))
        customer = cust_res.scalar_one_or_none()
        print("CUSTOMER FOUND:", customer.id if customer else None)
        
        if customer:
            # Query addresses
            addr_res = await db.execute(select(CustomerAddress).where(CustomerAddress.customer_id == customer.id))
            addrs = addr_res.scalars().all()
            print(f"ADDRESSES FOUND ({len(addrs)}):", [a.address_line1 for a in addrs])
            
            # Query orders
            ord_res = await db.execute(
                select(Order)
                .where(
                    or_(
                        Order.customer_id == customer.id,
                        and_(
                            Order.customer_email.isnot(None),
                            func.lower(Order.customer_email) == func.lower(customer.email)
                        ),
                        and_(
                            Order.customer_phone.isnot(None),
                            customer.phone.isnot(None),
                            Order.customer_phone == customer.phone
                        )
                    ),
                    or_(
                        Order.payment_gateway.is_(None),
                        Order.payment_gateway != "razorpay",
                        Order.payment_status != "pending"
                    )
                )
            )
            orders = ord_res.scalars().all()
            print(f"ORDERS FOUND ({len(orders)}):", [o.order_number for o in orders])

if __name__ == "__main__":
    asyncio.run(main())
