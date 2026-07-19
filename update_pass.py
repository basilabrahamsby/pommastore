import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email.in_(['admin@pommastore.in', 'admin@kozmocart.in'])))
        users = res.scalars().all()
        hashed = hash_password('Admin@2026!')
        for u in users:
            u.hashed_password = hashed
            print(f"Updated password for {u.email}")
        await db.commit()

if __name__ == '__main__':
    asyncio.run(main())
