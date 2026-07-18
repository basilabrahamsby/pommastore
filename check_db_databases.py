import psycopg2

def inspect():
    conn = psycopg2.connect("postgresql://pommastore:pommastore_dev_2026@127.0.0.1:5432/postgres")
    cur = conn.cursor()
    cur.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
    print("Databases:")
    for db in cur.fetchall():
        print(f" - {db[0]}")
    cur.close()
    conn.close()

if __name__ == "__main__":
    inspect()
