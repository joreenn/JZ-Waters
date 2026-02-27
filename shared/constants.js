/**
 * Shared constants used across client and server
 */

// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  REFILLER: 'refiller',
  DELIVERY: 'delivery',
  CUSTOMER: 'customer',
};

// Order statuses
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Payment methods
const PAYMENT_METHODS = {
  COD: 'cod',
  GCASH: 'gcash',
  ONLINE: 'online',
};

// Payment statuses
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Delivery assignment statuses
const DELIVERY_STATUS = {
  ASSIGNED: 'assigned',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Product categories
const PRODUCT_CATEGORIES = {
  WATER_GALLON: 'water_gallon',
  WATER_BOTTLE: 'water_bottle',
  CONTAINER: 'container',
  ACCESSORY: 'accessory',
  OTHER: 'other',
};

// Product units
const PRODUCT_UNITS = {
  GALLON: 'gallon',
  BOTTLE: 'bottle',
  PIECE: 'piece',
  LITER: 'liter',
};

// Notification types
const NOTIFICATION_TYPES = {
  ORDER_PLACED: 'order_placed',
  ORDER_CONFIRMED: 'order_confirmed',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  LOW_STOCK: 'low_stock',
  NEW_ORDER: 'new_order',
  POINTS_EARNED: 'points_earned',
  POINTS_REDEEMED: 'points_redeemed',
};

// Subscription frequencies
const SUBSCRIPTION_FREQUENCIES = [
  { label: 'Daily', days: 1 },
  { label: 'Every 2 Days', days: 2 },
  { label: 'Every 3 Days', days: 3 },
  { label: 'Weekly', days: 7 },
  { label: 'Every 2 Weeks', days: 14 },
  { label: 'Monthly', days: 30 },
];

module.exports = {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
  NOTIFICATION_TYPES,
  SUBSCRIPTION_FREQUENCIES,
};
