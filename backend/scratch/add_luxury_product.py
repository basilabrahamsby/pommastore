import psycopg2
import uuid
from datetime import datetime, date

def add_luxury_product():
    try:
        # Connect to Postgres
        conn = psycopg2.connect("postgresql://pommastore:pommastore_dev_2026@localhost:5432/pommastore_db")
        cur = conn.cursor()
        
        print("Starting seeding of premium luxury perfume...")
        
        # 1. Create Default Warehouse
        warehouse_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO warehouses (id, name, location, is_active, is_default, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING id;
            """,
            (warehouse_id, "Mumbai Central Vault", "Mumbai, Maharashtra - Security Zone 1", True, True)
        )
        print(f"Created Warehouse: Mumbai Central Vault (ID: {warehouse_id})")
        
        # 2. Create Premium Supplier
        supplier_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO suppliers (id, company_name, contact_name, email, phone, address, gst_number, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id;
            """,
            (
                supplier_id, 
                "Global Scent Imports Ltd.", 
                "Rajesh Mehta", 
                "imports@globalscents.in", 
                "+91 98765 43210", 
                "404, Trade Centre, BKC, Mumbai - 400051", 
                "27AAAAA1111A1Z1", 
                True
            )
        )
        print(f"Created Supplier: Global Scent Imports Ltd. (ID: {supplier_id})")
        
        # 3. Create Luxury Brand
        brand_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO brands (
                id, name, slug, origin_country, description, logo_url, gallery, founding_year, 
                lead_perfumer, philosophy, brand_tier, gst_category, is_active, primary_color, 
                secondary_color, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id;
            """,
            (
                brand_id,
                "Aetheria",
                "aetheria",
                "France",
                "Aetheria is an ultra-niche French high-perfumery house known for using rare organic raw materials and aged distillates.",
                "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=150",
                '[]',
                "1998",
                "Jean-Claude Ellena",
                "Pure luxury captured in absolute simplicity.",
                "Luxury Niche",
                "Perfumes (18% GST)",
                True,
                "#d4af37",
                "#000000"
            )
        )
        print(f"Created Brand: Aetheria (ID: {brand_id})")
        
        # 4. Create Luxury Category
        category_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO categories (id, name, slug, scent_family, description, is_active, images, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id;
            """,
            (
                category_id,
                "Woody & Spice",
                "woody-spice",
                "Woody",
                "Rich, opulent fragrances emphasizing patchouli, oud, sandalwood, cedar, and warm exotic spices.",
                True,
                '[]'
            )
        )
        print(f"Created Category: Woody & Spice (ID: {category_id})")
        
        # 5. Create Premium Product
        product_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO products (
                id, name, slug, brand_id, category_id, gender, scent_notes, longevity_hours, 
                sillage_rating, occasion_tags, season_tags, short_description, full_description, 
                is_active, is_featured, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id;
            """,
            (
                product_id,
                "Aetheria Imperial Oud",
                "aetheria-imperial-oud",
                brand_id,
                category_id,
                "unisex",  # Use lowercase enum value
                '{"top": ["Bergamot", "Saffron", "Cardamom"], "heart": ["Bulgarian Rose", "Jasmine Infusion"], "base": ["Aged Assam Oud", "Sandalwood", "Ambergris", "White Musk"]}',
                12,
                5,
                '["Formal", "Evening Gala", "Royal Wedding"]',
                '["Winter", "Autumn"]',
                "An majestic symphony of rare Assam Oud, exotic saffron, and velvety Bulgarian rose.",
                "Imperial Oud is the pinnacle of the Aetheria Private Reserve collection. It opens with an opulent burst of high-altitude bergamot and saffron, transitioning into a magnificent heart of Bulgarian rose before settling into a deep, mesmerizing base of real aged Assam Oud and white musk.",
                True,
                True
            )
        )
        print(f"Created Product: Aetheria Imperial Oud (ID: {product_id})")
        
        # 6. Create Product Variant
        variant_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO product_variants (
                id, product_id, sku, barcode, size_ml, concentration, selling_price, 
                compare_at_price, cost_price, weight_grams, min_stock_alert, loyalty_points, 
                is_active, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id;
            """,
            (
                variant_id,
                product_id,
                "AET-IMP-OUD-100",
                "3700123456789",
                100,
                "parfum",  # Use lowercase enum value
                14500.00,
                18000.00,
                4800.00,
                380,
                5,
                250,
                True
            )
        )
        print(f"Created Variant: 100ml Parfum (ID: {variant_id}, SKU: AET-IMP-OUD-100)")
        
        # 7. Create Product Image
        image_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO product_images (id, product_id, variant_id, url, alt_text, is_primary, sort_order, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id;
            """,
            (
                image_id,
                product_id,
                variant_id,
                "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800",
                "Aetheria Imperial Oud 100ml Parfum",
                True,
                0
            )
        )
        print(f"Created Primary Product Image (ID: {image_id})")
        
        # 8. Create Inventory Batch
        batch_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO inventory_batches (
                id, variant_id, warehouse_id, supplier_id, batch_code, initial_quantity, 
                current_quantity, purchase_cost, manufacture_date, expiry_date, received_at, notes
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)
            RETURNING id;
            """,
            (
                batch_id,
                variant_id,
                warehouse_id,
                supplier_id,
                "BCH-2026-AET01",
                120,
                120,
                4800.00,
                date(2026, 1, 15),
                date(2031, 1, 15),
                "Initial premium launch inventory restock."
            )
        )
        print(f"Created Inventory Batch: BCH-2026-AET01 (ID: {batch_id}, Quantity: 120)")
        
        # 9. Create Inventory Movement
        movement_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO inventory_movements (id, batch_id, type, quantity, reason, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING id;
            """,
            (
                movement_id,
                batch_id,
                "Restock",
                120,
                "Initial luxury product seeding restock"
            )
        )
        print(f"Recorded Inventory Movement: Restock 120 units (ID: {movement_id})")
        
        # Commit transaction
        conn.commit()
        print("\nSUCCESS: Premium luxury perfume seed data created successfully!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"\nSEEDING ERROR: {e}")
        try:
            conn.rollback()
            cur.close()
            conn.close()
        except:
            pass

if __name__ == "__main__":
    add_luxury_product()
