/**
 * Dashboard & Reports Routes
 * GET /api/dashboard/admin - Admin dashboard summary
 * GET /api/reports/sales - Sales report with filters
 * GET /api/reports/export/csv - Export CSV
 * GET /api/reports/export/pdf - Export PDF
 */
const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { createObjectCsvStringifier } = require('csv-writer');
const PDFDocument = require('pdfkit');

const router = express.Router();
router.use(authenticate, authorize('admin'));

const toNumber = (value) => Number(value || 0);

function mergePeriodRows(refillRows, deliveryRows, keyField, labelField = keyField) {
  const map = new Map();

  for (const row of refillRows) {
    map.set(row[keyField], {
      period_key: row[keyField],
      period: row[labelField],
      refill_revenue: toNumber(row.refill_revenue),
      delivery_revenue: 0,
      refill_count: toNumber(row.refill_count),
      delivery_count: 0,
    });
  }

  for (const row of deliveryRows) {
    const existing = map.get(row[keyField]) || {
      period_key: row[keyField],
      period: row[labelField],
      refill_revenue: 0,
      delivery_revenue: 0,
      refill_count: 0,
      delivery_count: 0,
    };

    existing.delivery_revenue = toNumber(row.delivery_revenue);
    existing.delivery_count = toNumber(row.delivery_count);
    if (!existing.period) {
      existing.period = row[labelField];
    }
    map.set(row[keyField], existing);
  }

  return Array.from(map.values())
    .sort((a, b) => String(a.period_key).localeCompare(String(b.period_key)))
    .map((row) => ({
      ...row,
      total_revenue: row.refill_revenue + row.delivery_revenue,
      total_orders: row.refill_count + row.delivery_count,
    }));
}

/**
 * GET /api/dashboard/admin
 * Admin dashboard summary cards and charts
 */
router.get('/admin', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    // Summary cards
    const [refillToday] = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM refill_transactions WHERE DATE(created_at) = ?',
      [today]
    );

    const [deliveriesToday] = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE DATE(created_at) = ? AND status != "cancelled"',
      [today]
    );

    const [monthRevenue] = await pool.query(`
      SELECT 
        COALESCE((SELECT SUM(total) FROM refill_transactions WHERE DATE(created_at) >= ?), 0) +
        COALESCE((SELECT SUM(total_amount) FROM orders WHERE DATE(created_at) >= ? AND status = 'delivered'), 0) as total
    `, [monthStart, monthStart]);

    // Daily sales chart data (last 30 days)
    const [dailySales] = await pool.query(`
      SELECT dates.date,
        COALESCE(r.refill_total, 0) as refill_revenue,
        COALESCE(d.delivery_total, 0) as delivery_revenue
      FROM (
        SELECT DATE(DATE_SUB(NOW(), INTERVAL n DAY)) as date
        FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
              UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
              UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
              UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
              UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24
              UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29) numbers
      ) dates
      LEFT JOIN (
        SELECT DATE(created_at) as date, SUM(total) as refill_total 
        FROM refill_transactions GROUP BY DATE(created_at)
      ) r ON dates.date = r.date
      LEFT JOIN (
        SELECT DATE(created_at) as date, SUM(total_amount) as delivery_total 
        FROM orders WHERE status = 'delivered' GROUP BY DATE(created_at)
      ) d ON dates.date = d.date
      ORDER BY dates.date ASC
    `);

    // Revenue breakdown pie chart
    const [revBreakdown] = await pool.query(`
      SELECT 
        COALESCE((SELECT SUM(total) FROM refill_transactions WHERE DATE(created_at) >= ?), 0) as refill_revenue,
        COALESCE((SELECT SUM(total_amount - delivery_fee) FROM orders WHERE DATE(created_at) >= ? AND status = 'delivered'), 0) as delivery_revenue,
        COALESCE((SELECT SUM(delivery_fee) FROM orders WHERE DATE(created_at) >= ? AND status = 'delivered'), 0) as delivery_fees
    `, [monthStart, monthStart, monthStart]);

    // Recent transactions
    const [recentOrders] = await pool.query(`
      SELECT o.id, o.status, o.total_amount, o.created_at, u.name as customer_name, 'delivery' as type
      FROM orders o JOIN users u ON o.customer_id = u.id
      ORDER BY o.created_at DESC LIMIT 10
    `);

    const [recentRefills] = await pool.query(`
      SELECT rt.id, rt.customer_name, rt.total as total_amount, rt.created_at, 'refill' as type
      FROM refill_transactions rt
      ORDER BY rt.created_at DESC LIMIT 10
    `);

    // Low stock alerts
    const [lowStock] = await pool.query(
      'SELECT id, name, stock_quantity, low_stock_threshold FROM products WHERE stock_quantity <= low_stock_threshold AND is_active = 1'
    );

    // Order status counts
    const [orderCounts] = await pool.query(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `);

    res.json({
      summary: {
        totalSalesToday: Number(refillToday[0].revenue) + Number(deliveriesToday[0].revenue),
        totalRefillsToday: refillToday[0].count,
        totalDeliveriesToday: deliveriesToday[0].count,
        monthlyRevenue: Number(monthRevenue[0].total),
      },
      dailySales,
      revenueBreakdown: revBreakdown[0],
      recentTransactions: [...recentOrders, ...recentRefills].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10),
      lowStock,
      orderCounts,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/sales
 * Detailed sales report with filters
 */
router.get('/sales', async (req, res, next) => {
  try {
    const { date_from, date_to, type = 'all', product_id } = req.query;
    const result = { refills: null, deliveries: null, summary: {} };

    // Refill sales
    if (type === 'all' || type === 'refill') {
      let refillSql = `
        SELECT rt.*, u.name as staff_name 
        FROM refill_transactions rt JOIN users u ON rt.staff_id = u.id 
        WHERE 1=1
      `;
      const refillParams = [];
      if (date_from) { refillSql += ' AND DATE(rt.created_at) >= ?'; refillParams.push(date_from); }
      if (date_to) { refillSql += ' AND DATE(rt.created_at) <= ?'; refillParams.push(date_to); }
      refillSql += ' ORDER BY rt.created_at DESC';

      const [refills] = await pool.query(refillSql, refillParams);
      result.refills = refills;
      result.summary.refillCount = refills.length;
      result.summary.refillRevenue = refills.reduce((sum, r) => sum + Number(r.total), 0);
    }

    // Delivery sales
    if (type === 'all' || type === 'delivery') {
      let deliverySql = `
        SELECT o.*, u.name as customer_name
        FROM orders o JOIN users u ON o.customer_id = u.id
        WHERE o.status = 'delivered'
      `;
      const deliveryParams = [];
      if (date_from) { deliverySql += ' AND DATE(o.created_at) >= ?'; deliveryParams.push(date_from); }
      if (date_to) { deliverySql += ' AND DATE(o.created_at) <= ?'; deliveryParams.push(date_to); }
      if (product_id) {
        deliverySql += ' AND o.id IN (SELECT order_id FROM order_items WHERE product_id = ?)';
        deliveryParams.push(product_id);
      }
      deliverySql += ' ORDER BY o.created_at DESC';

      const [deliveries] = await pool.query(deliverySql, deliveryParams);
      result.deliveries = deliveries;
      result.summary.deliveryCount = deliveries.length;
      result.summary.deliveryRevenue = deliveries.reduce((sum, d) => sum + Number(d.total_amount), 0);
    }

    result.summary.totalTransactions = (result.summary.refillCount || 0) + (result.summary.deliveryCount || 0);
    result.summary.totalRevenue = (result.summary.refillRevenue || 0) + (result.summary.deliveryRevenue || 0);
    result.summary.averageOrderValue = result.summary.totalTransactions > 0
      ? result.summary.totalRevenue / result.summary.totalTransactions
      : 0;

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/analytics
 * Combined analytics for charts and insight cards
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    const refillDateFilter = [];
    const refillParams = [];
    if (start_date) {
      refillDateFilter.push('DATE(created_at) >= ?');
      refillParams.push(start_date);
    }
    if (end_date) {
      refillDateFilter.push('DATE(created_at) <= ?');
      refillParams.push(end_date);
    }
    const refillWhere = refillDateFilter.length ? `WHERE ${refillDateFilter.join(' AND ')}` : '';

    const orderDateFilter = ['status = "delivered"'];
    const orderParams = [];
    if (start_date) {
      orderDateFilter.push('DATE(created_at) >= ?');
      orderParams.push(start_date);
    }
    if (end_date) {
      orderDateFilter.push('DATE(created_at) <= ?');
      orderParams.push(end_date);
    }
    const orderWhere = `WHERE ${orderDateFilter.join(' AND ')}`;

    const [dailyRefills] = await pool.query(
      `SELECT
        DATE(created_at) AS period_key,
        DATE_FORMAT(DATE(created_at), '%b %d') AS period,
        COALESCE(SUM(total), 0) AS refill_revenue,
        COUNT(*) AS refill_count
       FROM refill_transactions
       ${refillWhere}
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      refillParams
    );

    const [dailyDeliveries] = await pool.query(
      `SELECT
        DATE(created_at) AS period_key,
        DATE_FORMAT(DATE(created_at), '%b %d') AS period,
        COALESCE(SUM(total_amount), 0) AS delivery_revenue,
        COUNT(*) AS delivery_count
       FROM orders
       ${orderWhere}
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      orderParams
    );

    const [weeklyRefills] = await pool.query(
      `SELECT
        CONCAT(YEAR(created_at), '-', LPAD(WEEK(created_at, 1), 2, '0')) AS period_key,
        DATE_FORMAT(DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY), '%b %d') AS period,
        COALESCE(SUM(total), 0) AS refill_revenue,
        COUNT(*) AS refill_count
       FROM refill_transactions
       ${refillWhere}
       GROUP BY YEAR(created_at), WEEK(created_at, 1)
       ORDER BY YEAR(created_at), WEEK(created_at, 1)`,
      refillParams
    );

    const [weeklyDeliveries] = await pool.query(
      `SELECT
        CONCAT(YEAR(created_at), '-', LPAD(WEEK(created_at, 1), 2, '0')) AS period_key,
        DATE_FORMAT(DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY), '%b %d') AS period,
        COALESCE(SUM(total_amount), 0) AS delivery_revenue,
        COUNT(*) AS delivery_count
       FROM orders
       ${orderWhere}
       GROUP BY YEAR(created_at), WEEK(created_at, 1)
       ORDER BY YEAR(created_at), WEEK(created_at, 1)`,
      orderParams
    );

    const [monthlyRefills] = await pool.query(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS period_key,
        DATE_FORMAT(created_at, '%b %Y') AS period,
        COALESCE(SUM(total), 0) AS refill_revenue,
        COUNT(*) AS refill_count
       FROM refill_transactions
       ${refillWhere}
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC`,
      refillParams
    );

    const [monthlyDeliveries] = await pool.query(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS period_key,
        DATE_FORMAT(created_at, '%b %Y') AS period,
        COALESCE(SUM(total_amount), 0) AS delivery_revenue,
        COUNT(*) AS delivery_count
       FROM orders
       ${orderWhere}
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC`,
      orderParams
    );

    const topProductParams = [];
    let topProductWhere = 'WHERE o.status = "delivered"';
    if (start_date) {
      topProductWhere += ' AND DATE(o.created_at) >= ?';
      topProductParams.push(start_date);
    }
    if (end_date) {
      topProductWhere += ' AND DATE(o.created_at) <= ?';
      topProductParams.push(end_date);
    }

    const [topProducts] = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.category,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       ${topProductWhere}
       GROUP BY p.id, p.name, p.category
       ORDER BY total_quantity DESC, total_revenue DESC
       LIMIT 10`,
      topProductParams
    );

    const [summaryRefill] = await pool.query(
      `SELECT
        COUNT(*) AS transaction_count,
        COALESCE(SUM(total), 0) AS revenue
       FROM refill_transactions
       ${refillWhere}`,
      refillParams
    );

    const [summaryDelivery] = await pool.query(
      `SELECT
        COUNT(*) AS transaction_count,
        COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders
       ${orderWhere}`,
      orderParams
    );

    const refillRevenue = toNumber(summaryRefill[0]?.revenue);
    const deliveryRevenue = toNumber(summaryDelivery[0]?.revenue);
    const refillCount = toNumber(summaryRefill[0]?.transaction_count);
    const deliveryCount = toNumber(summaryDelivery[0]?.transaction_count);
    const totalRevenue = refillRevenue + deliveryRevenue;
    const totalTransactions = refillCount + deliveryCount;

    const daily = mergePeriodRows(dailyRefills, dailyDeliveries, 'period_key');
    const weekly = mergePeriodRows(weeklyRefills, weeklyDeliveries, 'period_key');
    const monthly = mergePeriodRows(monthlyRefills, monthlyDeliveries, 'period_key');

    const bestDay = [...daily].sort((a, b) => b.total_revenue - a.total_revenue)[0] || null;
    const bestWeek = [...weekly].sort((a, b) => b.total_revenue - a.total_revenue)[0] || null;
    const bestMonth = [...monthly].sort((a, b) => b.total_revenue - a.total_revenue)[0] || null;

    res.json({
      summary: {
        total_revenue: totalRevenue,
        refill_revenue: refillRevenue,
        delivery_revenue: deliveryRevenue,
        total_transactions: totalTransactions,
        refill_transactions: refillCount,
        delivery_transactions: deliveryCount,
        average_order_value: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        top_product_name: topProducts[0]?.name || null,
      },
      insights: {
        best_day: bestDay,
        best_week: bestWeek,
        best_month: bestMonth,
      },
      trends: {
        daily,
        weekly,
        monthly,
      },
      top_products: topProducts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        total_quantity: toNumber(p.total_quantity),
        total_revenue: toNumber(p.total_revenue),
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/export/csv
 * Export sales data as CSV
 */
router.get('/export/csv', async (req, res, next) => {
  try {
    const { date_from, date_to, type = 'all' } = req.query;
    const rows = [];

    if (type === 'all' || type === 'refill') {
      let sql = 'SELECT * FROM refill_transactions WHERE 1=1';
      const params = [];
      if (date_from) { sql += ' AND DATE(created_at) >= ?'; params.push(date_from); }
      if (date_to) { sql += ' AND DATE(created_at) <= ?'; params.push(date_to); }
      const [refills] = await pool.query(sql, params);
      refills.forEach(r => rows.push({
        type: 'Refill', id: r.id, customer: r.customer_name, amount: r.total, date: r.created_at,
      }));
    }

    if (type === 'all' || type === 'delivery') {
      let sql = 'SELECT o.*, u.name as customer_name FROM orders o JOIN users u ON o.customer_id = u.id WHERE o.status = "delivered"';
      const params = [];
      if (date_from) { sql += ' AND DATE(o.created_at) >= ?'; params.push(date_from); }
      if (date_to) { sql += ' AND DATE(o.created_at) <= ?'; params.push(date_to); }
      const [deliveries] = await pool.query(sql, params);
      deliveries.forEach(d => rows.push({
        type: 'Delivery', id: d.id, customer: d.customer_name, amount: d.total_amount, date: d.created_at,
      }));
    }

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'type', title: 'Type' },
        { id: 'id', title: 'ID' },
        { id: 'customer', title: 'Customer' },
        { id: 'amount', title: 'Amount' },
        { id: 'date', title: 'Date' },
      ],
    });

    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/export/pdf
 * Export sales summary as PDF
 */
router.get('/export/pdf', async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;

    // Get summary data
    let refillTotal = 0, deliveryTotal = 0, refillCount = 0, deliveryCount = 0;

    let sql = 'SELECT COUNT(*) as cnt, COALESCE(SUM(total), 0) as total FROM refill_transactions WHERE 1=1';
    const rParams = [];
    if (date_from) { sql += ' AND DATE(created_at) >= ?'; rParams.push(date_from); }
    if (date_to) { sql += ' AND DATE(created_at) <= ?'; rParams.push(date_to); }
    const [refills] = await pool.query(sql, rParams);
    refillCount = refills[0].cnt;
    refillTotal = Number(refills[0].total);

    sql = 'SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = "delivered"';
    const dParams = [];
    if (date_from) { sql += ' AND DATE(created_at) >= ?'; dParams.push(date_from); }
    if (date_to) { sql += ' AND DATE(created_at) <= ?'; dParams.push(date_to); }
    const [deliveries] = await pool.query(sql, dParams);
    deliveryCount = deliveries[0].cnt;
    deliveryTotal = Number(deliveries[0].total);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('JZ Waters - Sales Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date Range: ${date_from || 'All'} to ${date_to || 'All'}`);
    doc.moveDown();

    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
      .text(`Total Transactions: ${refillCount + deliveryCount}`)
      .text(`Total Revenue: ₱${(refillTotal + deliveryTotal).toFixed(2)}`)
      .text(`Refill Transactions: ${refillCount} (₱${refillTotal.toFixed(2)})`)
      .text(`Delivery Orders: ${deliveryCount} (₱${deliveryTotal.toFixed(2)})`)
      .text(`Average Order Value: ₱${((refillTotal + deliveryTotal) / Math.max(refillCount + deliveryCount, 1)).toFixed(2)}`);

    doc.moveDown(2);
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
