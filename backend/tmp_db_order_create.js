const db = require('./config/db');
const { Order } = require('./model/Order');

(async () => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const orderData = {
      order_number: `TEST-${Date.now()}`,
      user_id: null,
      customer_name: 'DB Test',
      customer_email: 'dbtest@example.com',
      customer_phone: '0123456789',
      customer_address: 'Test Address',
      subtotal_amount: 100.00,
      tax_amount: 0,
      delivery_charge: 0,
      discount_amount: 0,
      total_amount: 100.00,
      payment_method: 'qr',
      payment_status: 'pending',
      order_status: 'pending',
      payment_screenshot: null,
    };

    const [orderResult] = await connection.query('INSERT INTO orders SET ?', [orderData]);
    const orderId = orderResult.insertId;

    const items = [ [orderId, 1, 'Test Product', 100.00, 1, 100.00] ];
    await connection.query('INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price) VALUES ?', [items]);

    const payment = {
      order_id: orderId,
      transaction_id: `TST-${Date.now()}`,
      payment_method: 'qr',
      payment_status: 'pending',
      amount: 100.00,
    };

    await connection.query('INSERT INTO payments SET ?', [payment]);

    await connection.commit();

    const created = await Order.findByIdWithItems(orderId);
    console.log('Created order rows:', created);
  } catch (err) {
    await connection.rollback();
    console.error('Test insert failed:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
})();
