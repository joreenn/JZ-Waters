/**
 * Authentication Routes
 * POST /api/auth/register - Customer registration
 * POST /api/auth/login - Login for all roles
 * POST /api/auth/forgot-password - Request password reset
 * POST /api/auth/reset-password - Reset password with token
 * GET  /api/auth/me - Get current user profile
 * PUT  /api/auth/profile - Update profile
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../services/emailService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * POST /api/auth/register
 * Customer self-registration
 */
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, phone, address } = req.body;

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, "customer", ?, ?)',
      [name, email, passwordHash, phone || null, address || null]
    );

    const token = generateToken(result.insertId, 'customer');

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: result.insertId, name, email, role: 'customer', phone, address, points_balance: 0 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Login for all user roles
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { email, password } = req.body;
    const [users] = await pool.query(
      'SELECT id, name, email, password_hash, role, phone, address, points_balance, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);
    const { password_hash, is_active, ...userData } = user;

    res.json({ message: 'Login successful', token, user: userData });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset link
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res, next) => {
  try {
    const { email } = req.body;
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE email = ? AND is_active = 1', [email]);

    // Always return success to prevent email enumeration
    if (!users.length) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const template = emailTemplates.passwordReset(user.name, resetLink);
    await sendEmail(user.email, template.subject, template.html);

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const [users] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (!users.length) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, users[0].id]
    );

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
], async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }

    if (!updates.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query(
      'SELECT id, name, email, role, phone, address, points_balance FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Profile updated', user: updated[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/change-password
 * Change password for authenticated user
 */
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
