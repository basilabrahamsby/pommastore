import sys
import asyncio
sys.path.append('C:\\Developer\\Kozmocart\\backend')

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT COUNT(*) FROM offers"))
        count = res.scalar()
        print(f"Offers count: {count}")
        
        res = await db.execute(text("SELECT * FROM offers"))
        rows = res.fetchall()
        print(f"Offers rows: {len(rows)}")
        for r in rows:
            print(dict(r._mapping))

if __name__ == "__main__":
    asyncio.run(main())
