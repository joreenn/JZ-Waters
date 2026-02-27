/**
 * Error handling middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with that information already exists.' });
  }

  // MySQL foreign key constraint
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, errors: err.errors });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
};

// 404 handler
const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
