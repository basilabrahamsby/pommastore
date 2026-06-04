import psycopg2

def inspect():
    conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
    cur = conn.cursor()
    
    print("--- OFFERS ---")
    cur.execute("SELECT id, title, subtitle, discount_type, code, buy_skus, get_skus FROM public.offers;")
    for row in cur.fetchall():
        print(f"ID: {row[0]}, Title: {row[1]}, Subtitle: {row[2]}, Type: {row[3]}, Code: {row[4]}, BuySKUs: {row[5]}, GetSKUs: {row[6]}")
        
    print("\n--- PRODUCTS ---")
    cur.execute("SELECT id, name, slug FROM public.products;")
    for row in cur.fetchall():
        print(f"ID: {row[0]}, Name: {row[1]}, Slug: {row[2]}")
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect()
