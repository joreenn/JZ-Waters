/**
 * Loyalty Points Routes
 * GET /api/loyalty/balance - Get current points balance
 * GET /api/loyalty/history - Get points history
 */
const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/loyalty/balance
 */
router.get('/balance', async (req, res, next) => {
  try {
    const [user] = await pool.query('SELECT points_balance FROM users WHERE id = ?', [req.user.id]);
    const [ratio] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = "points_to_peso_ratio"');

    res.json({
      points_balance: user[0].points_balance,
      peso_value: user[0].points_balance * (ratio.length ? Number(ratio[0].setting_value) : 0.5),
      points_to_peso_ratio: ratio.length ? Number(ratio[0].setting_value) : 0.5,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/loyalty/history
 */
router.get('/history', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = 'SELECT * FROM loyalty_points_log WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const params = [req.user.id, parseInt(limit), offset];

    // Admin can view any customer's history
    if (req.user.role === 'admin' && req.query.customer_id) {
      sql = 'SELECT * FROM loyalty_points_log WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params[0] = req.query.customer_id;
    }

    const [logs] = await pool.query(sql, params);
    res.json({ history: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
