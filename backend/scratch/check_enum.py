import psycopg2

def check_enum():
    try:
        conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
        cur = conn.cursor()
        
        cur.execute("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'gendertype';")
        labels = [row[0] for row in cur.fetchall()]
        print("gendertype labels:", labels)
        
        cur.execute("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'concentrationtype';")
        labels2 = [row[0] for row in cur.fetchall()]
        print("concentrationtype labels:", labels2)
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error checking enum: {e}")

if __name__ == "__main__":
    check_enum()
