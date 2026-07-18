import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def update_schema():
    conn = psycopg2.connect("postgresql://pommastore:pommastore_dev_2026@localhost:5432/pommastore_db")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    print("Adding media columns to 'categories' table...")
    try:
        cur.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;")
        cur.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_url TEXT;")
        cur.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS video_url TEXT;")
        cur.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;")
        print("Successfully updated 'categories' table.")
    except Exception as e:
        print(f"Error updating 'categories' table: {e}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    update_schema()
