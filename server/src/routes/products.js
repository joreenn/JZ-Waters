/**
 * Product Management Routes
 * GET    /api/products - List products (public for customers, full for admin)
 * GET    /api/products/:id - Get single product
 * POST   /api/products - Create product (admin)
 * PUT    /api/products/:id - Update product (admin)
 * DELETE /api/products/:id - Delete/deactivate product (admin)
 * PUT    /api/products/:id/stock - Adjust stock (admin)
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { notifyLowStock } = require('../services/notificationService');

const router = express.Router();

/**
 * GET /api/products
 * Public: returns active products; Admin: returns all products
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 50, all } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // If not requesting all (admin view), only show active
    if (!all) {
      sql += ' AND is_active = 1';
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY category, name';

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countSql, params);

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [products] = await pool.query(sql, params);

    res.json({
      products,
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
 * GET /api/products/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!products.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product: products[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/products
 * Create a new product (Admin only)
 */
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').isIn(['water_gallon', 'water_bottle', 'container', 'accessory', 'other']),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('unit').optional().trim(),
  body('low_stock_threshold').optional().isInt({ min: 0 }),
  body('description').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { name, description, category, price, stock_quantity, unit, low_stock_threshold } = req.body;

    const [result] = await pool.query(
      'INSERT INTO products (name, description, category, price, stock_quantity, unit, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description || null, category, price, stock_quantity || 0, unit || 'gallon', low_stock_threshold || 10]
    );

    // Log initial stock
    if (stock_quantity > 0) {
      await pool.query(
        'INSERT INTO inventory_logs (product_id, change_quantity, previous_quantity, new_quantity, reason, reference_type, created_by) VALUES (?, ?, 0, ?, "Initial stock", "manual", ?)',
        [result.insertId, stock_quantity, stock_quantity, req.user.id]
      );
    }

    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Product created', product: product[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/products/:id
 * Update product details (Admin only)
 */
router.put('/:id', authenticate, authorize('admin'), [
  body('name').optional().trim().notEmpty(),
  body('category').optional().isIn(['water_gallon', 'water_bottle', 'container', 'accessory', 'other']),
  body('price').optional().isFloat({ min: 0 }),
  body('unit').optional().trim(),
  body('low_stock_threshold').optional().isInt({ min: 0 }),
  body('description').optional().trim(),
  body('is_active').optional().isBoolean(),
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = ['name', 'description', 'category', 'price', 'unit', 'low_stock_threshold', 'is_active'];
    const updates = [];
    const values = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);

    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product updated', product: product[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/products/:id/stock
 * Adjust product stock (Admin only)
 */
router.put('/:id/stock', authenticate, authorize('admin'), [
  body('change_quantity').isInt().withMessage('Change quantity must be an integer'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { change_quantity, reason } = req.body;

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!products.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    const newQuantity = product.stock_quantity + parseInt(change_quantity);

    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    await pool.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQuantity, id]);

    // Log the change
    await pool.query(
      'INSERT INTO inventory_logs (product_id, change_quantity, previous_quantity, new_quantity, reason, reference_type, created_by) VALUES (?, ?, ?, ?, ?, "manual", ?)',
      [id, change_quantity, product.stock_quantity, newQuantity, reason, req.user.id]
    );

    // Check low stock
    if (newQuantity <= product.low_stock_threshold) {
      await notifyLowStock({ ...product, stock_quantity: newQuantity });
    }

    res.json({
      message: 'Stock updated',
      product: { ...product, stock_quantity: newQuantity },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/products/:id
 * Deactivate a product (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
