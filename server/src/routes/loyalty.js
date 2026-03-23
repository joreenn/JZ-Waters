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

    // Loyalty progress rule: every 150 pesos of purchases = 1%.
    // 100% reward threshold = 15,000 pesos, which grants 1 free gallon.
    const pesosPerPercent = 150;
    const pesosForOneReward = pesosPerPercent * 100;

    const [purchaseTotals] = await pool.query(
      `SELECT
         COALESCE(SUM(total_amount), 0) AS total_purchase_amount,
         COUNT(*) AS total_purchase_count
       FROM orders
       WHERE customer_id = ?`,
      [req.user.id]
    );

    const [statusCounts] = await pool.query(
      `SELECT
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
       FROM orders
       WHERE customer_id = ?`,
      [req.user.id]
    );

    const totalPurchaseAmount = Number(purchaseTotals[0]?.total_purchase_amount || 0);
    const totalPurchaseCount = Number(purchaseTotals[0]?.total_purchase_count || 0);

    const cyclePurchaseAmount = totalPurchaseAmount % pesosForOneReward;
    const progressPercent = Number(((cyclePurchaseAmount / pesosForOneReward) * 100).toFixed(1));
    const freeGallonsEarned = Math.floor(totalPurchaseAmount / pesosForOneReward);
    const pesosToNextReward = cyclePurchaseAmount === 0
      ? (totalPurchaseAmount === 0 ? pesosForOneReward : 0)
      : pesosForOneReward - cyclePurchaseAmount;

    const pointsBalance = Number(user[0]?.points_balance || 0);
    const ratioValue = ratio.length ? Number(ratio[0].setting_value) : 0.5;

    res.json({
      points_balance: pointsBalance,
      peso_value: pointsBalance * ratioValue,
      points_to_peso_ratio: ratioValue,
      total_purchase_amount: totalPurchaseAmount,
      total_purchase_count: totalPurchaseCount,
      pesos_per_percent: pesosPerPercent,
      pesos_for_one_reward: pesosForOneReward,
      pesos_in_current_cycle: cyclePurchaseAmount,
      pesos_to_next_reward: pesosToNextReward,
      progress_percent: progressPercent,
      free_gallons_earned: freeGallonsEarned,
      delivered_orders: Number(statusCounts[0]?.delivered_orders || 0),
      cancelled_orders: Number(statusCounts[0]?.cancelled_orders || 0),
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

    let sql = `
      SELECT id, points_change AS points, balance_after, reason AS description, reference_type, reference_id, created_at
      FROM loyalty_points_log
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const params = [req.user.id, parseInt(limit), offset];

    // Admin can view any customer's history
    if (req.user.role === 'admin' && req.query.customer_id) {
      sql = `
        SELECT id, points_change AS points, balance_after, reason AS description, reference_type, reference_id, created_at
        FROM loyalty_points_log
        WHERE customer_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      params[0] = req.query.customer_id;
    }

    const [logs] = await pool.query(sql, params);
    res.json({ history: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
