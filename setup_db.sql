DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pommastore') THEN
    CREATE USER pommastore WITH PASSWORD 'pommastore_dev_2026';
  END IF;
END
$$;

SELECT 'CREATE DATABASE pommastore_db OWNER pommastore'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pommastore_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE pommastore_db TO pommastore;
