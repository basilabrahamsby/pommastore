import asyncio
import sys
import random
import uuid

sys.path.append('/app')

from app.core.database import AsyncSessionLocal
from app.models.product import Brand, Category

# High quality Unsplash perfume/cosmetics/luxury images
UNSPLASH_GALLERY = [
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
    "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1615396899839-c99c121888b0?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=600"
]

ADJECTIVES = ["Aura", "Luxe", "Royal", "Mystic", "Imperial", "Midnight", "Velvet", "Celestial", "Luminous", "Noble", "Golden", "Dark", "Sovereign", "Secret", "Vintage"]
NOUNS = ["Essence", "Perfumery", "Scent", "Elixir", "Aroma", "Mist", "Vapor", "Extract", "Nectar", "Oud", "Amber", "Rose", "Musk", "Leather", "Vanilla"]

async def main():
    async with AsyncSessionLocal() as db:
        print("Starting Seeding of 50 Brands and 50 Categories...")
        
        # Seed 50 unique Brands
        for i in range(1, 51):
            adj = ADJECTIVES[(i - 1) % len(ADJECTIVES)]
            noun = NOUNS[(i * 3) % len(NOUNS)]
            brand_name = f"{adj} {noun} {i}"
            slug = f"brand-{adj.lower()}-{noun.lower()}-{i}"
            
            # Select 3 random image URLs
            gallery_urls = random.sample(UNSPLASH_GALLERY, 3)
            
            brand = Brand(
                name=brand_name,
                slug=slug,
                origin_country=random.choice(["France", "Italy", "United Kingdom", "United States", "India", "United Arab Emirates"]),
                description=f"A luxury brand house specializing in exquisite olfactory compositions under the {brand_name} label.",
                logo_url=gallery_urls[0],
                banner_url=gallery_urls[1],
                brand_banner=gallery_urls[2],
                gallery=gallery_urls,
                is_active=True
            )
            db.add(brand)
            
        # Seed 50 unique Categories
        for i in range(1, 51):
            adj = ADJECTIVES[(i * 2) % len(ADJECTIVES)]
            noun = NOUNS[(i * 5) % len(NOUNS)]
            cat_name = f"Premium {adj} {noun} {i}"
            slug = f"category-{adj.lower()}-{noun.lower()}-{i}"
            
            # Select 3 random image URLs
            gallery_urls = random.sample(UNSPLASH_GALLERY, 3)
            
            category = Category(
                name=cat_name,
                slug=slug,
                scent_family=f"{adj}, {noun}",
                description=f"Curated prestige selection featuring signature notes of {noun.lower()} and {adj.lower()} elements.",
                image_url=gallery_urls[0],
                banner_url=gallery_urls[1],
                images=gallery_urls,
                is_active=True
            )
            db.add(category)
            
        await db.commit()
        print("Successfully seeded 50 Brands and 50 Categories with multiple images!")

if __name__ == "__main__":
    asyncio.run(main())
