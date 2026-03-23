/**
 * Database Seed Script
 * Inserts sample data for development/testing
 * Run: node scripts/seed-db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jzwaters',
  });

  console.log('🔗 Connected to database');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed users
  const users = [
    ['Admin User', 'admin@jzwaters.com', passwordHash, 'admin', '09171234567', 'Store Address'],
    ['Refiller Staff', 'refiller@jzwaters.com', passwordHash, 'refiller', '09171234568', 'Store Address'],
    ['Delivery Guy 1', 'delivery1@jzwaters.com', passwordHash, 'delivery', '09171234569', 'Store Address'],
    ['Delivery Guy 2', 'delivery2@jzwaters.com', passwordHash, 'delivery', '09171234570', 'Store Address'],
    ['Juan Dela Cruz', 'juan@email.com', passwordHash, 'customer', '09181234567', '123 Rizal St, Brgy. Uno'],
    ['Maria Santos', 'maria@email.com', passwordHash, 'customer', '09181234568', '456 Mabini St, Brgy. Dos'],
    ['Pedro Garcia', 'pedro@email.com', passwordHash, 'customer', '09181234569', '789 Bonifacio Ave, Brgy. Tres'],
  ];

  for (const u of users) {
    await connection.query(
      'INSERT IGNORE INTO users (name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      u
    );
  }
  console.log('👥 Users seeded');

  // Seed zones
  const zones = [
    ['Tagum Downtown', 5.00],
    ['La Filipina', 10.00],
    ['San Miguel', 10.00],
    ['Terminal', 10.00],
    ['Maco', 10.00],
  ];

  // Deactivate all old zones first so checkout only shows the new list.
  await connection.query('UPDATE zones SET is_active = 0');

  // Prevent duplicate active zones for the same name.
  for (const [name, fee] of zones) {
    await connection.query('UPDATE zones SET is_active = 0 WHERE name = ?', [name]);
    await connection.query(
      'INSERT INTO zones (name, delivery_fee, is_active) VALUES (?, ?, 1)',
      [name, fee]
    );
  }
  console.log('📍 Zones seeded');

  // Replace product catalog with the required standardized product list.
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('TRUNCATE TABLE inventory_logs');
  await connection.query('TRUNCATE TABLE subscription_items');
  await connection.query('TRUNCATE TABLE order_items');
  await connection.query('TRUNCATE TABLE products');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  const products = [
    // WATER PRODUCTS
    ['Gallon of Water', 'Water Products', 25.00, 'Purified gallon water for home and business use', null],
    ['Plastic Water 500ml', 'Water Products', 15.00, 'Ready-to-drink bottled water (500ml)', null],
    ['Plastic Water 1L', 'Water Products', 25.00, 'Ready-to-drink bottled water (1 liter)', null],

    // CONTAINERS
    ['Water Gallon Empty', 'Containers', 120.00, 'Empty refillable water gallon container', null],
    ['500ml Empty Plastic Bottle', 'Containers', 8.00, 'Empty plastic bottle for 500ml water', null],
    ['1L Empty Plastic Bottle', 'Containers', 12.00, 'Empty plastic bottle for 1L water', null],

    // ACCESSORIES
    ['Water Pump', 'Accessories', 180.00, 'Manual water pump for gallon containers', null],
    ['Water Dispenser', 'Accessories', 3200.00, 'Water dispenser for home and office', null],
  ];

  for (const p of products) {
    await connection.query(
      'INSERT INTO products (name, category, price, description, image_url, stock_quantity, unit, low_stock_threshold, is_active) VALUES (?, ?, ?, ?, ?, 999, "piece", 10, 1)',
      p
    );
  }
  console.log('📦 Products seeded');

  // Seed some refill transactions
  const refills = [
    [2, 'Walk-in Customer', 3, 25.00],
    [2, 'Juan Dela Cruz', 5, 25.00],
    [2, 'Maria Santos', 2, 25.00],
    [2, 'Walk-in Customer', 1, 25.00],
    [2, 'Pedro Garcia', 4, 25.00],
  ];

  for (const r of refills) {
    await connection.query(
      'INSERT INTO refill_transactions (staff_id, customer_name, gallons_count, price_per_gallon, total) VALUES (?, ?, ?, ?, ?)',
      [...r, r[2] * r[3]]
    );
  }
  console.log('🔄 Refill transactions seeded');

  // Seed some orders
  const orderData = [
    { customer_id: 5, address: '123 Rizal St, Brgy. Uno', zone_id: 1, phone: '09181234567' },
    { customer_id: 6, address: '456 Mabini St, Brgy. Dos', zone_id: 2, phone: '09181234568' },
    { customer_id: 7, address: '789 Bonifacio Ave, Brgy. Tres', zone_id: 3, phone: '09181234569' },
  ];

  for (const od of orderData) {
    const [zoneResult] = await connection.query('SELECT delivery_fee FROM zones WHERE id = ?', [od.zone_id]);
    const deliveryFee = zoneResult[0]?.delivery_fee || 20;
    const itemTotal = 75.00; // 3 gallons x 25

    const [result] = await connection.query(
      'INSERT INTO orders (customer_id, status, payment_method, delivery_fee, zone_id, address, contact_phone, preferred_time, total_amount) VALUES (?, "pending", "cod", ?, ?, ?, ?, "Morning (8AM-12PM)", ?)',
      [od.customer_id, deliveryFee, od.zone_id, od.address, od.phone, itemTotal + Number(deliveryFee)]
    );

    // Add order items
    await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, 1, 3, 25.00)',
      [result.insertId]
    );
  }
  console.log('📋 Orders seeded');

  await connection.end();
  console.log('\n🎉 Database seeding complete!');
  console.log('\n📝 Test accounts:');
  console.log('   Admin:    admin@jzwaters.com / password123');
  console.log('   Refiller: refiller@jzwaters.com / password123');
  console.log('   Delivery: delivery1@jzwaters.com / password123');
  console.log('   Customer: juan@email.com / password123');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
