require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security & CORS
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin tidak diizinkan oleh CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', quizRoutes);
app.use('/api/attempt', attemptRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.message === 'Origin tidak diizinkan oleh CORS') {
    return res.status(403).json({ message: err.message });
  }
  return res.status(500).json({ message: 'Terjadi kesalahan internal server.' });
});

module.exports = app;
