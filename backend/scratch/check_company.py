import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import AsyncSessionLocal
from app.models.system import SystemSettings
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(SystemSettings).where(SystemSettings.key == 'company'))
        comp = res.scalar_one_or_none()
        print('COMPANY SETTINGS IN DB:', comp.value if comp else 'NONE')

if __name__ == '__main__':
    asyncio.run(main())
