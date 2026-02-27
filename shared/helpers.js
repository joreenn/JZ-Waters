/**
 * Shared validation helpers
 */

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const isValidPhone = (phone) => {
  const re = /^(09|\+639)\d{9}$/;
  return re.test(phone);
};

const isStrongPassword = (password) => {
  return password && password.length >= 8;
};

const formatCurrency = (amount) => {
  return `₱${Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  formatCurrency,
  formatDate,
  formatDateTime,
};
