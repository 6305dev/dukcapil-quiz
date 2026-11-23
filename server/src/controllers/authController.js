const db = require('../config/db');
const { signToken } = require('../utils/jwt');
const {
  sanitizeString,
  validateNik,
  validateWhatsapp,
  validateNama
} = require('../utils/validator');

async function register(req, res) {
  try {
    const { nik, nama, no_whatsapp } = req.body;

    const cleanNik = sanitizeString(nik);
    const cleanNama = sanitizeString(nama);
    const cleanPhone = sanitizeString(no_whatsapp);

    if (!validateNik(cleanNik)) {
      return res.status(400).json({ message: 'NIK harus terdiri dari tepat 16 digit angka.' });
    }
    if (!validateNama(cleanNama)) {
      return res.status(400).json({ message: 'Nama lengkap minimal 3 karakter dan maksimal 100 karakter.' });
    }
    if (!validateWhatsapp(cleanPhone)) {
      return res.status(400).json({ message: 'Nomor telepon tidak valid (contoh: 081234567890).' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE nik = ?', [cleanNik]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'NIK sudah terdaftar. Silakan login atau gunakan NIK lain.' });
    }

    const [result] = await db.query(
      'INSERT INTO users (nik, nama, no_whatsapp, password, role) VALUES (?, ?, ?, ?, ?)',
      [cleanNik, cleanNama, cleanPhone, '', 'peserta']
    );

    const user = {
      id: result.insertId,
      nik: cleanNik,
      nama: cleanNama,
      no_whatsapp: cleanPhone,
      role: 'peserta'
    };

    const token = signToken({ id: user.id, nik: user.nik, role: user.role });

    return res.status(201).json({
      message: 'Registrasi berhasil.',
      token,
      user
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
}

async function login(req, res) {
  try {
    const { nik, nama, no_whatsapp } = req.body;
    const cleanNik = sanitizeString(nik);
    const cleanNama = sanitizeString(nama);
    const cleanPhone = sanitizeString(no_whatsapp);

    if (!cleanNik || !cleanNama || !cleanPhone) {
      return res.status(400).json({ message: 'NIK, nama lengkap, dan nomor telepon wajib diisi.' });
    }

    if (!validateNik(cleanNik)) {
      return res.status(400).json({ message: 'Format NIK tidak valid (harus 16 digit angka).' });
    }
    if (!validateNama(cleanNama)) {
      return res.status(400).json({ message: 'Nama lengkap minimal 3 karakter dan maksimal 100 karakter.' });
    }
    if (!validateWhatsapp(cleanPhone)) {
      return res.status(400).json({ message: 'Format nomor telepon tidak valid (contoh: 081234567890).' });
    }

    const [rows] = await db.query(
      'SELECT id, nik, nama, no_whatsapp, role FROM users WHERE nik = ?',
      [cleanNik]
    );

    // Jika NIK sudah terdaftar -> verifikasi & otomatis login
    if (rows.length > 0) {
      const userRow = rows[0];
      const isNamaMatch = userRow.nama.trim().toLowerCase() === cleanNama.toLowerCase();
      const isPhoneMatch = userRow.no_whatsapp.trim() === cleanPhone;

      if (!isNamaMatch || !isPhoneMatch) {
        return res.status(401).json({
          message: 'NIK sudah terdaftar dengan data berbeda. Pastikan nama lengkap dan nomor telepon sesuai.'
        });
      }

      const user = {
        id: userRow.id,
        nik: userRow.nik,
        nama: userRow.nama,
        no_whatsapp: userRow.no_whatsapp,
        role: userRow.role
      };

      const token = signToken({ id: user.id, nik: user.nik, role: user.role });

      return res.json({
        message: 'Login berhasil.',
        is_new: false,
        token,
        user
      });
    }

    // Jika NIK belum terdaftar -> otomatis daftar & langsung login
    const [result] = await db.query(
      'INSERT INTO users (nik, nama, no_whatsapp, password, role) VALUES (?, ?, ?, ?, ?)',
      [cleanNik, cleanNama, cleanPhone, '', 'peserta']
    );

    const user = {
      id: result.insertId,
      nik: cleanNik,
      nama: cleanNama,
      no_whatsapp: cleanPhone,
      role: 'peserta'
    };

    const token = signToken({ id: user.id, nik: user.nik, role: user.role });

    return res.status(201).json({
      message: 'Registrasi berhasil.',
      is_new: true,
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
}

async function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  me
};
