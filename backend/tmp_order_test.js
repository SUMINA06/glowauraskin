const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const filePath = path.join(__dirname, '../frontend-react/images/cerave.jpg.avif');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found: ${filePath}`);
    }

    const formData = new FormData();
    formData.append('orderId', 'NM-' + Date.now());
    formData.append('name', 'Test Customer');
    formData.append('email', 'test@example.com');
    formData.append('phone', '0123456789');
    formData.append('address', '123 Test St');
    formData.append('shipping_address', '123 Test St');
    formData.append('totalAmount', '100.00');
    formData.append('payment_method', 'qr');
    formData.append('cart', JSON.stringify([{ id: 1, name: 'Test Product', price: 100, qty: 1 }]));
    formData.append('paymentScreenshot', fs.createReadStream(filePath));

    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      body: formData,
    });

    const body = await response.text();
    console.log('status', response.status);
    console.log(body);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
