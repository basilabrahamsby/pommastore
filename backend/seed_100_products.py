import asyncio
import sys
import random
import uuid
from datetime import datetime

# Add backend directory to python path
sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from app.models.product import Product, ProductVariant, ProductImage, Brand, Category, GenderType, ConcentrationType
from app.models.inventory import Warehouse, Supplier, InventoryBatch
from sqlalchemy import select

# Beautiful perfume images from Unsplash
UNSPLASH_PERFUMES = [
    "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1592945409746-8568e64c120d?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1588405748373-122b25c86a89?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1590156546746-c2240b52c1e1?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1615655096345-61a54750068d?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=600"
]

ADJECTIVES = ["Royal", "Imperial", "Midnight", "Golden", "Velvet", "Mystic", "Sovereign", "Secret", "Opal", "Celestial", "Vintage", "Luminous", "Dark", "Noble", "Wild"]
NOUNS = ["Oud", "Amber", "Rose", "Jasmine", "Sandalwood", "Patchouli", "Musk", "Bergamot", "Saffron", "Vanilla", "Iris", "Leather", "Vetiver", "Citrus", "Cedar"]
SUFFIXES = ["Noir", "Elixir", "Intense", "Absolute", "Reserve", "Essence", "Private Blend", "Eau", "Signature", "Nectar"]

TOP_NOTES = ["Bergamot", "Lemon", "Mandarin", "Grapefruit", "Neroli", "Lime", "Pink Pepper", "Cardamom", "Saffron", "Mint", "Pear", "Apple"]
HEART_NOTES = ["Turkish Rose", "Jasmine Sambac", "Lavender", "Geranium", "Patchouli", "Violet", "Iris", "Cinnamon", "Nutmeg", "Ginger", "Orange Blossom"]
BASE_NOTES = ["Cambodian Oud", "Mysore Sandalwood", "Virginia Cedar", "Madagascar Vanilla", "Ambergris", "White Musk", "Haitian Vetiver", "Tonka Bean", "Oakmoss", "Leather"]

OCCASIONS = ["Evening Wear", "Daily Signature", "Special Occasion", "Office & Business", "Date Night", "Summer Day", "Winter Cozy"]
SEASONS = ["Spring", "Summer", "Autumn", "Winter"]

async def get_or_create_warehouse(db):
    res = await db.execute(select(Warehouse).limit(1))
    wh = res.scalar_one_or_none()
    if not wh:
        wh = Warehouse(name="Default Kozmo Warehouse", location="Mumbai Hub", is_default=True)
        db.add(wh)
        await db.flush()
    return wh

async def get_or_create_supplier(db):
    res = await db.execute(select(Supplier).limit(1))
    sup = res.scalar_one_or_none()
    if not sup:
        sup = Supplier(company_name="Prestige Fragrance Supplies Ltd", contact_name="Aravind Sharma", email="supplies@kozmocart.in")
        db.add(sup)
        await db.flush()
    return sup

async def main():
    async with AsyncSessionLocal() as db:
        print("Starting Seeding of 100 products...")
        
        # 1. Fetch Categories and Brands
        res_cats = await db.execute(select(Category))
        categories = res_cats.scalars().all()
        
        res_brands = await db.execute(select(Brand))
        brands = res_brands.scalars().all()
        
        if not categories or not brands:
            print("Error: Categories or Brands are missing. Please seed categories and brands first.")
            return

        print(f"Loaded {len(categories)} categories and {len(brands)} brands.")
        
        # 2. Get Warehouse and Supplier for Inventory
        warehouse = await get_or_create_warehouse(db)
        supplier = await get_or_create_supplier(db)
        print(f"Using Warehouse: {warehouse.name} | Supplier: {supplier.company_name}")
        
        # 3. Seed 100 products
        products_seeded = 0
        for i in range(1, 101):
            brand = random.choice(brands)
            category = random.choice(categories)
            
            # Generate random name
            adj = random.choice(ADJECTIVES)
            noun = random.choice(NOUNS)
            suffix = random.choice(SUFFIXES)
            prod_name = f"{adj} {noun} {suffix}"
            slug = f"{brand.slug}-{adj.lower()}-{noun.lower()}-{suffix.lower()}-{uuid.uuid4().hex[:4]}"
            
            gender = random.choice(list(GenderType))
            
            # Generate scent profile
            notes = {
                "top": random.sample(TOP_NOTES, 3),
                "heart": random.sample(HEART_NOTES, 3),
                "base": random.sample(BASE_NOTES, 3)
            }
            rand_val = random.random()
            is_feat = rand_val < 0.20
            is_new = 0.20 <= rand_val < 0.40
            priority_val = random.randint(1, 10) if (is_feat or is_new) else 0

            # Create product object
            product = Product(
                name=prod_name,
                slug=slug,
                brand_id=brand.id,
                category_id=category.id,
                gender=gender,
                scent_notes=notes,
                longevity_hours=random.randint(6, 16),
                sillage_rating=random.randint(3, 5),
                occasion_tags=random.sample(OCCASIONS, 2),
                season_tags=random.sample(SEASONS, 2),
                short_description=f"An extraordinary display of {noun.lower()} layered with rich {notes['base'][0].lower()} and top notes of {notes['top'][0].lower()}.",
                full_description=f"Experience the olfactory masterpiece of {prod_name} by the house of {brand.name}. Opens with a refreshing burst of {', '.join(notes['top'])}. Transitioning into a sophisticated heart of {', '.join(notes['heart'])}, the scent settles into a majestic, long-lasting base of {', '.join(notes['base'])}.",
                is_active=True,
                is_featured=is_feat,
                is_new_arrival=is_new,
                priority=priority_val
            )
            
            db.add(product)
            await db.flush() # Flush to get product.id
            
            # Create 1-2 variants per product
            num_variants = random.randint(1, 2)
            for j in range(num_variants):
                size = 100 if j == 0 else 50
                concentration = random.choice([ConcentrationType.edp, ConcentrationType.parfum, ConcentrationType.edt])
                sku = f"{brand.slug.upper()}-{noun.upper()[:3]}-{size}-{concentration.value.upper()}-{uuid.uuid4().hex[:4]}"
                
                selling_price = random.randint(35, 150) * 100 # ₹3,500 to ₹15,000
                compare_at_price = int(selling_price * random.choice([1.15, 1.2, 1.25, 1.3])) if random.random() < 0.6 else None
                cost_price = int(selling_price * 0.4)
                
                variant = ProductVariant(
                    product_id=product.id,
                    sku=sku,
                    size_ml=size,
                    concentration=concentration,
                    selling_price=selling_price,
                    compare_at_price=compare_at_price,
                    cost_price=cost_price,
                    weight_grams=size * 2 + 50,
                    loyalty_points=int(selling_price / 100),
                    is_active=True
                )
                db.add(variant)
                await db.flush() # Flush to get variant.id
                
                # Add inventory batch for this variant
                stock_qty = random.randint(40, 150)
                batch = InventoryBatch(
                    variant_id=variant.id,
                    warehouse_id=warehouse.id,
                    supplier_id=supplier.id,
                    batch_code=f"BATCH-{uuid.uuid4().hex[:6].upper()}",
                    initial_quantity=stock_qty,
                    current_quantity=stock_qty,
                    purchase_cost=cost_price,
                )
                db.add(batch)

            # Add multiple images to product (3 images per product)
            # Pick 3 random images from Unsplash list
            images_to_use = random.sample(UNSPLASH_PERFUMES, 3)
            for img_idx, img_url in enumerate(images_to_use):
                p_image = ProductImage(
                    product_id=product.id,
                    url=img_url,
                    alt_text=f"{prod_name} presentation image {img_idx + 1}",
                    is_primary=(img_idx == 0),
                    sort_order=img_idx
                )
                db.add(p_image)
            
            products_seeded += 1
            if products_seeded % 20 == 0:
                print(f"Seeded {products_seeded} products...")
        
        await db.commit()
        print(f"Database successfully seeded! Added {products_seeded} products with variants, stock batches, and multiple images.")

if __name__ == "__main__":
    asyncio.run(main())
