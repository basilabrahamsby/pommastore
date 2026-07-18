import os
import psycopg2

def clear_all_data():
    try:
        db_url = os.environ.get("DATABASE_URL", "postgresql://pommastore:pommastore_dev_2026@localhost:5432/pommastore_db")
        if "asyncpg" in db_url:
            db_url = db_url.replace("+asyncpg", "")
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        # 1. Query all tables in the public schema
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
        tables = [row[0] for row in cur.fetchall()]
        
        # 2. Exclude critical tables that must not be cleared
        excluded_tables = {'users', 'system_settings', 'spatial_ref_sys'}
        tables_to_clear = [t for t in tables if t not in excluded_tables and not t.startswith('probe_')]
        
        if not tables_to_clear:
            print("No dynamic data tables found to clear.")
            cur.close()
            conn.close()
            return
            
        print("Dynamic tables identified for truncation:")
        for t in tables_to_clear:
            print(f" - {t}")
            
        # 3. Truncate tables with cascade and reset sequences
        tables_csv = ", ".join([f'public."{t}"' for t in tables_to_clear])
        truncate_query = f"TRUNCATE TABLE {tables_csv} RESTART IDENTITY CASCADE;"
        
        cur.execute(truncate_query)
        print("\nSUCCESS: All dynamic database tables have been wiped successfully!")
        
        # 4. Clean up any leftover probe tables
        probe_tables = [t for t in tables if t.startswith('probe_')]
        for pt in probe_tables:
            cur.execute(f'DROP TABLE IF EXISTS public."{pt}" CASCADE;')
            print(f"Removed probe table: {pt}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DATABASE RESET ERROR: {e}")

if __name__ == "__main__":
    clear_all_data()
