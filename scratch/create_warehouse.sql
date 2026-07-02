INSERT INTO warehouses (name, location, is_active, is_default)
VALUES ('Kozmocart Main Warehouse', 'Wayanad, Kerala, India', true, true)
RETURNING id, name;
