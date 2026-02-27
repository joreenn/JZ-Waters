/**
 * Delivery Routes
 * GET  /api/deliveries - List deliveries for delivery staff
 * POST /api/deliveries/assign - Assign delivery to staff (admin)
 * PUT  /api/deliveries/:id/status - Update delivery status
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyOrderStatus, createNotification } = require('../services/notificationService');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/deliveries
 * List deliveries: delivery staff sees assigned, admin sees all
 */
router.get('/', authorize('admin', 'delivery'), async (req, res, next) => {
  try {
    const { status, zone_id, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT da.*, o.address, o.contact_phone, o.preferred_time, o.total_amount, o.payment_method,
             o.status as order_status, o.notes as order_notes, o.zone_id,
             u.name as customer_name, u.phone as customer_phone,
             ds.name as staff_name, z.name as zone_name,
             (SELECT JSON_ARRAYAGG(JSON_OBJECT('product_name', p.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price))
              FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN users ds ON da.delivery_staff_id = ds.id
      LEFT JOIN zones z ON o.zone_id = z.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'delivery') {
      sql += ' AND da.delivery_staff_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      sql += ' AND da.status = ?';
      params.push(status);
    }

    if (zone_id) {
      sql += ' AND o.zone_id = ?';
      params.push(zone_id);
    }

    // Sort by zone for route batching, then by preferred time
    sql += ' ORDER BY z.name ASC, o.preferred_time ASC, da.assigned_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [deliveries] = await pool.query(sql, params);

    const parsed = deliveries.map(d => ({
      ...d,
      items: typeof d.items === 'string' ? JSON.parse(d.items) : d.items,
    }));

    res.json({ deliveries: parsed });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/deliveries/unassigned
 * Get pending orders not yet assigned to delivery staff
 */
router.get('/unassigned', authorize('admin', 'delivery'), async (req, res, next) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone, z.name as zone_name,
             (SELECT JSON_ARRAYAGG(JSON_OBJECT('product_name', p.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price))
              FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN zones z ON o.zone_id = z.id
      WHERE o.status IN ('pending', 'confirmed')
        AND o.id NOT IN (SELECT order_id FROM delivery_assignments)
      ORDER BY o.created_at ASC
    `);

    const parsed = orders.map(o => ({
      ...o,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
    }));

    res.json({ orders: parsed });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/deliveries/assign
 * Assign an order to a delivery staff member
 */
router.post('/assign', authorize('admin'), [
  body('order_id').isInt({ min: 1 }),
  body('delivery_staff_id').isInt({ min: 1 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { order_id, delivery_staff_id } = req.body;

    // Verify order exists and is pending/confirmed
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND status IN ("pending", "confirmed")', [order_id]);
    if (!orders.length) {
      return res.status(400).json({ error: 'Order not found or not in assignable status' });
    }

    // Verify staff is delivery role
    const [staff] = await pool.query('SELECT * FROM users WHERE id = ? AND role = "delivery" AND is_active = 1', [delivery_staff_id]);
    if (!staff.length) {
      return res.status(400).json({ error: 'Delivery staff not found or inactive' });
    }

    // Check if already assigned
    const [existing] = await pool.query('SELECT id FROM delivery_assignments WHERE order_id = ?', [order_id]);
    if (existing.length) {
      // Update the assignment
      await pool.query('UPDATE delivery_assignments SET delivery_staff_id = ?, status = "assigned" WHERE order_id = ?', [delivery_staff_id, order_id]);
    } else {
      await pool.query(
        'INSERT INTO delivery_assignments (order_id, delivery_staff_id) VALUES (?, ?)',
        [order_id, delivery_staff_id]
      );
    }

    // Update order status to confirmed
    if (orders[0].status === 'pending') {
      await pool.query('UPDATE orders SET status = "confirmed" WHERE id = ?', [order_id]);
      notifyOrderStatus(order_id, 'confirmed');
    }

    // Notify delivery staff
    await createNotification(delivery_staff_id, {
      type: 'new_order',
      title: 'New Delivery Assigned',
      message: `Order #${order_id} has been assigned to you.`,
      link: `/delivery/${order_id}`,
    });

    // Socket notification
    if (req.app.get('io')) {
      req.app.get('io').to(`user-${delivery_staff_id}`).emit('delivery-assigned', { orderId: order_id });
    }

    res.json({ message: 'Delivery assigned successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/deliveries/:id/status
 * Update delivery assignment status
 */
router.put('/:id/status', authorize('admin', 'delivery'), [
  body('status').isIn(['out_for_delivery', 'delivered', 'cancelled']),
  body('cancellation_reason').optional().trim(),
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;

    const [assignments] = await pool.query('SELECT * FROM delivery_assignments WHERE id = ?', [id]);
    if (!assignments.length) {
      return res.status(404).json({ error: 'Delivery assignment not found' });
    }

    const assignment = assignments[0];

    // Delivery staff can only update their own assignments
    if (req.user.role === 'delivery' && assignment.delivery_staff_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your assignment' });
    }

    await pool.query(
      'UPDATE delivery_assignments SET status = ?, cancellation_reason = ? WHERE id = ?',
      [status, cancellation_reason || null, id]
    );

    // Mirror status to order
    const orderStatusMap = {
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };

    const orderStatus = orderStatusMap[status];
    if (orderStatus) {
      // Use the order status update logic
      const updateFields = { status: orderStatus };
      if (orderStatus === 'delivered') updateFields.payment_status = 'paid';
      if (orderStatus === 'cancelled') updateFields.cancellation_reason = cancellation_reason;

      await pool.query(
        'UPDATE orders SET status = ?, payment_status = CASE WHEN ? = "delivered" THEN "paid" ELSE payment_status END, cancellation_reason = ? WHERE id = ?',
        [orderStatus, orderStatus, cancellation_reason || null, assignment.order_id]
      );

      // Handle delivered - award points
      if (orderStatus === 'delivered') {
        const [order] = await pool.query('SELECT * FROM orders WHERE id = ?', [assignment.order_id]);
        if (order.length) {
          const [pointsSetting] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = "points_per_gallon"');
          const pointsPerGallon = pointsSetting.length ? parseInt(pointsSetting[0].setting_value) : 1;
          const [items] = await pool.query(`
            SELECT oi.quantity, p.category FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ? AND p.category = 'water_gallon'
          `, [assignment.order_id]);

          const totalGallons = items.reduce((sum, i) => sum + i.quantity, 0);
          const pointsEarned = totalGallons * pointsPerGallon;

          if (pointsEarned > 0) {
            const [customer] = await pool.query('SELECT points_balance FROM users WHERE id = ?', [order[0].customer_id]);
            const newBalance = customer[0].points_balance + pointsEarned;
            await pool.query('UPDATE users SET points_balance = ? WHERE id = ?', [newBalance, order[0].customer_id]);
            await pool.query('UPDATE orders SET points_earned = ? WHERE id = ?', [pointsEarned, assignment.order_id]);
            await pool.query(
              'INSERT INTO loyalty_points_log (customer_id, points_change, balance_after, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, "order_earn", ?)',
              [order[0].customer_id, pointsEarned, newBalance, `Earned from Order #${assignment.order_id}`, assignment.order_id]
            );
          }
        }
      }

      // Handle cancelled - restore stock
      if (orderStatus === 'cancelled') {
        const [setting] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = "stock_deduct_on"');
        if (!setting.length || setting[0].setting_value === 'order_placed') {
          const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [assignment.order_id]);
          for (const item of items) {
            const [product] = await pool.query('SELECT stock_quantity FROM products WHERE id = ?', [item.product_id]);
            const newQty = product[0].stock_quantity + item.quantity;
            await pool.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQty, item.product_id]);
            await pool.query(
              'INSERT INTO inventory_logs (product_id, change_quantity, previous_quantity, new_quantity, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, "order_cancel", ?)',
              [item.product_id, item.quantity, product[0].stock_quantity, newQty, `Order #${assignment.order_id} cancelled`, assignment.order_id]
            );
          }
        }
      }

      notifyOrderStatus(assignment.order_id, orderStatus);
    }

    // Socket emit
    if (req.app.get('io')) {
      req.app.get('io').emit('order-status-update', { orderId: assignment.order_id, status: orderStatus });
    }

    res.json({ message: `Delivery status updated to ${status}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
