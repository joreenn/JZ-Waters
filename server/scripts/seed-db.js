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
    ['Barangay Uno', 20.00],
    ['Barangay Dos', 25.00],
    ['Barangay Tres', 30.00],
    ['Barangay Cuatro', 35.00],
    ['Barangay Cinco', 40.00],
    ['Downtown Area', 15.00],
    ['Uptown Area', 50.00],
  ];

  for (const z of zones) {
    await connection.query(
      'INSERT IGNORE INTO zones (name, delivery_fee) VALUES (?, ?)',
      z
    );
  }
  console.log('📍 Zones seeded');

  // Seed products
  const products = [
    ['Round Slim Gallon (5 gal)', 'Premium purified water in 5-gallon slim container', 'water_gallon', 25.00, 100, 'gallon', 10],
    ['Round Regular Gallon (5 gal)', 'Purified water in standard 5-gallon container', 'water_gallon', 25.00, 80, 'gallon', 10],
    ['1 Gallon Container', 'Purified water in 1-gallon container', 'water_gallon', 10.00, 50, 'gallon', 10],
    ['500ml Bottle (24 pack)', 'Purified water bottles - 24 pack', 'water_bottle', 120.00, 30, 'piece', 5],
    ['350ml Bottle (24 pack)', 'Purified water bottles - 24 pack', 'water_bottle', 95.00, 25, 'piece', 5],
    ['Empty Slim Container', 'Empty 5-gallon slim container', 'container', 150.00, 20, 'piece', 5],
    ['Empty Regular Container', 'Empty 5-gallon regular container', 'container', 120.00, 15, 'piece', 5],
    ['Water Dispenser - Hot & Cold', 'Floor-standing water dispenser', 'accessory', 3500.00, 5, 'piece', 2],
    ['Water Pump', 'Manual water pump for gallons', 'accessory', 150.00, 20, 'piece', 5],
  ];

  for (const p of products) {
    await connection.query(
      'INSERT IGNORE INTO products (name, description, category, price, stock_quantity, unit, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
