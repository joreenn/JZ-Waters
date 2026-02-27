/**
 * Refill Transaction Routes
 * GET  /api/refills - List refill transactions
 * POST /api/refills - Create refill transaction
 * GET  /api/refills/summary - Daily summary
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/refills
 * List refill transactions with filters
 * Refillers see their own; Admin sees all
 */
router.get('/', authorize('admin', 'refiller'), async (req, res, next) => {
  try {
    const { date_from, date_to, page = 1, limit = 50 } = req.query;
    let sql = `
      SELECT rt.*, u.name as staff_name 
      FROM refill_transactions rt 
      JOIN users u ON rt.staff_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    // Refillers only see their own transactions
    if (req.user.role === 'refiller') {
      sql += ' AND rt.staff_id = ?';
      params.push(req.user.id);
    }

    if (date_from) {
      sql += ' AND DATE(rt.created_at) >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND DATE(rt.created_at) <= ?';
      params.push(date_to);
    }

    const countSql = sql.replace(/SELECT rt\.\*, u\.name as staff_name/, 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countSql, params);

    sql += ' ORDER BY rt.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [refills] = await pool.query(sql, params);

    res.json({
      refills,
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
 * GET /api/refills/summary
 * Get daily refill summary for today
 */
router.get('/summary', authorize('admin', 'refiller'), async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let staffFilter = '';
    const params = [targetDate];

    if (req.user.role === 'refiller') {
      staffFilter = ' AND staff_id = ?';
      params.push(req.user.id);
    }

    const [summary] = await pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(gallons_count), 0) as total_gallons,
        COALESCE(SUM(total), 0) as total_revenue
      FROM refill_transactions 
      WHERE DATE(created_at) = ?${staffFilter}
    `, params);

    res.json({ summary: summary[0], date: targetDate });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/refills
 * Create a new refill transaction
 */
router.post('/', authorize('admin', 'refiller'), [
  body('customer_name').optional().trim().default('Walk-in'),
  body('gallons_count').isFloat({ min: 0.1 }).withMessage('Gallons must be > 0'),
  body('price_per_gallon').isFloat({ min: 0 }).withMessage('Price must be >= 0'),
  body('notes').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { customer_name, gallons_count, price_per_gallon, notes } = req.body;
    const total = gallons_count * price_per_gallon;

    const [result] = await pool.query(
      'INSERT INTO refill_transactions (staff_id, customer_name, gallons_count, price_per_gallon, total, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, customer_name || 'Walk-in', gallons_count, price_per_gallon, total, notes || null]
    );

    const [refill] = await pool.query(
      'SELECT rt.*, u.name as staff_name FROM refill_transactions rt JOIN users u ON rt.staff_id = u.id WHERE rt.id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Refill transaction logged', refill: refill[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
