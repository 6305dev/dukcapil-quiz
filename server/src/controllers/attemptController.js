const db = require('../config/db');
const { validateOption } = require('../utils/validator');

async function finalizeAttempt(connection, attemptId, status, finishedAtExpr = 'NOW()') {
  const [stats] = await connection.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN is_benar = 1 THEN 1 ELSE 0 END), 0) AS benar
     FROM quiz_answers
     WHERE attempt_id = ?`,
    [attemptId]
  );

  const total = Number(stats[0]?.total || 0);
  const benar = Number(stats[0]?.benar || 0);
  const score = total > 0 ? Math.round((benar / total) * 100) : 0;

  await connection.query(
    `UPDATE quiz_attempts
     SET score = ?, status = ?, finished_at = ${finishedAtExpr}
     WHERE id = ?`,
    [score, status, attemptId]
  );

  return { score, benar, total };
}

async function startAttempt(req, res) {
  const quizId = Number(req.params.id);
  if (!quizId) {
    return res.status(400).json({ message: 'ID quiz tidak valid.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [quizzes] = await connection.query(
      'SELECT id, judul, durasi_detik, jumlah_soal, is_active FROM quizzes WHERE id = ?',
      [quizId]
    );

    if (quizzes.length === 0 || !quizzes[0].is_active) {
      await connection.rollback();
      return res.status(404).json({ message: 'Quiz tidak ditemukan atau sedang tidak aktif.' });
    }

    const quiz = quizzes[0];

    // Cek apakah peserta masih punya attempt in_progress untuk quiz ini
    const [existing] = await connection.query(
      `SELECT id, started_at,
              TIMESTAMPDIFF(SECOND, started_at, NOW()) AS elapsed_seconds
       FROM quiz_attempts
       WHERE user_id = ? AND quiz_id = ? AND status = 'in_progress'
       ORDER BY started_at DESC
       LIMIT 1`,
      [req.user.id, quizId]
    );

    if (existing.length > 0) {
      const activeAttempt = existing[0];
      const remaining = quiz.durasi_detik - Number(activeAttempt.elapsed_seconds || 0);
      if (remaining > 0) {
        await connection.commit();
        return res.json({
          message: 'Melanjutkan pengerjaan quiz yang sedang berlangsung.',
          attempt_id: activeAttempt.id,
          resumed: true
        });
      }
      // Sudah melewati batas waktu -> tandai expired
      await finalizeAttempt(
        connection,
        activeAttempt.id,
        'expired',
        `DATE_ADD(started_at, INTERVAL ${Number(quiz.durasi_detik)} SECOND)`
      );
    }

    // Ambil soal acak sesuai jumlah_soal
    const limitSoal = Math.max(1, Number(quiz.jumlah_soal || 5));
    const [questions] = await connection.query(
      'SELECT id FROM questions WHERE quiz_id = ? ORDER BY RAND() LIMIT ?',
      [quizId, limitSoal]
    );

    if (questions.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Quiz belum memiliki soal. Hubungi admin.' });
    }

    const [attemptRes] = await connection.query(
      `INSERT INTO quiz_attempts (user_id, quiz_id, started_at, status, score)
       VALUES (?, ?, NOW(), 'in_progress', 0)`,
      [req.user.id, quizId]
    );

    const attemptId = attemptRes.insertId;

    // Pre-generate quiz_answers agar soal terkunci & konsisten saat refresh
    const answerRows = questions.map((q) => [attemptId, q.id, null, false]);
    await connection.query(
      'INSERT INTO quiz_answers (attempt_id, question_id, jawaban_dipilih, is_benar) VALUES ?',
      [answerRows]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Quiz dimulai. Selamat mengerjakan!',
      attempt_id: attemptId,
      resumed: false
    });
  } catch (err) {
    await connection.rollback();
    console.error('startAttempt error:', err);
    return res.status(500).json({ message: 'Gagal memulai quiz.' });
  } finally {
    connection.release();
  }
}

async function getAttempt(req, res) {
  try {
    const attemptId = Number(req.params.id);
    if (!attemptId) {
      return res.status(400).json({ message: 'ID attempt tidak valid.' });
    }

    const [attempts] = await db.query(
      `SELECT a.id, a.user_id, a.quiz_id, a.started_at, a.finished_at, a.score, a.status,
              q.judul AS quiz_judul, q.deskripsi AS quiz_deskripsi, q.durasi_detik, q.jumlah_soal,
              TIMESTAMPDIFF(SECOND, a.started_at, NOW()) AS elapsed_seconds
       FROM quiz_attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       WHERE a.id = ? AND a.user_id = ?`,
      [attemptId, req.user.id]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ message: 'Data pengerjaan tidak ditemukan.' });
    }

    const attempt = attempts[0];
    let remainingSeconds = Math.max(0, Number(attempt.durasi_detik) - Number(attempt.elapsed_seconds || 0));

    // Auto-finalize jika waktu sudah habis saat status masih in_progress
    if (attempt.status === 'in_progress' && remainingSeconds <= 0) {
      const finalized = await finalizeAttempt(
        db,
        attempt.id,
        'expired',
        `DATE_ADD(started_at, INTERVAL ${Number(attempt.durasi_detik)} SECOND)`
      );
      attempt.status = 'expired';
      attempt.score = finalized.score;
      remainingSeconds = 0;
    }

    const [questions] = await db.query(
      `SELECT qa.id AS answer_id, qa.question_id, qa.jawaban_dipilih,
              qs.pertanyaan, qs.opsi_a, qs.opsi_b, qs.opsi_c, qs.opsi_d
       FROM quiz_answers qa
       JOIN questions qs ON qs.id = qa.question_id
       WHERE qa.attempt_id = ?
       ORDER BY qa.id ASC`,
      [attemptId]
    );

    return res.json({
      attempt: {
        id: attempt.id,
        quiz_id: attempt.quiz_id,
        quiz_judul: attempt.quiz_judul,
        quiz_deskripsi: attempt.quiz_deskripsi,
        durasi_detik: attempt.durasi_detik,
        started_at: attempt.started_at,
        finished_at: attempt.finished_at,
        status: attempt.status,
        score: attempt.score,
        remaining_seconds: remainingSeconds
      },
      questions
    });
  } catch (err) {
    console.error('getAttempt error:', err);
    return res.status(500).json({ message: 'Gagal memuat soal quiz.' });
  }
}

async function saveAnswer(req, res) {
  try {
    const attemptId = Number(req.params.id);
    const { question_id, jawaban_dipilih } = req.body;

    if (!attemptId || !question_id) {
      return res.status(400).json({ message: 'attempt_id dan question_id wajib diisi.' });
    }

    if (jawaban_dipilih !== null && !validateOption(jawaban_dipilih)) {
      return res.status(400).json({ message: 'Pilihan jawaban harus A, B, C, atau D.' });
    }

    const [attempts] = await db.query(
      `SELECT a.id, a.status, q.durasi_detik,
              TIMESTAMPDIFF(SECOND, a.started_at, NOW()) AS elapsed_seconds
       FROM quiz_attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       WHERE a.id = ? AND a.user_id = ?`,
      [attemptId, req.user.id]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ message: 'Attempt tidak ditemukan.' });
    }

    const attempt = attempts[0];
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ message: 'Quiz sudah selesai atau waktu habis.' });
    }

    if (Number(attempt.elapsed_seconds) > Number(attempt.durasi_detik)) {
      await finalizeAttempt(
        db,
        attempt.id,
        'expired',
        `DATE_ADD(started_at, INTERVAL ${Number(attempt.durasi_detik)} SECOND)`
      );
      return res.status(400).json({
        message: 'Waktu pengerjaan telah habis. Jawaban tidak dapat diubah.',
        expired: true
      });
    }

    const [answerRows] = await db.query(
      `SELECT qa.id, qs.jawaban_benar
       FROM quiz_answers qa
       JOIN questions qs ON qs.id = qa.question_id
       WHERE qa.attempt_id = ? AND qa.question_id = ?`,
      [attemptId, Number(question_id)]
    );

    if (answerRows.length === 0) {
      return res.status(404).json({ message: 'Soal tidak terdaftar pada attempt ini.' });
    }

    const pilihan = jawaban_dipilih ? jawaban_dipilih.toUpperCase() : null;
    const isBenar = pilihan !== null && pilihan === answerRows[0].jawaban_benar;

    await db.query(
      'UPDATE quiz_answers SET jawaban_dipilih = ?, is_benar = ? WHERE id = ?',
      [pilihan, isBenar, answerRows[0].id]
    );

    return res.json({
      message: 'Jawaban tersimpan.',
      question_id: Number(question_id),
      jawaban_dipilih: pilihan
    });
  } catch (err) {
    console.error('saveAnswer error:', err);
    return res.status(500).json({ message: 'Gagal menyimpan jawaban.' });
  }
}

async function submitAttempt(req, res) {
  try {
    const attemptId = Number(req.params.id);
    if (!attemptId) {
      return res.status(400).json({ message: 'ID attempt tidak valid.' });
    }

    const [attempts] = await db.query(
      `SELECT a.id, a.status, a.score, q.durasi_detik,
              TIMESTAMPDIFF(SECOND, a.started_at, NOW()) AS elapsed_seconds
       FROM quiz_attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       WHERE a.id = ? AND a.user_id = ?`,
      [attemptId, req.user.id]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ message: 'Attempt tidak ditemukan.' });
    }

    const attempt = attempts[0];
    if (attempt.status !== 'in_progress') {
      return res.json({
        message: 'Quiz sudah diselesaikan sebelumnya.',
        attempt_id: attempt.id,
        status: attempt.status,
        score: attempt.score
      });
    }

    const isPastDeadline = Number(attempt.elapsed_seconds) > Number(attempt.durasi_detik);

    if (isPastDeadline) {
      const finalized = await finalizeAttempt(
        db,
        attempt.id,
        'expired',
        `DATE_ADD(started_at, INTERVAL ${Number(attempt.durasi_detik)} SECOND)`
      );
      return res.status(400).json({
        message: 'Waktu pengerjaan telah melewati batas (deadline). Jawaban yang tersimpan otomatis dinilai.',
        expired: true,
        attempt_id: attempt.id,
        status: 'expired',
        score: finalized.score,
        correct_count: finalized.benar,
        total_questions: finalized.total
      });
    }

    const finalized = await finalizeAttempt(db, attempt.id, 'finished', 'NOW()');

    return res.json({
      message: 'Quiz berhasil diselesaikan.',
      attempt_id: attempt.id,
      status: 'finished',
      score: finalized.score,
      correct_count: finalized.benar,
      total_questions: finalized.total
    });
  } catch (err) {
    console.error('submitAttempt error:', err);
    return res.status(500).json({ message: 'Gagal mengirim jawaban quiz.' });
  }
}

async function getAttemptResult(req, res) {
  try {
    const attemptId = Number(req.params.id);
    if (!attemptId) {
      return res.status(400).json({ message: 'ID attempt tidak valid.' });
    }

    const isAdminUser = req.user.role === 'admin';
    const [attempts] = await db.query(
      `SELECT a.id, a.user_id, a.quiz_id, a.started_at, a.finished_at, a.score, a.status,
              q.judul AS quiz_judul, q.durasi_detik,
              u.nama AS user_nama, u.nik AS user_nik,
              TIMESTAMPDIFF(SECOND, a.started_at, NOW()) AS elapsed_seconds,
              TIMESTAMPDIFF(SECOND, a.started_at, COALESCE(a.finished_at, NOW())) AS durasi_pengerjaan
       FROM quiz_attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       JOIN users u ON u.id = a.user_id
       WHERE a.id = ? ${isAdminUser ? '' : 'AND a.user_id = ?'}`,
      isAdminUser ? [attemptId] : [attemptId, req.user.id]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ message: 'Hasil pengerjaan tidak ditemukan.' });
    }

    const attempt = attempts[0];

    if (attempt.status === 'in_progress') {
      if (Number(attempt.elapsed_seconds) > Number(attempt.durasi_detik)) {
        const finalized = await finalizeAttempt(
          db,
          attempt.id,
          'expired',
          `DATE_ADD(started_at, INTERVAL ${Number(attempt.durasi_detik)} SECOND)`
        );
        attempt.status = 'expired';
        attempt.score = finalized.score;
        attempt.durasi_pengerjaan = attempt.durasi_detik;
      } else {
        return res.status(400).json({ message: 'Quiz masih sedang berlangsung. Selesaikan terlebih dahulu.' });
      }
    }

    const [details] = await db.query(
      `SELECT qa.question_id, qa.jawaban_dipilih, qa.is_benar,
              qs.pertanyaan, qs.opsi_a, qs.opsi_b, qs.opsi_c, qs.opsi_d, qs.jawaban_benar
       FROM quiz_answers qa
       JOIN questions qs ON qs.id = qa.question_id
       WHERE qa.attempt_id = ?
       ORDER BY qa.id ASC`,
      [attemptId]
    );

    const totalQuestions = details.length;
    const correctCount = details.filter((d) => Boolean(d.is_benar)).length;

    // Hitung posisi ranking peserta pada quiz ini
    const [rankRows] = await db.query(
      `SELECT u.id AS user_id,
              MAX(a.score) AS skor_tertinggi,
              MIN(TIMESTAMPDIFF(SECOND, a.started_at, COALESCE(a.finished_at, NOW()))) AS waktu_tercepat,
              MAX(a.finished_at) AS attempt_terbaru
       FROM users u
       JOIN quiz_attempts a ON a.user_id = u.id
       WHERE a.status IN ('finished', 'expired') AND u.role = 'peserta' AND a.quiz_id = ?
       GROUP BY u.id
       ORDER BY skor_tertinggi DESC, waktu_tercepat ASC, attempt_terbaru DESC`,
      [attempt.quiz_id]
    );

    const rankIndex = rankRows.findIndex((r) => Number(r.user_id) === Number(attempt.user_id));

    return res.json({
      result: {
        attempt_id: attempt.id,
        quiz_id: attempt.quiz_id,
        quiz_judul: attempt.quiz_judul,
        user_nama: attempt.user_nama,
        user_nik: attempt.user_nik,
        started_at: attempt.started_at,
        finished_at: attempt.finished_at,
        status: attempt.status,
        score: attempt.score,
        correct_count: correctCount,
        wrong_count: totalQuestions - correctCount,
        total_questions: totalQuestions,
        durasi_pengerjaan: Math.min(Number(attempt.durasi_pengerjaan || 0), Number(attempt.durasi_detik)),
        durasi_detik: attempt.durasi_detik,
        ranking_position: rankIndex >= 0 ? rankIndex + 1 : null,
        total_ranked_participants: rankRows.length
      },
      answers: details
    });
  } catch (err) {
    console.error('getAttemptResult error:', err);
    return res.status(500).json({ message: 'Gagal memuat hasil quiz.' });
  }
}

module.exports = {
  startAttempt,
  getAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult
};
