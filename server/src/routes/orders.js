/**
 * Order Routes
 * POST /api/orders - Create a new delivery order (customer)
 * GET  /api/orders - List orders (customer: own, admin: all, delivery: assigned)
 * GET  /api/orders/:id - Get order details
 * PUT  /api/orders/:id/status - Update order status (admin)
 * PUT  /api/orders/:id/cancel - Cancel order
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyOrderStatus, notifyAdmins, createNotification, notifyLowStock } = require('../services/notificationService');
const { sendEmail, emailTemplates } = require('../services/emailService');

const router = express.Router();
router.use(authenticate);

/**
 * POST /api/orders
 * Create a delivery order (customer)
 */
router.post('/', authorize('customer', 'admin'), [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isInt({ min: 1 }),
  body('items.*.quantity').isInt({ min: 1 }),
  body('address').trim().notEmpty().withMessage('Delivery address is required'),
  body('contact_phone').trim().notEmpty().withMessage('Contact phone is required'),
  body('zone_id').optional().isInt({ min: 1 }),
  body('payment_method').isIn(['cod', 'gcash', 'online']),
  body('preferred_time').optional().trim(),
  body('notes').optional().trim(),
  body('points_to_redeem').optional().isInt({ min: 0 }),
], async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    await conn.beginTransaction();

    const { items, address, contact_phone, zone_id, payment_method, preferred_time, notes, points_to_redeem } = req.body;

    // Validate products and calculate total
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const [products] = await conn.query(
        'SELECT id, name, price, stock_quantity, low_stock_threshold FROM products WHERE id = ? AND is_active = 1',
        [item.product_id]
      );

      if (!products.length) {
        await conn.rollback();
        return res.status(400).json({ error: `Product ID ${item.product_id} not found or inactive` });
      }

      const product = products[0];

      // Check stock
      if (product.stock_quantity < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.price,
        name: product.name,
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
      });

      subtotal += product.price * item.quantity;
    }

    // Get delivery fee
    let deliveryFee = 0;
    if (zone_id) {
      const [zones] = await conn.query('SELECT delivery_fee FROM zones WHERE id = ? AND is_active = 1', [zone_id]);
      deliveryFee = zones.length ? Number(zones[0].delivery_fee) : 0;
    } else {
      const [settings] = await conn.query('SELECT setting_value FROM settings WHERE setting_key = "default_delivery_fee"');
      deliveryFee = settings.length ? Number(settings[0].setting_value) : 0;
    }

    // Handle loyalty points redemption
    let discount = 0;
    let pointsRedeemed = 0;
    if (points_to_redeem && points_to_redeem > 0) {
      const [user] = await conn.query('SELECT points_balance FROM users WHERE id = ?', [req.user.id]);
      const available = user[0].points_balance;
      pointsRedeemed = Math.min(points_to_redeem, available);

      const [ratio] = await conn.query('SELECT setting_value FROM settings WHERE setting_key = "points_to_peso_ratio"');
      const pesoPerPoint = ratio.length ? Number(ratio[0].setting_value) : 0.5;
      discount = pointsRedeemed * pesoPerPoint;
      discount = Math.min(discount, subtotal); // Can't discount more than subtotal
    }

    const totalAmount = subtotal + deliveryFee - discount;

    // Create order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (customer_id, status, payment_method, delivery_fee, zone_id, address, contact_phone, preferred_time, notes, total_amount, points_redeemed, discount_amount)
       VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, payment_method, deliveryFee, zone_id || null, address, contact_phone, preferred_time || null, notes || null, totalAmount, pointsRedeemed, discount]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of orderItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price]
      );

      // Check if stock should be deducted on order placement
      const [setting] = await conn.query('SELECT setting_value FROM settings WHERE setting_key = "stock_deduct_on"');
      if (!setting.length || setting[0].setting_value === 'order_placed') {
        const newQty = item.stock_quantity - item.quantity;
        await conn.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQty, item.product_id]);

        // Log inventory change
        await conn.query(
          'INSERT INTO inventory_logs (product_id, change_quantity, previous_quantity, new_quantity, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, "order", ?)',
          [item.product_id, -item.quantity, item.stock_quantity, newQty, `Order #${orderId}`, orderId]
        );

        // Check low stock
        if (newQty <= item.low_stock_threshold) {
          await notifyLowStock({ ...item, stock_quantity: newQty });
        }
      }
    }

    // Deduct loyalty points if used
    if (pointsRedeemed > 0) {
      const [user] = await conn.query('SELECT points_balance FROM users WHERE id = ?', [req.user.id]);
      const newBalance = user[0].points_balance - pointsRedeemed;
      await conn.query('UPDATE users SET points_balance = ? WHERE id = ?', [newBalance, req.user.id]);
      await conn.query(
        'INSERT INTO loyalty_points_log (customer_id, points_change, balance_after, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, "order_redeem", ?)',
        [req.user.id, -pointsRedeemed, newBalance, `Redeemed for Order #${orderId}`, orderId]
      );
    }

    await conn.commit();

    // Send notifications (don't await these)
    notifyAdmins({
      type: 'new_order',
      title: 'New Delivery Order',
      message: `Order #${orderId} placed by ${req.user.name} - ₱${totalAmount.toFixed(2)}`,
      link: `/admin/orders/${orderId}`,
    });

    // Email confirmation
    const template = emailTemplates.orderConfirmation(req.user.name, orderId, totalAmount);
    sendEmail(req.user.email, template.subject, template.html);

    // Emit via socket if available
    if (req.app.get('io')) {
      req.app.get('io').emit('new-order', { orderId, customerId: req.user.id });
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order: { id: orderId, total_amount: totalAmount, status: 'pending' },
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

/**
 * GET /api/orders
 * List orders based on role
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, date_from, date_to, page = 1, limit = 20 } = req.query;
    let sql = `
      SELECT o.*, u.name as customer_name, u.email as customer_email, z.name as zone_name,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'product_name', p.name))
       FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN zones z ON o.zone_id = z.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based filtering
    if (req.user.role === 'customer') {
      sql += ' AND o.customer_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'delivery') {
      sql += ' AND (o.id IN (SELECT order_id FROM delivery_assignments WHERE delivery_staff_id = ?) OR (o.status = "pending" AND o.id NOT IN (SELECT order_id FROM delivery_assignments)))';
      params.push(req.user.id);
    }

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    if (date_from) {
      sql += ' AND DATE(o.created_at) >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND DATE(o.created_at) <= ?';
      params.push(date_to);
    }

    const countSql = `SELECT COUNT(*) as total FROM orders o WHERE 1=1` +
      (req.user.role === 'customer' ? ' AND o.customer_id = ?' : '') +
      (req.user.role === 'delivery' ? ' AND (o.id IN (SELECT order_id FROM delivery_assignments WHERE delivery_staff_id = ?) OR (o.status = "pending" AND o.id NOT IN (SELECT order_id FROM delivery_assignments)))' : '') +
      (status ? ' AND o.status = ?' : '') +
      (date_from ? ' AND DATE(o.created_at) >= ?' : '') +
      (date_to ? ' AND DATE(o.created_at) <= ?' : '');

    const countParams = [];
    if (req.user.role === 'customer') countParams.push(req.user.id);
    if (req.user.role === 'delivery') countParams.push(req.user.id);
    if (status) countParams.push(status);
    if (date_from) countParams.push(date_from);
    if (date_to) countParams.push(date_to);

    const [countResult] = await pool.query(countSql, countParams);

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [orders] = await pool.query(sql, params);

    // Parse JSON items
    const parsedOrders = orders.map(o => ({
      ...o,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
    }));

    res.json({
      orders: parsedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:id
 * Get order details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             z.name as zone_name
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN zones z ON o.zone_id = z.id
      WHERE o.id = ?
    `, [req.params.id]);

    if (!orders.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permission
    const order = orders[0];
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get items
    const [items] = await pool.query(`
      SELECT oi.*, p.name as product_name, p.category, p.unit
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    // Get delivery assignment
    const [assignment] = await pool.query(`
      SELECT da.*, u.name as staff_name, u.phone as staff_phone
      FROM delivery_assignments da
      LEFT JOIN users u ON da.delivery_staff_id = u.id
      WHERE da.order_id = ?
    `, [req.params.id]);

    res.json({
      order: { ...order, items, delivery_assignment: assignment[0] || null },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (admin, delivery)
 */
router.put('/:id/status', authorize('admin', 'delivery'), [
  body('status').isIn(['confirmed', 'out_for_delivery', 'delivered', 'cancelled']),
  body('cancellation_reason').optional().trim(),
], async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;

    await conn.beginTransaction();

    const [orders] = await conn.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!orders.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered', 'cancelled'],
    };

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      await conn.rollback();
      return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
    }

    // Update order
    const updateFields = { status };
    if (status === 'cancelled' && cancellation_reason) {
      updateFields.cancellation_reason = cancellation_reason;
    }
    if (status === 'delivered') {
      updateFields.payment_status = 'paid';
    }

    await conn.query(
      `UPDATE orders SET status = ?, payment_status = ?, cancellation_reason = ? WHERE id = ?`,
      [status, updateFields.payment_status || order.payment_status, updateFields.cancellation_reason || null, id]
    );

    // If delivered, award loyalty points
    if (status === 'delivered') {
      const [pointsSetting] = await conn.query('SELECT setting_value FROM settings WHERE setting_key = "points_per_gallon"');
      const pointsPerGallon = pointsSetting.length ? parseInt(pointsSetting[0].setting_value) : 1;

      // Count gallons in order
      const [items] = await conn.query(`
        SELECT oi.quantity, p.category FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ? AND p.category IN ('water_gallon')
      `, [id]);

      const totalGallons = items.reduce((sum, i) => sum + i.quantity, 0);
      const pointsEarned = totalGallons * pointsPerGallon;

      if (pointsEarned > 0) {
        const [customer] = await conn.query('SELECT points_balance FROM users WHERE id = ?', [order.customer_id]);
        const newBalance = customer[0].points_balance + pointsEarned;

        await conn.query('UPDATE users SET points_balance = ? WHERE id = ?', [newBalance, order.customer_id]);
        await conn.query('UPDATE orders SET points_earned = ? WHERE id = ?', [pointsEarned, id]);
        await conn.query(
          'INSERT INTO loyalty_points_log (customer_id, points_change, balance_after, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, "order_earn", ?)',
          [order.customer_id, pointsEarned, newBalance, `Earned from Order #${id}`, id]
        );

        // Notify customer about points
        await createNotification(order.customer_id, {
          type: 'points_earned',
          title: 'Points Earned!',
          message: `You earned ${pointsEarned} points from Order #${id}. Balance: ${newBalance} points.`,
          link: `/orders/${id}`,
        });
      }
    }

    // If cancelled and stock was deducted on order, restore stock
    if (status === 'cancelled') {
      const [setting] = await conn.query('SELECT setting_value FROM settings WHERE setting_key = "stock_deduct_on"');
      if (!setting.length || setting[0].setting_value === 'order_placed') {
        const [items] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
        for (const item of items) {
          const [product] = await conn.query('SELECT stock_quantity FROM products WHERE id = ?', [item.product_id]);
          const newQty = product[0].stock_quantity + item.quantity;
          await conn.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQty, item.product_id]);
          await conn.query(
            'INSERT INTO inventory_logs (product_id, change_quantity, previous_quantity, new_quantity, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, "order_cancel", ?)',
            [item.product_id, item.quantity, product[0].stock_quantity, newQty, `Order #${id} cancelled`, id]
          );
        }
      }
    }

    await conn.commit();

    // Send notifications
    notifyOrderStatus(id, status);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('order-status-update', { orderId: parseInt(id), status });
    }

    res.json({ message: `Order status updated to ${status}` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
