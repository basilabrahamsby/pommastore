import psycopg2

def test_select():
    try:
        conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
        cur = conn.cursor()
        cur.execute("SELECT images FROM brands LIMIT 1")
        val = cur.fetchone()
        print("Successfully selected 'images':", val)
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error selecting 'images': {e}")

if __name__ == "__main__":
    test_select()
