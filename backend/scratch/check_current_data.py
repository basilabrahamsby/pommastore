import psycopg2

def check_current_data():
    try:
        conn = psycopg2.connect("postgresql://pommastore:pommastore_dev_2026@localhost:5432/pommastore_db")
        cur = conn.cursor()
        
        tables = [
            'brands', 'categories', 'products', 'product_variants', 
            'product_images', 'inventory_batches', 'warehouses', 
            'suppliers', 'inventory_movements', 'users'
        ]
        print("Checking counts:")
        for t in tables:
            try:
                cur.execute(f'SELECT count(*) FROM public."{t}";')
                count = cur.fetchone()[0]
                print(f" - {t}: {count}")
            except Exception as e:
                print(f"Error checking {t}: {e}")
                conn.rollback()
                
        # Let's print details about warehouses and suppliers if any exist
        cur.execute('SELECT id, name, is_default FROM public."warehouses";')
        warehouses = cur.fetchall()
        print("\nWarehouses:")
        for w in warehouses:
            print(f" - ID: {w[0]}, Name: {w[1]}, Default: {w[2]}")
            
        cur.execute('SELECT id, company_name FROM public."suppliers";')
        suppliers = cur.fetchall()
        print("\nSuppliers:")
        for s in suppliers:
            print(f" - ID: {s[0]}, Company Name: {s[1]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    check_current_data()
