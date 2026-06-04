import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def deep_repair():
    try:
        conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        print("Deep Repair: Verifying all luxury columns in 'brands'...")
        
        # List of all new columns
        columns = [
            ("gallery", "JSONB DEFAULT '[]'::jsonb"),
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
        
        for col, col_type in columns:
            try:
                cur.execute(f"ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS {col} {col_type};")
                print(f"  - Column {col}: Verified")
            except Exception as e:
                print(f"  - Column {col}: Error {e}")
        
        print("Deep Repair: Success.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Deep Repair Error: {e}")

if __name__ == "__main__":
    deep_repair()
