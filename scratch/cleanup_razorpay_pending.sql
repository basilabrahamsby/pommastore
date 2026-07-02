DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM orders WHERE payment_gateway='razorpay' AND payment_status='pending');
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE payment_gateway='razorpay' AND payment_status='pending');
DELETE FROM orders WHERE payment_gateway='razorpay' AND payment_status='pending';
