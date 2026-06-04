import psycopg2
import uuid
import random
from datetime import datetime, timedelta
import sys

def seed():
    # Inside container, postgres resolves to the postgres service
    conn = psycopg2.connect("postgresql://kozmocart:kozmocart_dev_2026@postgres:5432/kozmocart_db")
    cur = conn.cursor()
    
    # 1. Fetch active variants
    cur.execute("SELECT id, selling_price, cost_price, sku FROM product_variants LIMIT 3;")
    variants = cur.fetchall()
    if not variants:
        print("Error: No product variants in database. Run seed_100_products.py first!")
        return
        
    print(f"Loaded {len(variants)} variants for order seeding.")
    
    # 2. Check if customer test@gmail.com exists, delete if exists to refresh
    cur.execute("SELECT id FROM customers WHERE email = 'test@gmail.com';")
    existing_cust = cur.fetchone()
    if existing_cust:
        cust_id = existing_cust[0]
        # Clean up existing orders/addresses first to prevent constraint errors
        cur.execute("DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM orders WHERE customer_id = %s);", (cust_id,))
        cur.execute("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = %s);", (cust_id,))
        cur.execute("DELETE FROM orders WHERE customer_id = %s;", (cust_id,))
        cur.execute("DELETE FROM customer_addresses WHERE customer_id = %s;", (cust_id,))
        cur.execute("DELETE FROM customers WHERE id = %s;", (cust_id,))
        print("Cleaned up existing test customer data.")
        
    cust_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO customers (id, email, full_name, phone, loyalty_tier, loyalty_points, total_spent, order_count, is_active, created_at)
        VALUES (%s, 'test@gmail.com', 'Alex Test', '9876543210', 'silver', 150, 8500.0, 2, True, NOW());
    """, (cust_id,))
    
    # 3. Add default address
    addr_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO customer_addresses (id, customer_id, label, address_line1, address_line2, city, state, pincode, phone, country, is_default)
        VALUES (%s, %s, 'Home', 'Apt 4B, Signature Towers', 'Prabhadevi', 'Mumbai', 'Maharashtra', '400025', '9876543210', 'India', True);
    """, (addr_id, cust_id))
    
    # 4. Add Shipped Order
    order1_id = str(uuid.uuid4())
    order1_num = f"KZM-2026-{random.randint(10000, 99999)}"
    v1 = variants[0]
    total_amt1 = float(v1[1])
    shipping_addr = {
        "name": "Alex Test",
        "address_line1": "Apt 4B, Signature Towers",
        "address_line2": "Prabhadevi",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400025",
        "phone": "9876543210"
    }
    
    cur.execute("""
        INSERT INTO orders (id, order_number, customer_id, channel, status, payment_method, payment_status, subtotal, discount_amount, loyalty_points_used, tax_amount, shipping_amount, total_amount, customer_name, customer_phone, customer_email, shipping_address, carrier, tracking_number, created_at, updated_at)
        VALUES (%s, %s, %s, 'storefront', 'shipped', 'razorpay', 'paid', %s, 0.0, 0, 0.0, 0.0, %s, 'Alex Test', '9876543210', 'test@gmail.com', %s, 'Delhivery', '123456789012', NOW() - INTERVAL '2 days', NOW());
    """, (order1_id, order1_num, cust_id, total_amt1, total_amt1, psycopg2.extras.Json(shipping_addr)))
    
    # Add Order Item
    item1_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO order_items (id, order_id, variant_id, quantity, unit_price, cost_price, discount_amount, total_price)
        VALUES (%s, %s, %s, 1, %s, %s, 0.0, %s);
    """, (item1_id, order1_id, v1[0], float(v1[1]), float(v1[2]) if v1[2] else 0.0, float(v1[1])))
    
    # Add Status History
    history_steps = ['pending', 'confirmed', 'processing', 'packed', 'shipped']
    for idx, step in enumerate(history_steps):
        hist_id = str(uuid.uuid4())
        step_time = datetime.now() - timedelta(days=2) + timedelta(hours=idx*4)
        cur.execute("""
            INSERT INTO order_status_history (id, order_id, status, notes, created_at)
            VALUES (%s, %s, %s, %s, %s);
        """, (hist_id, order1_id, step, f"Status updated to {step}", step_time))
        
    # 5. Add Pending Order
    order2_id = str(uuid.uuid4())
    order2_num = f"KZM-2026-{random.randint(10000, 99999)}"
    v2 = variants[min(1, len(variants)-1)]
    total_amt2 = float(v2[1])
    
    cur.execute("""
        INSERT INTO orders (id, order_number, customer_id, channel, status, payment_method, payment_status, subtotal, discount_amount, loyalty_points_used, tax_amount, shipping_amount, total_amount, customer_name, customer_phone, customer_email, shipping_address, created_at, updated_at)
        VALUES (%s, %s, %s, 'storefront', 'pending', 'cod', 'pending', %s, 0.0, 0, 0.0, 100.0, %s, 'Alex Test', '9876543210', 'test@gmail.com', %s, NOW() - INTERVAL '3 hours', NOW());
    """, (order2_id, order2_num, cust_id, total_amt2, total_amt2 + 100.0, psycopg2.extras.Json(shipping_addr)))
    
    # Add Order Item
    item2_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO order_items (id, order_id, variant_id, quantity, unit_price, cost_price, discount_amount, total_price)
        VALUES (%s, %s, %s, 1, %s, %s, 0.0, %s);
    """, (item2_id, order2_id, v2[0], float(v2[1]), float(v2[2]) if v2[2] else 0.0, float(v2[1])))
    
    # Add Status History
    hist_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO order_status_history (id, order_id, status, notes, created_at)
        VALUES (%s, %s, %s, 'Order received and awaiting verification.', NOW() - INTERVAL '3 hours');
    """, (hist_id, order2_id, 'pending'))
    
    conn.commit()
    cur.close()
    conn.close()
    print("Database successfully seeded with test customer, address, and orders!")

if __name__ == "__main__":
    import psycopg2.extras
    seed()
