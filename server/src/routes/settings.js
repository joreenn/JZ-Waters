/**
 * Settings Routes
 * GET /api/settings - Get all settings (admin) or public settings
 * PUT /api/settings - Update settings (admin)
 */
const express = require('express');
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public settings (accessible without auth)
const PUBLIC_SETTINGS = ['store_name', 'store_address', 'store_phone', 'price_per_gallon', 'default_delivery_fee'];

/**
 * GET /api/settings/public
 * Get public store settings
 */
router.get('/public', async (req, res, next) => {
  try {
    const [settings] = await pool.query(
      'SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)',
      [PUBLIC_SETTINGS]
    );
    const obj = {};
    settings.forEach(s => obj[s.setting_key] = s.setting_value);
    res.json({ settings: obj });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/settings
 * Get all settings (admin)
 */
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings');
    const obj = {};
    settings.forEach(s => obj[s.setting_key] = s.setting_value);
    res.json({ settings: obj });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/settings
 * Update settings (admin)
 */
router.put('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }

    res.json({ message: 'Settings updated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
