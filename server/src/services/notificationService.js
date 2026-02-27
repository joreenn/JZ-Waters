/**
 * Notification Service
 * Creates in-app notifications and triggers emails/SMS placeholders
 */
const pool = require('../config/database');
const { sendEmail, emailTemplates } = require('./emailService');

/**
 * Create an in-app notification for a user
 */
const createNotification = async (userId, { type, title, message, link }) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, link || null]
    );
    return result.insertId;
  } catch (err) {
    console.error('Notification creation failed:', err.message);
    return null;
  }
};

/**
 * Notify all admins about an event
 */
const notifyAdmins = async ({ type, title, message, link }) => {
  try {
    const [admins] = await pool.query('SELECT id FROM users WHERE role = "admin" AND is_active = 1');
    for (const admin of admins) {
      await createNotification(admin.id, { type, title, message, link });
    }
  } catch (err) {
    console.error('Admin notification failed:', err.message);
  }
};

/**
 * Notify customer about order status change
 */
const notifyOrderStatus = async (orderId, status) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.id, o.total_amount, u.id as user_id, u.name, u.email 
       FROM orders o JOIN users u ON o.customer_id = u.id WHERE o.id = ?`,
      [orderId]
    );
    if (!orders.length) return;

    const order = orders[0];
    const statusLabels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    const statusLabel = statusLabels[status] || status;

    // In-app notification
    await createNotification(order.user_id, {
      type: `order_${status}`,
      title: `Order #${orderId} ${statusLabel}`,
      message: `Your order #${orderId} is now ${statusLabel}.`,
      link: `/orders/${orderId}`,
    });

    // Email notification
    const template = emailTemplates.orderStatusUpdate(order.name, orderId, statusLabel);
    await sendEmail(order.email, template.subject, template.html);

    // SMS placeholder
    console.log(`📱 [SMS Placeholder] Would send SMS to customer about order #${orderId} status: ${statusLabel}`);
  } catch (err) {
    console.error('Order status notification failed:', err.message);
  }
};

/**
 * Notify about low stock
 */
const notifyLowStock = async (product) => {
  await notifyAdmins({
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: `${product.name} is low on stock (${product.stock_quantity} remaining, threshold: ${product.low_stock_threshold}).`,
    link: '/admin/inventory',
  });
};

module.exports = {
  createNotification,
  notifyAdmins,
  notifyOrderStatus,
  notifyLowStock,
};
