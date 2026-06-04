import psycopg2

def inspect():
    conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM products;")
    print("Product count:", cur.fetchone()[0])
    
    cur.execute("SELECT id, name, slug, is_active FROM products LIMIT 10;")
    print("Products:")
    for row in cur.fetchall():
        print(row)
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect()
