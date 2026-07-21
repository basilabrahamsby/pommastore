import asyncio
import sys
import traceback
sys.path.append('/app')
sys.path.append('.')

from app.core.database import AsyncSessionLocal
from app.models.customer import Customer
from app.models.product import ProductVariant
from app.api.v1.storefront.orders import create_stripe_order, OrderCreate, OrderItemCreate
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        c = (await db.execute(select(Customer))).scalars().first()
        v = (await db.execute(select(ProductVariant))).scalars().first()
        if not c or not v:
            print("CUSTOMER OR VARIANT NOT FOUND")
            return
            
        print(f"TESTING WITH CUSTOMER {c.email} and VARIANT {v.id}")
        body = OrderCreate(
            customer_name="Test Customer",
            customer_email="arunraveendran35@gmail.com",
            customer_phone="9605620416",
            items=[OrderItemCreate(variant_id=v.id, quantity=1, unit_price=float(v.selling_price or 100.0))],
            shipping_amount=17.0,
            payment_method='stripe',
            shipping_address={'address_line1': 'Test St', 'city': 'Dubai', 'pincode': '00000', 'country': 'UAE'}
        )
        try:
            res = await create_stripe_order(body=body, db=db, customer=c)
            print('SUCCESS RES:', res)
        except Exception as e:
            print('ERROR EXCEPTION:', e)
            traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
