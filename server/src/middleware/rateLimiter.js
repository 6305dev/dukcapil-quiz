const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5, // 5x per menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 1 menit.'
  }
});

module.exports = { loginLimiter };
