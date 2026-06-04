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
        from app.models.inventory import Warehouse
        from app.models.loyalty import LoyaltyReward
        from app.models.product import Category
        from app.core.security import hash_password

        # Create default warehouse
        wh_result = await db.execute(select(Warehouse).limit(1))
        if not wh_result.scalar_one_or_none():
            warehouse = Warehouse(name="Main Warehouse", location="Head Office", is_default=True)
            db.add(warehouse)

        # Create default categories
        cat_result = await db.execute(select(Category).limit(1))
        if not cat_result.scalar_one_or_none():
            categories = [
                Category(name="Men", slug="men", scent_family="Woody, Spice", description="Bold, refined, and masculine scents.", image_url="/placeholder-perfume.png", is_active=True),
                Category(name="Women", slug="women", scent_family="Floral, Sweet", description="Elegant, sensual, and feminine scents.", image_url="/placeholder-perfume.png", is_active=True),
                Category(name="Unisex", slug="unisex", scent_family="Citrus, Fresh", description="Balanced and versatile scents for all.", image_url="/placeholder-perfume.png", is_active=True),
                Category(name="Offers", slug="offers", scent_family="Promotional", description="Exclusive deals and flash sales.", image_url="/placeholder-perfume.png", is_active=True),
                Category(name="Gift Sets", slug="giftsets", scent_family="Curation", description="Pre-packaged designer gift boxes.", image_url="/placeholder-perfume.png", is_active=True),
                Category(name="Luxury Collection", slug="luxury", scent_family="Prestige", description="Niche and high-perfumery custom selections.", image_url="/placeholder-perfume.png", is_active=True)
            ]
            for c in categories:
                db.add(c)

        # Create default rewards
        rw_result = await db.execute(select(LoyaltyReward).limit(1))
        if not rw_result.scalar_one_or_none():
            rewards = [
                LoyaltyReward(
                    name="Premium Discovery Set", 
                    description="A curated selection of 5 signature fragrance samples.", 
                    point_cost=500, 
                    reward_type="product", 
                    image_url="https://images.unsplash.com/photo-1615396899839-c99c121888b0?auto=format&fit=crop&q=80&w=1000"
                ),
                LoyaltyReward(
                    name="Luxury Scented Candle", 
                    description="Hand-poured soy wax candle with rare essential oils.", 
                    point_cost=1000, 
                    reward_type="product", 
                    image_url="https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=1000"
                ),
                LoyaltyReward(
                    name="₹500 Privilege Voucher", 
                    description="Redeemable on any full-size bottle purchase.", 
                    point_cost=500, 
                    reward_type="voucher", 
                    voucher_value=500, 
                    image_url="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1000"
                ),
                LoyaltyReward(
                    name="Gold Tier Membership", 
                    description="Early access to new launches and exclusive member-only events.", 
                    point_cost=2500, 
                    reward_type="voucher", 
                    image_url="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=1000"
                ),
            ]
            for r in rewards:
                db.add(r)

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
