/**
 * Inventory Routes
 * GET /api/inventory - List inventory with stock levels
 * GET /api/inventory/logs - Inventory movement history
 * GET /api/inventory/low-stock - Products below threshold
 */
const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('admin'));

/**
 * GET /api/inventory
 * List all products with stock information
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY category, name';
    const [products] = await pool.query(sql, params);

    // Summarize
    const totalItems = products.length;
    const lowStockItems = products.filter(p => p.stock_quantity <= p.low_stock_threshold && p.is_active);
    const outOfStock = products.filter(p => p.stock_quantity === 0 && p.is_active);

    res.json({
      products,
      summary: {
        totalItems,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStock.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/inventory/logs
 * Get inventory movement history
 */
router.get('/logs', async (req, res, next) => {
  try {
    const { product_id, date_from, date_to, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT il.*, p.name as product_name, u.name as created_by_name
      FROM inventory_logs il
      JOIN products p ON il.product_id = p.id
      LEFT JOIN users u ON il.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      sql += ' AND il.product_id = ?';
      params.push(product_id);
    }
    if (date_from) {
      sql += ' AND DATE(il.created_at) >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND DATE(il.created_at) <= ?';
      params.push(date_to);
    }

    const countSql = sql.replace(/SELECT il\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.query(countSql, params);

    sql += ' ORDER BY il.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [logs] = await pool.query(sql, params);

    res.json({
      logs,
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
 * GET /api/inventory/low-stock
 * Get products below their low stock threshold
 */
router.get('/low-stock', async (req, res, next) => {
  try {
    const [products] = await pool.query(
      'SELECT * FROM products WHERE stock_quantity <= low_stock_threshold AND is_active = 1 ORDER BY stock_quantity ASC'
    );
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
