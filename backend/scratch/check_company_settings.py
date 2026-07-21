import asyncio
import sys
sys.path.append('/app')
from app.core.database import AsyncSessionLocal
from app.models.system import SystemSettings
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(SystemSettings))
        settings = res.scalars().all()
        for s in settings:
            print('KEY:', s.key)
            print('VALUE:', s.value)
            print('-'*40)

if __name__ == '__main__':
    asyncio.run(main())
