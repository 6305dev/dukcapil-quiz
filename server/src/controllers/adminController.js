const bcrypt = require('bcryptjs');
const db = require('../config/db');
const {
  sanitizeString,
  validateNik,
  validateWhatsapp,
  validateNama,
  validatePassword,
  validateOption
} = require('../utils/validator');

// ==================== DASHBOARD ====================
async function getDashboard(req, res) {
  try {
    const [[userStats]] = await db.query(
      "SELECT COUNT(*) AS total_peserta FROM users WHERE role = 'peserta'"
    );
    const [[quizStats]] = await db.query(
      'SELECT COUNT(*) AS total_quiz, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_quiz FROM quizzes'
    );
    const [[attemptStats]] = await db.query(
      `SELECT COUNT(*) AS total_attempt,
              ROUND(COALESCE(AVG(CASE WHEN status IN ('finished','expired') THEN score END), 0), 1) AS avg_score
       FROM quiz_attempts`
    );

    const [recentAttempts] = await db.query(
      `SELECT a.id, a.score, a.status, a.started_at, a.finished_at,
              u.nik, u.nama AS user_nama, q.judul AS quiz_judul
       FROM quiz_attempts a
       JOIN users u ON u.id = a.user_id
       JOIN quizzes q ON q.id = a.quiz_id
       ORDER BY a.started_at DESC
       LIMIT 8`
    );

    return res.json({
      stats: {
        total_peserta: Number(userStats.total_peserta || 0),
        total_quiz: Number(quizStats.total_quiz || 0),
        active_quiz: Number(quizStats.active_quiz || 0),
        total_attempt: Number(attemptStats.total_attempt || 0),
        avg_score: Number(attemptStats.avg_score || 0)
      },
      recent_attempts: recentAttempts
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    return res.status(500).json({ message: 'Gagal memuat statistik dashboard.' });
  }
}

// ==================== USERS CRUD ====================
async function getUsers(req, res) {
  try {
    const search = sanitizeString(req.query.search || '');
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 10)));
    const offset = (page - 1) * limit;
    const role = req.query.role && ['peserta', 'admin'].includes(req.query.role) ? req.query.role : null;

    const conditions = [];
    const params = [];

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    if (search) {
      conditions.push('(nik LIKE ? OR nama LIKE ? OR no_whatsapp LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countRow]] = await db.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
    const [users] = await db.query(
      `SELECT id, nik, nama, no_whatsapp, role, created_at, updated_at
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      users,
      pagination: {
        total: Number(countRow.total || 0),
        page,
        limit,
        total_pages: Math.ceil(Number(countRow.total || 0) / limit)
      }
    });
  } catch (err) {
    console.error('getUsers error:', err);
    return res.status(500).json({ message: 'Gagal memuat daftar pengguna.' });
  }
}

async function createUser(req, res) {
  try {
    const { nik, nama, no_whatsapp, password, role } = req.body;
    const cleanNik = sanitizeString(nik);
    const cleanNama = sanitizeString(nama);
    const cleanWa = sanitizeString(no_whatsapp);
    const cleanRole = role === 'admin' ? 'admin' : 'peserta';

    if (!validateNik(cleanNik)) {
      return res.status(400).json({ message: 'NIK harus terdiri dari 16 digit angka.' });
    }
    if (!validateNama(cleanNama)) {
      return res.status(400).json({ message: 'Nama minimal 3 karakter.' });
    }
    if (!validateWhatsapp(cleanWa)) {
      return res.status(400).json({ message: 'Format nomor WhatsApp tidak valid (08xxxxxxxx).' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password minimal 8 karakter.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE nik = ?', [cleanNik]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'NIK sudah terdaftar.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (nik, nama, no_whatsapp, password, role) VALUES (?, ?, ?, ?, ?)',
      [cleanNik, cleanNama, cleanWa, hashed, cleanRole]
    );

    return res.status(201).json({
      message: 'Pengguna berhasil ditambahkan.',
      user: {
        id: result.insertId,
        nik: cleanNik,
        nama: cleanNama,
        no_whatsapp: cleanWa,
        role: cleanRole
      }
    });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ message: 'Gagal menambahkan pengguna.' });
  }
}

async function updateUser(req, res) {
  try {
    const userId = Number(req.params.id);
    const { nik, nama, no_whatsapp, password, role } = req.body;

    const [existingRows] = await db.query('SELECT id, nik FROM users WHERE id = ?', [userId]);
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    const cleanNik = sanitizeString(nik);
    const cleanNama = sanitizeString(nama);
    const cleanWa = sanitizeString(no_whatsapp);
    const cleanRole = role === 'admin' ? 'admin' : 'peserta';

    if (!validateNik(cleanNik)) {
      return res.status(400).json({ message: 'NIK harus terdiri dari 16 digit angka.' });
    }
    if (!validateNama(cleanNama)) {
      return res.status(400).json({ message: 'Nama minimal 3 karakter.' });
    }
    if (!validateWhatsapp(cleanWa)) {
      return res.status(400).json({ message: 'Format nomor WhatsApp tidak valid (08xxxxxxxx).' });
    }

    const [dup] = await db.query('SELECT id FROM users WHERE nik = ? AND id != ?', [cleanNik, userId]);
    if (dup.length > 0) {
      return res.status(409).json({ message: 'NIK sudah digunakan oleh pengguna lain.' });
    }

    if (password && password.trim().length > 0) {
      if (!validatePassword(password)) {
        return res.status(400).json({ message: 'Password baru minimal 8 karakter.' });
      }
      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET nik = ?, nama = ?, no_whatsapp = ?, role = ?, password = ? WHERE id = ?',
        [cleanNik, cleanNama, cleanWa, cleanRole, hashed, userId]
      );
    } else {
      await db.query(
        'UPDATE users SET nik = ?, nama = ?, no_whatsapp = ?, role = ? WHERE id = ?',
        [cleanNik, cleanNama, cleanWa, cleanRole, userId]
      );
    }

    return res.json({ message: 'Data pengguna berhasil diperbarui.' });
  } catch (err) {
    console.error('updateUser error:', err);
    return res.status(500).json({ message: 'Gagal memperbarui pengguna.' });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = Number(req.params.id);
    if (userId === Number(req.user.id)) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun admin yang sedang login.' });
    }

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    return res.json({ message: 'Pengguna berhasil dihapus.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ message: 'Gagal menghapus pengguna.' });
  }
}

// ==================== QUIZZES CRUD ====================
async function getQuizzes(req, res) {
  try {
    const [quizzes] = await db.query(
      `SELECT q.id, q.judul, q.deskripsi, q.durasi_detik, q.jumlah_soal, q.is_active, q.created_at, q.updated_at,
              COUNT(DISTINCT qs.id) AS total_soal,
              COUNT(DISTINCT a.id) AS total_attempt
       FROM quizzes q
       LEFT JOIN questions qs ON qs.quiz_id = q.id
       LEFT JOIN quiz_attempts a ON a.quiz_id = q.id
       GROUP BY q.id
       ORDER BY q.created_at DESC`
    );

    return res.json({ quizzes });
  } catch (err) {
    console.error('getQuizzes error:', err);
    return res.status(500).json({ message: 'Gagal memuat daftar quiz.' });
  }
}

async function createQuiz(req, res) {
  try {
    const { judul, deskripsi, durasi_detik, jumlah_soal, is_active } = req.body;
    const cleanJudul = sanitizeString(judul);
    const cleanDeskripsi = sanitizeString(deskripsi || '');
    const durasi = Number(durasi_detik || 300);
    const jumlah = Number(jumlah_soal || 5);
    const active = is_active === undefined ? true : Boolean(is_active);

    if (cleanJudul.length < 3) {
      return res.status(400).json({ message: 'Judul quiz minimal 3 karakter.' });
    }
    if (durasi < 30) {
      return res.status(400).json({ message: 'Durasi minimal 30 detik.' });
    }
    if (jumlah < 1) {
      return res.status(400).json({ message: 'Jumlah soal minimal 1.' });
    }

    const [result] = await db.query(
      'INSERT INTO quizzes (judul, deskripsi, durasi_detik, jumlah_soal, is_active) VALUES (?, ?, ?, ?, ?)',
      [cleanJudul, cleanDeskripsi, durasi, jumlah, active]
    );

    return res.status(201).json({
      message: 'Quiz berhasil dibuat.',
      quiz: {
        id: result.insertId,
        judul: cleanJudul,
        deskripsi: cleanDeskripsi,
        durasi_detik: durasi,
        jumlah_soal: jumlah,
        is_active: active
      }
    });
  } catch (err) {
    console.error('createQuiz error:', err);
    return res.status(500).json({ message: 'Gagal membuat quiz.' });
  }
}

async function updateQuiz(req, res) {
  try {
    const quizId = Number(req.params.id);
    const { judul, deskripsi, durasi_detik, jumlah_soal, is_active } = req.body;

    const cleanJudul = sanitizeString(judul);
    const cleanDeskripsi = sanitizeString(deskripsi || '');
    const durasi = Number(durasi_detik || 300);
    const jumlah = Number(jumlah_soal || 5);
    const active = Boolean(is_active);

    if (cleanJudul.length < 3) {
      return res.status(400).json({ message: 'Judul quiz minimal 3 karakter.' });
    }

    const [result] = await db.query(
      'UPDATE quizzes SET judul = ?, deskripsi = ?, durasi_detik = ?, jumlah_soal = ?, is_active = ? WHERE id = ?',
      [cleanJudul, cleanDeskripsi, durasi, jumlah, active, quizId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan.' });
    }

    return res.json({ message: 'Quiz berhasil diperbarui.' });
  } catch (err) {
    console.error('updateQuiz error:', err);
    return res.status(500).json({ message: 'Gagal memperbarui quiz.' });
  }
}

async function deleteQuiz(req, res) {
  try {
    const quizId = Number(req.params.id);
    const [result] = await db.query('DELETE FROM quizzes WHERE id = ?', [quizId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Quiz tidak ditemukan.' });
    }
    return res.json({ message: 'Quiz berhasil dihapus.' });
  } catch (err) {
    console.error('deleteQuiz error:', err);
    return res.status(500).json({ message: 'Gagal menghapus quiz.' });
  }
}

// ==================== QUESTIONS CRUD ====================
async function getQuestions(req, res) {
  try {
    const quizId = req.query.quiz_id ? Number(req.query.quiz_id) : null;
    const where = quizId ? 'WHERE qs.quiz_id = ?' : '';
    const params = quizId ? [quizId] : [];

    const [questions] = await db.query(
      `SELECT qs.id, qs.quiz_id, q.judul AS quiz_judul,
              qs.pertanyaan, qs.opsi_a, qs.opsi_b, qs.opsi_c, qs.opsi_d,
              qs.jawaban_benar, qs.created_at, qs.updated_at
       FROM questions qs
       JOIN quizzes q ON q.id = qs.quiz_id
       ${where}
       ORDER BY qs.id DESC`,
      params
    );

    return res.json({ questions });
  } catch (err) {
    console.error('getQuestions error:', err);
    return res.status(500).json({ message: 'Gagal memuat daftar soal.' });
  }
}

async function createQuestion(req, res) {
  try {
    const { quiz_id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar } = req.body;

    if (!quiz_id) {
      return res.status(400).json({ message: 'Quiz wajib dipilih.' });
    }

    const cleanPertanyaan = sanitizeString(pertanyaan);
    const cleanA = sanitizeString(opsi_a);
    const cleanB = sanitizeString(opsi_b);
    const cleanC = sanitizeString(opsi_c);
    const cleanD = sanitizeString(opsi_d);

    if (!cleanPertanyaan || !cleanA || !cleanB || !cleanC || !cleanD) {
      return res.status(400).json({ message: 'Pertanyaan dan seluruh opsi (A, B, C, D) wajib diisi.' });
    }

    if (!validateOption(jawaban_benar)) {
      return res.status(400).json({ message: 'Jawaban benar harus A, B, C, atau D.' });
    }

    const [result] = await db.query(
      `INSERT INTO questions (quiz_id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [Number(quiz_id), cleanPertanyaan, cleanA, cleanB, cleanC, cleanD, jawaban_benar.toUpperCase()]
    );

    return res.status(201).json({
      message: 'Soal berhasil ditambahkan.',
      question: {
        id: result.insertId,
        quiz_id: Number(quiz_id),
        pertanyaan: cleanPertanyaan,
        opsi_a: cleanA,
        opsi_b: cleanB,
        opsi_c: cleanC,
        opsi_d: cleanD,
        jawaban_benar: jawaban_benar.toUpperCase()
      }
    });
  } catch (err) {
    console.error('createQuestion error:', err);
    return res.status(500).json({ message: 'Gagal menambahkan soal.' });
  }
}

async function updateQuestion(req, res) {
  try {
    const questionId = Number(req.params.id);
    const { quiz_id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar } = req.body;

    const cleanPertanyaan = sanitizeString(pertanyaan);
    const cleanA = sanitizeString(opsi_a);
    const cleanB = sanitizeString(opsi_b);
    const cleanC = sanitizeString(opsi_c);
    const cleanD = sanitizeString(opsi_d);

    if (!quiz_id || !cleanPertanyaan || !cleanA || !cleanB || !cleanC || !cleanD) {
      return res.status(400).json({ message: 'Semua field soal wajib diisi.' });
    }
    if (!validateOption(jawaban_benar)) {
      return res.status(400).json({ message: 'Jawaban benar harus A, B, C, atau D.' });
    }

    const [result] = await db.query(
      `UPDATE questions
       SET quiz_id = ?, pertanyaan = ?, opsi_a = ?, opsi_b = ?, opsi_c = ?, opsi_d = ?, jawaban_benar = ?
       WHERE id = ?`,
      [Number(quiz_id), cleanPertanyaan, cleanA, cleanB, cleanC, cleanD, jawaban_benar.toUpperCase(), questionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Soal tidak ditemukan.' });
    }

    return res.json({ message: 'Soal berhasil diperbarui.' });
  } catch (err) {
    console.error('updateQuestion error:', err);
    return res.status(500).json({ message: 'Gagal memperbarui soal.' });
  }
}

async function deleteQuestion(req, res) {
  try {
    const questionId = Number(req.params.id);
    const [result] = await db.query('DELETE FROM questions WHERE id = ?', [questionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Soal tidak ditemukan.' });
    }
    return res.json({ message: 'Soal berhasil dihapus.' });
  } catch (err) {
    console.error('deleteQuestion error:', err);
    return res.status(500).json({ message: 'Gagal menghapus soal.' });
  }
}

// ==================== SCORES & RANKING ====================
async function getScores(req, res) {
  try {
    const quizId = req.query.quiz_id ? Number(req.query.quiz_id) : null;
    const search = sanitizeString(req.query.search || '');

    const conditions = [];
    const params = [];

    if (quizId) {
      conditions.push('a.quiz_id = ?');
      params.push(quizId);
    }
    if (search) {
      conditions.push('(u.nik LIKE ? OR u.nama LIKE ? OR q.judul LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [scores] = await db.query(
      `SELECT a.id AS attempt_id, a.score, a.status, a.started_at, a.finished_at,
              TIMESTAMPDIFF(SECOND, a.started_at, COALESCE(a.finished_at, NOW())) AS durasi_pengerjaan,
              u.id AS user_id, u.nik, u.nama AS user_nama, u.no_whatsapp,
              q.id AS quiz_id, q.judul AS quiz_judul
       FROM quiz_attempts a
       JOIN users u ON u.id = a.user_id
       JOIN quizzes q ON q.id = a.quiz_id
       ${where}
       ORDER BY a.started_at DESC`,
      params
    );

    return res.json({ scores });
  } catch (err) {
    console.error('getScores error:', err);
    return res.status(500).json({ message: 'Gagal memuat data skor.' });
  }
}

async function getAdminRanking(req, res) {
  try {
    const quizId = req.query.quiz_id ? Number(req.query.quiz_id) : null;

    let whereClause = "WHERE a.status IN ('finished', 'expired') AND u.role = 'peserta'";
    const params = [];
    if (quizId) {
      whereClause += ' AND a.quiz_id = ?';
      params.push(quizId);
    }

    const [rows] = await db.query(
      `SELECT u.id AS user_id, u.nik, u.nama, u.no_whatsapp,
              MAX(a.score) AS skor_tertinggi,
              MIN(TIMESTAMPDIFF(SECOND, a.started_at, COALESCE(a.finished_at, NOW()))) AS waktu_tercepat,
              MAX(a.finished_at) AS attempt_terbaru,
              COUNT(a.id) AS total_attempt
       FROM users u
       JOIN quiz_attempts a ON a.user_id = u.id
       ${whereClause}
       GROUP BY u.id, u.nik, u.nama, u.no_whatsapp
       ORDER BY skor_tertinggi DESC, waktu_tercepat ASC, attempt_terbaru DESC`,
      params
    );

    const ranking = rows.map((row, idx) => ({
      rank: idx + 1,
      ...row
    }));

    return res.json({ ranking });
  } catch (err) {
    console.error('getAdminRanking error:', err);
    return res.status(500).json({ message: 'Gagal memuat ranking.' });
  }
}

module.exports = {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getScores,
  getAdminRanking
};
