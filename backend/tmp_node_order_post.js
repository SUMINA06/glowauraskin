const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

(async () => {
  try {
    const filePath = path.join(__dirname, '../frontend-react/images/cerave.jpg.avif');
    if (!fs.existsSync(filePath)) {
      console.error('Test image not found:', filePath);
      process.exit(1);
    }

    const form = new FormData();
    form.append('orderId', 'NM-' + Date.now());
    form.append('name', 'Test User');
    form.append('email', 'testuser@example.com');
    form.append('phone', '555');
    form.append('address', 'Addr');
    form.append('shipping_address', 'Addr');
    form.append('totalAmount', '100.00');
    form.append('payment_method', 'qr');
    form.append('cart', JSON.stringify([{ id: 1, name: 'Test Product', price: 100, qty: 1 }]));
    form.append('paymentScreenshot', fs.createReadStream(filePath));

    const headers = form.getHeaders();

    const resp = await axios.post('http://localhost:3000/api/orders', form, { headers, maxBodyLength: Infinity });
    console.log('Status', resp.status);
    console.log('Body', resp.data);
  } catch (err) {
    if (err.response) {
      console.error('Status', err.response.status);
      console.error('Body', err.response.data);
    } else {
      console.error('Error', err.message);
    }
    process.exit(1);
  }
})();
