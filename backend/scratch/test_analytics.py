import asyncio
import sys
sys.path.append('/app')
sys.path.append('.')

from app.core.database import AsyncSessionLocal
from app.api.v1.analytics import get_kpis_report

async def main():
    async with AsyncSessionLocal() as db:
        try:
            res = await get_kpis_report(db=db, _=None)
            print('SUCCESS:', res)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
