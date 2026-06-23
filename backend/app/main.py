from contextlib import asynccontextmanager
import os
import base64
import re
import uuid
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text, select

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


async def clean_base64_images(db):
    from app.models.product import Brand, Category, Product, ProductImage
    from app.models.offer import Offer
    from app.models.loyalty import LoyaltyReward
    
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static_uploads"))
    os.makedirs(upload_dir, exist_ok=True)
    
    def process_base64_string(val: str) -> str:
        if not val or not isinstance(val, str):
            return val
        if val.startswith("data:image/") and ";base64," in val:
            try:
                header, base64_data = val.split(";base64,", 1)
                match = re.search(r"data:image/(\w+)", header)
                ext = match.group(1) if match else "jpg"
                if ext == "jpeg":
                    ext = "jpg"
                
                filename = f"{uuid.uuid4()}.{ext}"
                filepath = os.path.join(upload_dir, filename)
                
                with open(filepath, "wb") as f:
                    f.write(base64.b64decode(base64_data))
                
                print(f"Startup clean: Decoded base64 image and saved to {filename}")
                return f"/static_uploads/{filename}"
            except Exception as e:
                print(f"Startup clean: Failed to decode base64 string: {e}")
                return val
        return val

    def process_image_list(lst):
        if not lst or not isinstance(lst, list):
            return lst, False
        new_list = []
        changed = False
        for item in lst:
            if isinstance(item, str) and item.startswith("data:image/") and ";base64," in item:
                new_val = process_base64_string(item)
                new_list.append(new_val)
                changed = True
            else:
                new_list.append(item)
        return new_list, changed

    def process_gallery_images(gallery):
        if not gallery or not isinstance(gallery, list):
            return gallery, False
        new_gallery = []
        changed = False
        for item in gallery:
            if isinstance(item, dict) and 'image' in item:
                image_val = item['image']
                if isinstance(image_val, str) and image_val.startswith("data:image/") and ";base64," in image_val:
                    new_item = dict(item)
                    new_item['image'] = process_base64_string(image_val)
                    new_gallery.append(new_item)
                    changed = True
                else:
                    new_gallery.append(item)
            else:
                new_gallery.append(item)
        return new_gallery, changed

    # 1. Clean Brands
    brands_res = await db.execute(select(Brand))
    for brand in brands_res.scalars().all():
        updated = False
        for attr in ["logo_url", "banner_url", "brand_banner", "brand_icon"]:
            old_val = getattr(brand, attr)
            if old_val and isinstance(old_val, str) and old_val.startswith("data:image/"):
                setattr(brand, attr, process_base64_string(old_val))
                updated = True
        if brand.gallery:
            new_gallery, changed = process_image_list(brand.gallery)
            if changed:
                brand.gallery = new_gallery
                updated = True
        if updated:
            db.add(brand)

    # 2. Clean Categories
    cats_res = await db.execute(select(Category))
    for cat in cats_res.scalars().all():
        updated = False
        for attr in ["image_url", "banner_url"]:
            old_val = getattr(cat, attr)
            if old_val and isinstance(old_val, str) and old_val.startswith("data:image/"):
                setattr(cat, attr, process_base64_string(old_val))
                updated = True
        if cat.images:
            new_images, changed = process_image_list(cat.images)
            if changed:
                cat.images = new_images
                updated = True
        if updated:
            db.add(cat)

    # 3. Clean Products
    prods_res = await db.execute(select(Product))
    for prod in prods_res.scalars().all():
        if prod.gallery_images:
            new_gallery, changed = process_gallery_images(prod.gallery_images)
            if changed:
                prod.gallery_images = new_gallery
                db.add(prod)

    # 4. Clean ProductImages
    prod_imgs_res = await db.execute(select(ProductImage))
    for pi in prod_imgs_res.scalars().all():
        if pi.url and pi.url.startswith("data:image/"):
            pi.url = process_base64_string(pi.url)
            db.add(pi)

    # 5. Clean Offers
    offers_res = await db.execute(select(Offer))
    for offer in offers_res.scalars().all():
        updated = False
        if offer.banner_url and offer.banner_url.startswith("data:image/"):
            offer.banner_url = process_base64_string(offer.banner_url)
            updated = True
        if offer.images:
            new_images, changed = process_image_list(offer.images)
            if changed:
                offer.images = new_images
                updated = True
        if updated:
            db.add(offer)

    # 6. Clean Loyalty Rewards
    rewards_res = await db.execute(select(LoyaltyReward))
    for reward in rewards_res.scalars().all():
        if reward.image_url and reward.image_url.startswith("data:image/"):
            reward.image_url = process_base64_string(reward.image_url)
            db.add(reward)

    await db.commit()


async def seed_defaults():
    from app.models import user, product, inventory, order, customer, offer, system  # Register all models
    from app.core.database import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
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
        
        # Clean any base64 image uploads in DB
        await clean_base64_images(db)


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
