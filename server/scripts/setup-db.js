/**
 * Database Setup Script
 * Creates the jzwaters database and all required tables
 * Run: node scripts/setup-db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'jzwaters';

async function setupDatabase() {
  // Connect without specifying a database first
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('🔗 Connected to MySQL server');

  // Create database
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${DB_NAME}\``);
  console.log(`📦 Database "${DB_NAME}" ready`);

  // Create tables
  const schema = `
    -- Settings table for store configuration
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'refiller', 'delivery', 'customer') NOT NULL DEFAULT 'customer',
      phone VARCHAR(20),
      address TEXT,
      points_balance INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      reset_token VARCHAR(255),
      reset_token_expires DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_role (role),
      INDEX idx_email (email)
    );

    -- Delivery zones
    CREATE TABLE IF NOT EXISTS zones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category ENUM('water_gallon', 'water_bottle', 'container', 'accessory', 'other') NOT NULL DEFAULT 'water_gallon',
      price DECIMAL(10,2) NOT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      unit VARCHAR(50) DEFAULT 'gallon',
      low_stock_threshold INT DEFAULT 10,
      image_url VARCHAR(500),
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_active (is_active)
    );

    -- Refill transactions (in-store)
    CREATE TABLE IF NOT EXISTS refill_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT NOT NULL,
      customer_name VARCHAR(255) DEFAULT 'Walk-in',
      gallons_count DECIMAL(10,2) NOT NULL,
      price_per_gallon DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE RESTRICT,
      INDEX idx_staff (staff_id),
      INDEX idx_date (created_at)
    );

    -- Orders (delivery orders)
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      status ENUM('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
      payment_method ENUM('cod', 'gcash', 'online') DEFAULT 'cod',
      payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
      delivery_fee DECIMAL(10,2) DEFAULT 0.00,
      zone_id INT,
      address TEXT NOT NULL,
      contact_phone VARCHAR(20),
      preferred_time VARCHAR(100),
      notes TEXT,
      total_amount DECIMAL(10,2) NOT NULL,
      points_earned INT DEFAULT 0,
      points_redeemed INT DEFAULT 0,
      discount_amount DECIMAL(10,2) DEFAULT 0.00,
      cancellation_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
      INDEX idx_customer (customer_id),
      INDEX idx_status (status),
      INDEX idx_date (created_at)
    );

    -- Order items
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      INDEX idx_order (order_id)
    );

    -- Delivery assignments
    CREATE TABLE IF NOT EXISTS delivery_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      delivery_staff_id INT,
      status ENUM('assigned', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'assigned',
      cancellation_reason TEXT,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (delivery_staff_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_staff (delivery_staff_id),
      INDEX idx_order (order_id),
      INDEX idx_status (status)
    );

    -- Inventory logs
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      change_quantity INT NOT NULL,
      previous_quantity INT NOT NULL DEFAULT 0,
      new_quantity INT NOT NULL DEFAULT 0,
      reason VARCHAR(255),
      reference_type VARCHAR(50),
      reference_id INT,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      INDEX idx_product (product_id),
      INDEX idx_date (created_at)
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50),
      title VARCHAR(255),
      message TEXT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      link VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_read (is_read)
    );

    -- Subscriptions (recurring delivery)
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      frequency_days INT NOT NULL DEFAULT 7,
      next_delivery_date DATE NOT NULL,
      delivery_address TEXT NOT NULL,
      zone_id INT,
      contact_phone VARCHAR(20),
      preferred_time VARCHAR(100),
      payment_method ENUM('cod', 'gcash', 'online') DEFAULT 'cod',
      notes TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
      INDEX idx_customer (customer_id),
      INDEX idx_active (is_active),
      INDEX idx_next_date (next_delivery_date)
    );

    -- Subscription items (template items for recurring orders)
    CREATE TABLE IF NOT EXISTS subscription_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subscription_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    -- Loyalty points log
    CREATE TABLE IF NOT EXISTS loyalty_points_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      points_change INT NOT NULL,
      balance_after INT NOT NULL DEFAULT 0,
      reason VARCHAR(255),
      reference_type VARCHAR(50),
      reference_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_customer (customer_id),
      INDEX idx_date (created_at)
    );
  `;

  await connection.query(schema);
  console.log('✅ All tables created successfully');

  // Insert default settings
  const defaultSettings = [
    ['store_name', process.env.STORE_NAME || 'JZ Waters'],
    ['store_address', process.env.STORE_ADDRESS || '123 Main Street'],
    ['store_phone', process.env.STORE_PHONE || '09123456789'],
    ['price_per_gallon', process.env.DEFAULT_PRICE_PER_GALLON || '25.00'],
    ['default_delivery_fee', process.env.DEFAULT_DELIVERY_FEE || '20.00'],
    ['points_per_gallon', process.env.POINTS_PER_GALLON || '1'],
    ['points_to_peso_ratio', process.env.POINTS_TO_PESO_RATIO || '0.5'],
    ['low_stock_threshold_default', '10'],
    ['stock_deduct_on', 'order_placed'],
  ];

  for (const [key, value] of defaultSettings) {
    await connection.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      [key, value]
    );
  }
  console.log('⚙️  Default settings inserted');

  await connection.end();
  console.log('\n🎉 Database setup complete!');
  process.exit(0);
}

setupDatabase().catch((err) => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
