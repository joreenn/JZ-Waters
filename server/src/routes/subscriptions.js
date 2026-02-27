/**
 * Subscription Routes (Recurring Deliveries)
 * GET    /api/subscriptions - List customer's subscriptions
 * POST   /api/subscriptions - Create subscription
 * PUT    /api/subscriptions/:id - Update subscription
 * PUT    /api/subscriptions/:id/pause - Pause subscription
 * PUT    /api/subscriptions/:id/resume - Resume subscription
 * DELETE /api/subscriptions/:id - Cancel subscription
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/subscriptions
 */
router.get('/', async (req, res, next) => {
  try {
    let sql = `
      SELECT s.*, z.name as zone_name, z.delivery_fee,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('product_id', si.product_id, 'quantity', si.quantity, 'product_name', p.name, 'price', p.price))
         FROM subscription_items si JOIN products p ON si.product_id = p.id WHERE si.subscription_id = s.id) as items
      FROM subscriptions s
      LEFT JOIN zones z ON s.zone_id = z.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'customer') {
      sql += ' AND s.customer_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY s.created_at DESC';
    const [subscriptions] = await pool.query(sql, params);

    const parsed = subscriptions.map(s => ({
      ...s,
      items: typeof s.items === 'string' ? JSON.parse(s.items) : s.items,
    }));

    res.json({ subscriptions: parsed });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/subscriptions
 */
router.post('/', authorize('customer'), [
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isInt({ min: 1 }),
  body('items.*.quantity').isInt({ min: 1 }),
  body('frequency_days').isInt({ min: 1 }),
  body('delivery_address').trim().notEmpty(),
  body('contact_phone').trim().notEmpty(),
  body('zone_id').optional().isInt({ min: 1 }),
  body('preferred_time').optional().trim(),
  body('payment_method').optional().isIn(['cod', 'gcash', 'online']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { items, frequency_days, delivery_address, contact_phone, zone_id, preferred_time, payment_method } = req.body;

    // Calculate next delivery date
    const nextDelivery = new Date();
    nextDelivery.setDate(nextDelivery.getDate() + frequency_days);
    const nextDeliveryStr = nextDelivery.toISOString().split('T')[0];

    const [result] = await pool.query(
      `INSERT INTO subscriptions (customer_id, frequency_days, next_delivery_date, delivery_address, zone_id, contact_phone, preferred_time, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, frequency_days, nextDeliveryStr, delivery_address, zone_id || null, contact_phone, preferred_time || null, payment_method || 'cod']
    );

    // Insert subscription items
    for (const item of items) {
      await pool.query(
        'INSERT INTO subscription_items (subscription_id, product_id, quantity) VALUES (?, ?, ?)',
        [result.insertId, item.product_id, item.quantity]
      );
    }

    res.status(201).json({ message: 'Subscription created', subscriptionId: result.insertId });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/subscriptions/:id/pause
 */
router.put('/:id/pause', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerCheck = req.user.role === 'customer' ? ' AND customer_id = ?' : '';
    const params = [id];
    if (req.user.role === 'customer') params.push(req.user.id);

    await pool.query(`UPDATE subscriptions SET is_active = 0 WHERE id = ?${ownerCheck}`, params);
    res.json({ message: 'Subscription paused' });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/subscriptions/:id/resume
 */
router.put('/:id/resume', async (req, res, next) => {
  try {
    const { id } = req.params;
    const nextDelivery = new Date();
    const ownerCheck = req.user.role === 'customer' ? ' AND customer_id = ?' : '';

    const [sub] = await pool.query(`SELECT frequency_days FROM subscriptions WHERE id = ?${ownerCheck}`,
      req.user.role === 'customer' ? [id, req.user.id] : [id]);

    if (!sub.length) return res.status(404).json({ error: 'Subscription not found' });

    nextDelivery.setDate(nextDelivery.getDate() + sub[0].frequency_days);
    const params = [nextDelivery.toISOString().split('T')[0], id];
    if (req.user.role === 'customer') params.push(req.user.id);

    await pool.query(`UPDATE subscriptions SET is_active = 1, next_delivery_date = ? WHERE id = ?${req.user.role === 'customer' ? ' AND customer_id = ?' : ''}`, params);
    res.json({ message: 'Subscription resumed' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/subscriptions/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const ownerCheck = req.user.role === 'customer' ? ' AND customer_id = ?' : '';
    const params = [id];
    if (req.user.role === 'customer') params.push(req.user.id);

    await pool.query(`DELETE FROM subscriptions WHERE id = ?${ownerCheck}`, params);
    res.json({ message: 'Subscription cancelled' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
