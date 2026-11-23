const { verifyToken } = require('../utils/jwt');
const db = require('../config/db');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token autentikasi tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const [rows] = await db.query(
      'SELECT id, nik, nama, no_whatsapp, role, created_at FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Pengguna tidak ditemukan atau telah dihapus.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Sesi login telah berakhir. Silakan login kembali.' });
    }
    return res.status(401).json({ message: 'Token tidak valid.' });
  }
}

module.exports = authenticate;
