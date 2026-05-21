$cart = Get-Content tmp_cart_payload.json -Raw
$cart = $cart.Trim()
$headers = @{
    "Content-Type" = "multipart/form-data"
}
curl.exe -v -X POST http://localhost:3000/api/orders `
    -F "orderId=NM-123456" `
    -F "name=Test Customer" `
    -F "email=test@example.com" `
    -F "phone=0123456789" `
    -F "address=123 Test St" `
    -F "shipping_address=123 Test St" `
    -F "totalAmount=100.00" `
    -F "payment_method=qr" `
    -F "cart=$cart" `
    -F "paymentScreenshot=@..\frontend-react\images\tresemme.jpg"
