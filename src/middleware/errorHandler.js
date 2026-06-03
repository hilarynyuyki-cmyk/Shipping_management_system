// src/middleware/errorHandler.js
// ─────────────────────────────────────────────────────────────
//  Central error handler — mounted last in server.js.
//  Catches anything passed to next(err) in controllers.
// ─────────────────────────────────────────────────────────────

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err.message);

  // PostgreSQL error codes
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint failed — referenced record does not exist',
      detail: err.detail,
    });
  }
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value — a record with that unique field already exists',
      detail: err.detail,
    });
  }
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Check constraint violated — value out of allowed range',
      detail: err.detail,
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
