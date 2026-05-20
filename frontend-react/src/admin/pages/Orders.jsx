import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import apiClient from "../../api/client";
import "../css/tables.css";

const statusOptions = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllOrders();
      const orderList = response.data || [];
      console.debug("Loaded admin orders:", orderList);
      setOrders(orderList);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    setSaving(orderId);
    try {
      await apiClient.updateOrderStatus(orderId, { status });
      await loadOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Unable to update order status.");
    } finally {
      setSaving(null);
    }
  };

  const renderItems = (orderItems) => {
    if (!orderItems || orderItems.length === 0) {
      return <div className="item-list-empty">No items</div>;
    }

    return orderItems.map((item) => {
      const imageUrl = item.image
        ? item.image.startsWith("http")
          ? item.image
          : `${apiClient.API_ROOT}${item.image}`
        : null;

      return (
        <div key={item.id} className="order-item-row">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="order-item-thumb"
              loading="lazy"
            />
          ) : (
            <div className="order-item-thumb-placeholder">No image</div>
          )}
          <div className="order-item-meta">
            <strong>{item.name || "Unnamed product"}</strong>
            <div>Qty: {item.qty ?? item.quantity ?? 0}</div>
            <div>Rs {item.totalPrice ?? item.price ?? 0}</div>
          </div>
        </div>
      );
    });
  };

  return (
    <AdminLayout title="Orders">
      <div id="orders-page">
        <div className="page-header">
          <h2>Orders</h2>
        </div>

        <div className="table-container">
          <table className="data-table" id="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id || order._id}>
                    <td>{order.orderNumber || order.order_number || "N/A"}</td>
                    <td>
                      <div>{order.user?.name || order.customerName || "Unknown"}</div>
                      <small>{order.user?.email || order.customerEmail || "No email"}</small>
                      <div>{order.customerAddress || "No address"}</div>
                    </td>
                    <td>{renderItems(order.orderItems)}</td>
                    <td>Rs {order.totalPrice ?? order.total_amount ?? 0}</td>
                    <td>
                      <div>{order.paymentMethod || order.payment_method || "Unknown"}</div>
                      <small>{order.paymentStatus || order.payment_status || "Unknown"}</small>
                    </td>
                    <td>
                      <select
                        value={order.status || order.orderStatus || order.order_status || "pending"}
                        onChange={(e) => updateStatus(order.id || order._id, e.target.value)}
                        disabled={saving === order.id || saving === order._id}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : new Date(order.created_at || "").toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={loadOrders}
                        disabled={loading}
                      >
                        Refresh
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Orders;
