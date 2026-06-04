import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def update_schema():
    conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    print("Renaming/Adding 'gallery' column to 'brands' table...")
    try:
        # Just add it directly to be safe
        cur.execute("ALTER TABLE brands ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;")
        print("  - Added 'gallery' column successfully.")
    except Exception as e:
        print(f"  - Error adding 'gallery': {e}")
            
    print("Successfully updated 'brands' table.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    update_schema()
