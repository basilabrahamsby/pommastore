import psycopg2

def check_specific_brand():
    try:
        conn = psycopg2.connect("postgresql://pommastore:pommastore_dev_2026@localhost:5432/pommastore_db")
        cur = conn.cursor()
        
        target_id = 'cfbe3627-bca2-4ca8-b103-91d6a9a7a89f'
        print(f"Checking for Brand ID: {target_id}")
        
        cur.execute("SELECT id, name FROM brands WHERE id = %s", (target_id,))
        row = cur.fetchone()
        
        if row:
            print(f"FOUND: Brand '{row[1]}' in this database.")
        else:
            print("NOT FOUND: This brand ID does not exist in the database I am hitting.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_specific_brand()
