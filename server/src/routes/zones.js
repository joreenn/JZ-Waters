/**
 * Zone Management Routes
 * GET    /api/zones - List all zones (public)
 * POST   /api/zones - Create zone (admin)
 * PUT    /api/zones/:id - Update zone (admin)
 * DELETE /api/zones/:id - Deactivate zone (admin)
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/zones
 * List all active zones (public)
 */
router.get('/', async (req, res, next) => {
  try {
    const { all } = req.query;
    const sql = all ? 'SELECT * FROM zones ORDER BY name' : 'SELECT * FROM zones WHERE is_active = 1 ORDER BY name';
    const [zones] = await pool.query(sql);
    res.json({ zones });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/zones
 */
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Zone name is required'),
  body('delivery_fee').isFloat({ min: 0 }).withMessage('Delivery fee must be >= 0'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { name, delivery_fee } = req.body;
    const [result] = await pool.query('INSERT INTO zones (name, delivery_fee) VALUES (?, ?)', [name, delivery_fee]);
    res.status(201).json({ message: 'Zone created', zone: { id: result.insertId, name, delivery_fee } });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/zones/:id
 */
router.put('/:id', authenticate, authorize('admin'), [
  body('name').optional().trim().notEmpty(),
  body('delivery_fee').optional().isFloat({ min: 0 }),
  body('is_active').optional().isBoolean(),
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, delivery_fee, is_active } = req.body;
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (delivery_fee !== undefined) { updates.push('delivery_fee = ?'); values.push(delivery_fee); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    await pool.query(`UPDATE zones SET ${updates.join(', ')} WHERE id = ?`, values);
    const [zone] = await pool.query('SELECT * FROM zones WHERE id = ?', [id]);
    res.json({ message: 'Zone updated', zone: zone[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/zones/:id
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await pool.query('UPDATE zones SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Zone deactivated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
