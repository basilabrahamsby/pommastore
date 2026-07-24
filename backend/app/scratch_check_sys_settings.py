import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_factory
from app.models.system import SystemSettings
from sqlalchemy import select

async def main():
    async with async_session_factory() as session:
        result = await session.execute(select(SystemSettings))
        settings = result.scalars().all()
        print("FOUND SETTINGS IN DB:")
        for s in settings:
            print(f"Key: {s.key}, Value: {s.value}")

if __name__ == "__main__":
    asyncio.run(main())
