import asyncio
import sys
from datetime import datetime
sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as session:
        # Extend active_until to 2026-08-31 23:59:59 for INDEPENDENCE DAY SPECIAL OFFER
        await session.execute(text("""
            UPDATE offers 
            SET active_until = '2026-08-31 23:59:59',
                status = 'Active',
                updated_at = NOW()
            WHERE code = '0988427' OR title LIKE '%INDEPENDENCE%'
        """))
        await session.commit()
        print("✓ Updated expiry for INDEPENDENCE DAY SPECIAL OFFER to 2026-08-31 23:59:59")

        res = await session.execute(text("SELECT id, title, code, status, active_until FROM offers WHERE code = '0988427'"))
        row = res.fetchone()
        if row:
            print("OFFER EXPIRY DETAILS:", dict(row._mapping))

if __name__ == "__main__":
    asyncio.run(main())
