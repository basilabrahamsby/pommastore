import asyncio
from app.core.database import AsyncSessionLocal
from app.models.system import SystemSettings
from sqlalchemy import select
import json

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(SystemSettings).where(SystemSettings.key == 'storefront_layout'))
        setting = res.scalar_one_or_none()
        if setting:
            print(json.dumps(setting.value, indent=2))
        else:
            print("No storefront_layout found")

if __name__ == '__main__':
    asyncio.run(main())
