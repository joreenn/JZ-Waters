/**
 * JZ Waters - Main Server Entry Point
 * Express + Socket.io server with all API routes
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const refillRoutes = require('./routes/refills');
const orderRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/deliveries');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const zoneRoutes = require('./routes/zones');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const subscriptionRoutes = require('./routes/subscriptions');
const loyaltyRoutes = require('./routes/loyalty');

// Import cron jobs
const startSubscriptionCron = require('./cron/subscriptions');

const app = express();
const server = http.createServer(app);

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`🔌 User ${socket.userId} connected (${socket.userRole})`);

  // Join user-specific room for targeted notifications
  socket.join(`user-${socket.userId}`);

  // Join role-based rooms
  socket.join(`role-${socket.userRole}`);

  // Delivery staff join delivery room
  if (socket.userRole === 'delivery') {
    socket.join('delivery-team');
  }

  // Admin room
  if (socket.userRole === 'admin') {
    socket.join('admin-room');
  }

  socket.on('disconnect', () => {
    console.log(`🔌 User ${socket.userId} disconnected`);
  });
});

// Make io accessible to routes
app.set('io', io);

// --- Express Middleware ---
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/refills', refillRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', dashboardRoutes); // uses same routes for /reports/sales, /reports/export/*
app.use('/api/zones', zoneRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error Handling ---
app.use(notFound);
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   💧 JZ Waters API Server            ║
  ║   Running on port ${PORT}               ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}        ║
  ╚═══════════════════════════════════════╝
  `);

  // Start cron jobs
  startSubscriptionCron();
});

module.exports = { app, server, io };
