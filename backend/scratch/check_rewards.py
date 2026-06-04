import psycopg2

def check_rewards():
    try:
        conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
        cur = conn.cursor()
        
        cur.execute("SELECT name, point_cost, reward_type FROM loyalty_rewards")
        rows = cur.fetchall()
        print("Loyalty Rewards in DB:", rows)
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_rewards()
