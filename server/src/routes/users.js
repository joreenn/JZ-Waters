/**
 * User Management Routes (Admin only)
 * GET    /api/users - List all users
 * POST   /api/users - Create staff user
 * PUT    /api/users/:id - Update user
 * PUT    /api/users/:id/toggle-active - Activate/deactivate user
 * DELETE /api/users/:id - Delete user
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult, query } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin auth
router.use(authenticate, authorize('admin'));

/**
 * GET /api/users
 * List all users with optional filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT id, name, email, role, phone, address, points_balance, is_active, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Count total
    const countSql = sql.replace('SELECT id, name, email, role, phone, address, points_balance, is_active, created_at', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countSql, params);
    const total = countResult[0].total;

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [users] = await pool.query(sql, params);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Create a staff user (refiller or delivery)
 */
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['refiller', 'delivery', 'admin']).withMessage('Role must be refiller, delivery, or admin'),
  body('phone').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, role, phone } = req.body;

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, role, phone || null]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: { id: result.insertId, name, email, role, phone },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:id
 * Update user details
 */
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('role').optional().isIn(['admin', 'refiller', 'delivery', 'customer']),
  body('phone').optional().trim(),
  body('address').optional().trim(),
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, phone, address } = req.body;
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (role) { updates.push('role = ?'); values.push(role); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }

    if (!updates.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query(
      'SELECT id, name, email, role, phone, address, is_active, points_balance, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({ message: 'User updated', user: updated[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:id/toggle-active
 * Activate or deactivate a user
 */
router.put('/:id/toggle-active', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deactivation
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id]);
    const [updated] = await pool.query('SELECT id, name, is_active FROM users WHERE id = ?', [id]);

    res.json({
      message: updated[0].is_active ? 'User activated' : 'User deactivated',
      user: updated[0],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (soft delete via deactivation recommended, but hard delete also available)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check for associated records
    const [orders] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE customer_id = ?', [id]);
    if (orders[0].count > 0) {
      // Soft delete instead
      await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
      return res.json({ message: 'User has orders and was deactivated instead of deleted' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
