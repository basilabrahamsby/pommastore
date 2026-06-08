from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, AsyncSessionLocal
from app.api.v1.router import api_router
from app.core.deps import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed default data
    await seed_defaults()
    yield
    # Shutdown
    await engine.dispose()


async def seed_defaults():
    from app.models import user, product, inventory, order, customer, offer, system  # Register all models
    from app.core.database import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        from app.models.user import User, UserRole
        from app.core.security import hash_password

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

UPLOAD_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static_uploads"))
os.makedirs(UPLOAD_PATH, exist_ok=True)
app.mount("/static_uploads", StaticFiles(directory=UPLOAD_PATH), name="static_uploads")

app.include_router(api_router)


@app.get("/health")
async def health(_=Depends(get_current_user)):
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
