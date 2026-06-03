// src/server.js
// ─────────────────────────────────────────────────────────────
//  MarineOS — Express server
//  Entry point: node src/server.js  (or npm run dev)
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const requestLogger = require('./middleware/requestLogger');
const errorHandler  = require('./middleware/errorHandler');
const routes        = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────
// Allows the HTML frontend (opened directly or via live-server)
// to call this API without browser CORS errors.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin))
      return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logging ─────────────────────────────────────────
app.use(requestLogger);

// ── API routes ───────────────────────────────────────────────
app.use('/api', routes);

// ── Root ping ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'MarineOS API is running', version: '1.0.0' });
});

// ── 404 catch-all ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Error handler (must be last) ─────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚓  MarineOS backend running on http://localhost:${PORT}`);
  console.log(`   API base: http://localhost:${PORT}/api`);
  console.log(`   Health:   http://localhost:${PORT}/api/dashboard/health\n`);
});

module.exports = app;
