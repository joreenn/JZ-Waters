/**
 * Notification Routes
 * GET  /api/notifications - Get user's notifications
 * PUT  /api/notifications/:id/read - Mark as read
 * PUT  /api/notifications/read-all - Mark all as read
 * GET  /api/notifications/unread-count - Get unread count
 */
const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/notifications
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), offset]
    );

    const [count] = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count[0].total,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ count: result[0].count });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/notifications/read-all
 */
router.put('/read-all', async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
