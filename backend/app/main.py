from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, AsyncSessionLocal
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed default data
    await seed_defaults()
    yield
    # Shutdown
    await engine.dispose()


async def seed_defaults():
    from app.models import user, product, inventory, order, customer, offer  # Register all models
    from app.core.database import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        from app.models.user import User, UserRole
        from app.models.inventory import Warehouse
        from app.core.security import hash_password

        # Create default warehouse
        wh_result = await db.execute(select(Warehouse).limit(1))
        if not wh_result.scalar_one_or_none():
            warehouse = Warehouse(name="Main Warehouse", location="Head Office", is_default=True)
            db.add(warehouse)

        # Create superadmin
        admin_result = await db.execute(
            select(User).where(User.email == settings.FIRST_SUPERADMIN_EMAIL)
        )
        if not admin_result.scalar_one_or_none():
            admin = User(
                email=settings.FIRST_SUPERADMIN_EMAIL,
                hashed_password=hash_password(settings.FIRST_SUPERADMIN_PASSWORD),
                full_name=settings.FIRST_SUPERADMIN_NAME,
                role=UserRole.superadmin,
                is_active=True,
            )
            db.add(admin)

        await db.commit()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
