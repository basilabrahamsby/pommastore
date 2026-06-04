import psycopg2
import uuid

def probe_db():
    try:
        conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@localhost:5432/kozmocart_db")
        conn.autocommit = True
        cur = conn.cursor()
        
        probe_id = str(uuid.uuid4())
        print(f"Probe ID: {probe_id}")
        
        # Create a probe table
        cur.execute(f"CREATE TABLE IF NOT EXISTS probe_{probe_id.replace('-', '_')} (id int);")
        print(f"Created probe table: probe_{probe_id.replace('-', '_')}")
        
        # Check all tables
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = [t[0] for t in cur.fetchall()]
        print("Current tables:", tables)
        
        # Check brands columns specifically
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='brands'")
        cols = [c[0] for c in cur.fetchall()]
        print("Brands columns:", cols)
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Probe Error: {e}")

if __name__ == "__main__":
    probe_id = probe_db()
