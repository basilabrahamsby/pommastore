-- Manually confirm the payment for the stuck order
UPDATE orders
SET
    payment_status = 'paid',
    status = 'confirmed',
    transaction_id = 'manual_confirm_pending_payment'
WHERE order_number = 'KZM-2026-165755'
  AND payment_gateway = 'razorpay'
  AND payment_status = 'pending'
RETURNING order_number, status, payment_status, transaction_id;

-- Also insert a status history record
INSERT INTO order_status_history (order_id, status, notes)
SELECT id, 'confirmed', 'Manually confirmed - payment succeeded on Razorpay but verify callback was not received'
FROM orders WHERE order_number = 'KZM-2026-165755';
