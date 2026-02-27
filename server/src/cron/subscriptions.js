/**
 * Subscription Cron Job
 * Automatically generates orders for active subscriptions on their scheduled dates
 * Runs daily at 6:00 AM
 */
const cron = require('node-cron');
const pool = require('../config/database');
const { notifyAdmins, createNotification } = require('../services/notificationService');

const startSubscriptionCron = () => {
  // Run every day at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('🔄 Running subscription order generation...');

    try {
      const today = new Date().toISOString().split('T')[0];

      // Find active subscriptions due today
      const [subscriptions] = await pool.query(`
        SELECT s.*, z.delivery_fee,
          (SELECT JSON_ARRAYAGG(JSON_OBJECT('product_id', si.product_id, 'quantity', si.quantity))
           FROM subscription_items si WHERE si.subscription_id = s.id) as items
        FROM subscriptions s
        LEFT JOIN zones z ON s.zone_id = z.id
        WHERE s.is_active = 1 AND s.next_delivery_date <= ?
      `, [today]);

      console.log(`📋 Found ${subscriptions.length} subscriptions due`);

      for (const sub of subscriptions) {
        const conn = await pool.getConnection();
        try {
          await conn.beginTransaction();

          const items = typeof sub.items === 'string' ? JSON.parse(sub.items) : sub.items;
          if (!items || !items.length) continue;

          // Calculate total
          let subtotal = 0;
          const orderItems = [];

          for (const item of items) {
            const [products] = await conn.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [item.product_id]);
            if (!products.length) continue;

            const product = products[0];
            if (product.stock_quantity < item.quantity) {
              // Notify about insufficient stock
              await createNotification(sub.customer_id, {
                type: 'low_stock',
                title: 'Subscription Order Issue',
                message: `Could not fulfill your subscription - ${product.name} is out of stock.`,
              });
              continue;
            }

            orderItems.push({
              product_id: product.id,
              quantity: item.quantity,
              unit_price: product.price,
            });
            subtotal += product.price * item.quantity;
          }

          if (!orderItems.length) {
            await conn.rollback();
            continue;
          }

          const deliveryFee = sub.delivery_fee || 0;
          const totalAmount = subtotal + Number(deliveryFee);

          // Create order
          const [orderResult] = await conn.query(
            `INSERT INTO orders (customer_id, status, payment_method, delivery_fee, zone_id, address, contact_phone, preferred_time, notes, total_amount)
             VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, 'Auto-generated from subscription', ?)`,
            [sub.customer_id, sub.payment_method, deliveryFee, sub.zone_id, sub.delivery_address, sub.contact_phone, sub.preferred_time, totalAmount]
          );

          // Insert items & deduct stock
          for (const item of orderItems) {
            await conn.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
              [orderResult.insertId, item.product_id, item.quantity, item.unit_price]);

            await conn.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
              [item.quantity, item.product_id]);
          }

          // Update next delivery date
          const nextDate = new Date(sub.next_delivery_date);
          nextDate.setDate(nextDate.getDate() + sub.frequency_days);
          await conn.query('UPDATE subscriptions SET next_delivery_date = ? WHERE id = ?',
            [nextDate.toISOString().split('T')[0], sub.id]);

          await conn.commit();

          // Notify
          await createNotification(sub.customer_id, {
            type: 'order_placed',
            title: 'Subscription Order Placed',
            message: `Your recurring order #${orderResult.insertId} has been automatically placed. Total: ₱${totalAmount.toFixed(2)}`,
            link: `/orders/${orderResult.insertId}`,
          });

          console.log(`✅ Created order #${orderResult.insertId} for subscription #${sub.id}`);
        } catch (err) {
          await conn.rollback();
          console.error(`❌ Failed to process subscription #${sub.id}:`, err.message);
        } finally {
          conn.release();
        }
      }

      console.log('✅ Subscription cron job complete');
    } catch (err) {
      console.error('❌ Subscription cron error:', err);
    }
  });

  console.log('⏰ Subscription cron job scheduled (daily at 6:00 AM)');
};

module.exports = startSubscriptionCron;
