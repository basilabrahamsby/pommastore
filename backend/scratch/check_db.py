import psycopg2

def check_tables():
    try:
        conn = psycopg2.connect("postgresql://pommastore:pommastore_dev_2026@localhost:5432/pommastore_db")
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = [t[0] for t in cur.fetchall()]
        print("Tables found:", tables)
        
        required = ['product_images', 'brands', 'categories', 'products', 'loyalty_rewards']
        for r in required:
            if r in tables:
                print(f"OK: {r} exists")
            else:
                print(f"MISSING: {r}")
                
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tables()
