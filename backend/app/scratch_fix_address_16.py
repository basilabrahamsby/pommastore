import asyncio
import sys
import json
sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as session:
        res = await session.execute(text("SELECT id, shipping_address, billing_address FROM orders WHERE order_number LIKE '%016%'"))
        row = res.fetchone()
        if row:
            order_id = row.id
            sa = row.shipping_address or {}
            ba = row.billing_address or {}
            
            if isinstance(sa, dict):
                sa['pincode'] = ''
                if 'full_address' in sa:
                    sa['full_address'] = sa['full_address'].replace(' - 00000', '').replace('00000', '').strip(' ,-')
            
            if isinstance(ba, dict):
                ba['pincode'] = ''
                if 'full_address' in ba:
                    ba['full_address'] = ba['full_address'].replace(' - 00000', '').replace('00000', '').strip(' ,-')

            await session.execute(text("""
                UPDATE orders 
                SET shipping_address = :sa,
                    billing_address = :ba,
                    updated_at = NOW()
                WHERE id = :id
            """), {"sa": json.dumps(sa), "ba": json.dumps(ba), "id": order_id})
            await session.commit()
            print("✓ Cleaned 00000 from Order PS-2026-016 address in DB")

if __name__ == "__main__":
    asyncio.run(main())
