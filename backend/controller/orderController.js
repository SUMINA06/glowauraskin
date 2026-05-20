const { Order } = require("../model/Order");
const { Product } = require("../model/Product");
const { Cart } = require("../model/Cart");

const validOrderStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const generateOrderNumber = () =>
  `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const formatOrderPayload = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];

  const items = rows
    .filter((row) => row.item_id)
    .map((row) => ({
      id: row.item_id,
      product: row.product_id ? String(row.product_id) : null,
      name: row.product_name,
      image: row.item_image_url || null,
      qty: Number(row.quantity) || 0,
      price: Number(row.item_price) || 0,
      totalPrice: Number(row.item_total_price) || 0,
    }));

  return {
    id: firstRow.id,
    _id: String(firstRow.id),
    orderNumber: firstRow.order_number,
    user: firstRow.user_id
      ? {
          id: firstRow.user_id,
          name: firstRow.user_name || firstRow.customer_name,
          email: firstRow.user_email || firstRow.customer_email,
        }
      : null,
    customerName: firstRow.customer_name,
    customerEmail: firstRow.customer_email,
    customerPhone: firstRow.customer_phone,
    customerAddress: firstRow.customer_address,
    subtotalAmount: Number(firstRow.subtotal_amount) || 0,
    taxAmount: Number(firstRow.tax_amount) || 0,
    deliveryCharge: Number(firstRow.delivery_charge) || 0,
    discountAmount: Number(firstRow.discount_amount) || 0,
    totalPrice: Number(firstRow.total_amount) || 0,
    paymentMethod: firstRow.payment_method,
    paymentStatus: firstRow.payment_status,
    status: firstRow.order_status,
    paymentScreenshot: firstRow.payment_screenshot,
    createdAt: new Date(firstRow.created_at).toISOString(),
    updatedAt: new Date(firstRow.updated_at).toISOString(),
    orderItems: items,
  };
};

const formatOrdersPayload = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const orders = rows.reduce((acc, row) => {
    const orderId = row.id;
    if (!acc[orderId]) {
      acc[orderId] = {
        id: row.id,
        _id: String(row.id),
        orderNumber: row.order_number,
        user: row.user_id
          ? {
              id: row.user_id,
              name: row.user_name || row.customer_name,
              email: row.user_email || row.customer_email,
            }
          : null,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        customerAddress: row.customer_address,
        subtotalAmount: Number(row.subtotal_amount) || 0,
        taxAmount: Number(row.tax_amount) || 0,
        deliveryCharge: Number(row.delivery_charge) || 0,
        discountAmount: Number(row.discount_amount) || 0,
        totalPrice: Number(row.total_amount) || 0,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        status: row.order_status,
        paymentScreenshot: row.payment_screenshot,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        orderItems: [],
      };
    }

    if (row.item_id) {
      acc[orderId].orderItems.push({
        id: row.item_id,
        product: row.product_id ? String(row.product_id) : null,
        name: row.product_name,
        image: row.item_image_url || null,
        qty: Number(row.quantity) || 0,
        price: Number(row.item_price) || 0,
        totalPrice: Number(row.item_total_price) || 0,
      });
    }

    return acc;
  }, {});

  return Object.values(orders);
};

const checkStock = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const quantity = Number(req.params.quantity);

    if (!productId || Number.isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID or quantity",
      });
    }

    const productRows = await Product.findById(productId);

    if (!productRows || productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      inStock: true,
      product: productRows[0],
    });
  } catch (error) {
    console.error("Error checking stock:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to check stock",
      error: error.message,
    });
  }
};

const parseCartPayload = (cart) => {
  if (!cart) {
    return null;
  }

  if (Array.isArray(cart)) {
    return cart;
  }

  if (typeof cart !== "string") {
    return null;
  }

  const normalize = (value) => {
    let normalized = value.trim();
    normalized = normalized.replace(/^['"]|['"]$/g, "");
    normalized = normalized.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    return normalized;
  };

  const candidates = [cart];
  let current = cart;

  for (let i = 0; i < 3; i += 1) {
    current = normalize(current);
    candidates.push(current);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (typeof parsed === "string") {
        const maybeParsed = JSON.parse(parsed);
        if (Array.isArray(maybeParsed)) {
          return maybeParsed;
        }
      }
    } catch (error) {
      // continue trying other transformations
    }
  }

  return null;
};

const createOrder = async (req, res) => {
  try {
    let {
      orderId,
      name,
      email,
      phone,
      address,
      totalAmount,
      cart,
    } = req.body;

    cart = parseCartPayload(cart);

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "Cart data is invalid JSON",
      });
    }

    const subtotalAmount = Number(totalAmount);

    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      Number.isNaN(subtotalAmount) ||
      !cart ||
      !Array.isArray(cart) ||
      cart.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data. All fields and screenshot are required.",
      });
    }

    const paymentScreenshot = req.file
      ? `/uploads/payments/${req.file.filename}`
      : null;

    if (!paymentScreenshot) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot upload is required.",
      });
    }

    const parsedUserId = req.body.userId ? Number(req.body.userId) : null;
    const orderData = {
      order_number:
        orderId && typeof orderId === "string"
          ? orderId
          : generateOrderNumber(),
      user_id: parsedUserId && !Number.isNaN(parsedUserId) ? parsedUserId : null,
      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim(),
      customer_address: address.trim(),
      subtotal_amount: subtotalAmount,
      tax_amount: 0,
      delivery_charge: 0,
      discount_amount: 0,
      total_amount: subtotalAmount,
      payment_method: "qr",
      payment_status: "pending",
      order_status: "pending",
      payment_screenshot: paymentScreenshot,
    };

    const [orderResult] = await Order.create(orderData);
    const orderIdCreated = orderResult?.insertId;

    if (!orderIdCreated) {
      throw new Error("Unable to save order");
    }

    const orderItems = cart.map((item) => {
      const quantity = Number(item.qty) || 1;
      const price = Number(item.price) || 0;

      return {
        order_id: orderIdCreated,
        product_id: item.id || null,
        product_name: item.name || item.title || "Product",
        price,
        quantity,
        total_price: price * quantity,
      };
    });

    await Order.createItems(orderItems);

    if (orderData.user_id) {
      await Cart.clearByUserId(orderData.user_id);
    }

    const createdRows = await Order.findByIdWithItems(orderIdCreated);
    const createdOrder = formatOrderPayload(createdRows);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: createdOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const rows = await Order.findAllWithItems();
    return res.json({
      success: true,
      data: formatOrdersPayload(rows),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const rows = await Order.findByIdWithItems(orderId);
    const order = formatOrderPayload(rows);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!orderId || !status || !validOrderStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID or status",
      });
    }

    await Order.updateById(orderId, { order_status: status });

    return res.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

const getOrdersByUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const rows = await Order.findByUserIdWithItems(userId);
    return res.json({
      success: true,
      data: formatOrdersPayload(rows),
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  checkStock,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByUser,
};