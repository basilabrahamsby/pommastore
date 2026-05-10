DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kozmocart') THEN
    CREATE USER kozmocart WITH PASSWORD 'kozmocart_dev_2026';
  END IF;
END
$$;

SELECT 'CREATE DATABASE kozmocart_db OWNER kozmocart'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kozmocart_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE kozmocart_db TO kozmocart;
