// src/middleware/requestLogger.js
// Simple console logger — replace with a library like Morgan in production.

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // red / green
    console.log(
      `${color}[${res.statusCode}]\x1b[0m ${req.method} ${req.originalUrl} — ${ms}ms`
    );
  });
  next();
}

module.exports = requestLogger;
