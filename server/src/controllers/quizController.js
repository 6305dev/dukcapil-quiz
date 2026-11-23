const db = require('../config/db');

async function getActiveQuizzes(req, res) {
  try {
    const [quizzes] = await db.query(
      `SELECT q.id, q.judul, q.deskripsi, q.durasi_detik, q.jumlah_soal, q.is_active, q.created_at,
              COUNT(qs.id) AS total_bank_soal
       FROM quizzes q
       LEFT JOIN questions qs ON qs.quiz_id = q.id
       WHERE q.is_active = TRUE
       GROUP BY q.id
       ORDER BY q.created_at DESC`
    );

    // Ambil attempt terakhir user untuk setiap quiz
    const [attempts] = await db.query(
      `SELECT id, quiz_id, started_at, finished_at, score, status
       FROM quiz_attempts
       WHERE user_id = ?
       ORDER BY started_at DESC`,
      [req.user.id]
    );

    const attemptsByQuiz = {};
    for (const att of attempts) {
      if (!attemptsByQuiz[att.quiz_id]) {
        attemptsByQuiz[att.quiz_id] = att;
      }
    }

    const data = quizzes.map((q) => ({
      ...q,
      latest_attempt: attemptsByQuiz[q.id] || null
    }));

    return res.json({ quizzes: data });
  } catch (err) {
    console.error('getActiveQuizzes error:', err);
    return res.status(500).json({ message: 'Gagal memuat daftar quiz aktif.' });
  }
}

async function getMyAttempts(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.quiz_id, q.judul AS quiz_judul, q.durasi_detik, q.jumlah_soal,
              a.started_at, a.finished_at, a.score, a.status,
              CASE
                WHEN a.finished_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, a.started_at, a.finished_at)
                ELSE NULL
              END AS durasi_pengerjaan
       FROM quiz_attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       WHERE a.user_id = ?
       ORDER BY a.started_at DESC`,
      [req.user.id]
    );

    return res.json({ attempts: rows });
  } catch (err) {
    console.error('getMyAttempts error:', err);
    return res.status(500).json({ message: 'Gagal memuat riwayat pengerjaan.' });
  }
}

async function getRanking(req, res) {
  try {
    const quizId = req.query.quiz_id ? Number(req.query.quiz_id) : null;

    let whereClause = "WHERE a.status IN ('finished', 'expired') AND u.role = 'peserta'";
    const params = [];
    if (quizId) {
      whereClause += ' AND a.quiz_id = ?';
      params.push(quizId);
    }

    const [rows] = await db.query(
      `SELECT u.id AS user_id, u.nik, u.nama,
              MAX(a.score) AS skor_tertinggi,
              MIN(TIMESTAMPDIFF(SECOND, a.started_at, COALESCE(a.finished_at, NOW()))) AS waktu_tercepat,
              MAX(a.finished_at) AS attempt_terbaru,
              COUNT(a.id) AS total_attempt
       FROM users u
       JOIN quiz_attempts a ON a.user_id = u.id
       ${whereClause}
       GROUP BY u.id, u.nik, u.nama
       ORDER BY skor_tertinggi DESC, waktu_tercepat ASC, attempt_terbaru DESC`,
      params
    );

    const ranking = rows.map((row, idx) => ({
      rank: idx + 1,
      ...row
    }));

    return res.json({ ranking });
  } catch (err) {
    console.error('getRanking error:', err);
    return res.status(500).json({ message: 'Gagal memuat data ranking.' });
  }
}

module.exports = {
  getActiveQuizzes,
  getMyAttempts,
  getRanking
};
