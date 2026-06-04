import psycopg2

def check_brands_columns():
    try:
        conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
        cur = conn.cursor()
        
        cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name='brands'")
        tables = cur.fetchall()
        print(f"Found {len(tables)} 'brands' tables:")
        for schema, name in tables:
            print(f"  - {schema}.{name}")
            
        for schema, name in tables:
            print(f"\nColumns in '{schema}.{name}':")
            cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name='{name}' AND table_schema='{schema}'")
            cols = cur.fetchall()
            for col, dtype in cols:
                print(f"    - {col} ({dtype})")
                
            target_cols = ['is_3d_active', 'three_d_source_image', 'remove_background', 'brand_icon', 'brand_banner', 'gallery']
            for target in target_cols:
                if any(c[0] == target for c in cols):
                    print(f"  OK: '{target}' column exists in {schema}.{name}")
                else:
                    print(f"  MISSING: '{target}' column in {schema}.{name}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_brands_columns()
