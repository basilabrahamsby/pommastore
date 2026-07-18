import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def update_schema():
    conn = psycopg2.connect("postgresql://pommastore:pommastore_dev_2026@localhost:5432/pommastore_db")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    print("Expanding 'brands' table with luxury & ERP columns...")
    cols = [
        ("images", "JSONB DEFAULT '[]'::jsonb"),
        ("banner_url", "TEXT"),
        ("video_url", "TEXT"),
        ("three_d_source_image", "TEXT"),
        ("is_3d_active", "BOOLEAN DEFAULT FALSE"),
        ("remove_background", "BOOLEAN DEFAULT TRUE"),
        ("founding_year", "VARCHAR(50)"),
        ("lead_perfumer", "VARCHAR(255)"),
        ("philosophy", "TEXT"),
        ("instagram_url", "TEXT"),
        ("tiktok_url", "TEXT"),
        ("fragrantica_url", "TEXT"),
        ("brand_icon", "TEXT"),
        ("brand_banner", "TEXT"),
        ("primary_color", "VARCHAR(20) DEFAULT '#d4af37'"),
        ("secondary_color", "VARCHAR(20) DEFAULT '#000000'"),
        ("font_preference", "VARCHAR(50) DEFAULT 'Serif'"),
        ("brand_keywords", "TEXT"),
        ("default_hashtags", "TEXT"),
        ("trademark_number", "VARCHAR(100)"),
        ("manufacturer_info", "TEXT"),
        ("brand_commission", "NUMERIC(5, 2)"),
        ("exclusivity_toggle", "BOOLEAN DEFAULT FALSE"),
        ("brand_tier", "VARCHAR(50) DEFAULT 'Niche'"),
        ("gst_category", "VARCHAR(100) DEFAULT 'Perfumes (18% GST)'")
    ]
    
    for col_name, col_type in cols:
        try:
            cur.execute(f"ALTER TABLE brands ADD COLUMN IF NOT EXISTS {col_name} {col_type};")
            print(f"  - Added/Verified column: {col_name}")
        except Exception as e:
            print(f"  - Error adding column {col_name}: {e}")
            
    print("Successfully expanded 'brands' table.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    update_schema()
