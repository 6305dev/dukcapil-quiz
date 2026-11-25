const db = require('../config/db');
const { sanitizeString } = require('../utils/validator');

const DEFAULT_PRIZES = [
  ['Tumbler Eksklusif', '#FFD84D', null, 1, 1],
  ['Payung Lipat Dukcapil', '#93C5FD', null, 2, 1],
  ['Voucher Belanja 100K', '#A3F7BF', 5, 3, 1],
  ['Mug Cantik', '#FF9F68', null, 4, 1],
  ['Goodie Bag Spesial', '#C4B5FD', null, 5, 1],
  ['Grand Prize Headset', '#FF6B6B', 2, 6, 1],
  ['Gantungan Kunci', '#FDE68A', null, 7, 1],
  ['Kaos Eksklusif', '#67E8F9', 10, 8, 1]
];

let tableReadyPromise = null;

function ensureDoorprizeTable() {
  if (!tableReadyPromise) {
    tableReadyPromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS doorprize_prizes (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          nama VARCHAR(150) NOT NULL,
          warna VARCHAR(20) NOT NULL DEFAULT '#FFD84D',
          stok INT NULL DEFAULT NULL,
          urutan INT NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_doorprize_active_urutan (is_active, urutan)
        ) ENGINE=InnoDB
      `);

      const [existing] = await db.query('SELECT id FROM doorprize_prizes LIMIT 1');
      if (existing.length === 0) {
        await db.query(
          'INSERT INTO doorprize_prizes (nama, warna, stok, urutan, is_active) VALUES ?',
          [DEFAULT_PRIZES]
        );
      }
    })().catch((err) => {
      tableReadyPromise = null;
      throw err;
    });
  }
  return tableReadyPromise;
}

function normalizeHexColor(input) {
  const clean = sanitizeString(input || '');
  return /^#[0-9A-Fa-f]{6}$/.test(clean) ? clean.toUpperCase() : '#FFD84D';
}

function normalizeStok(stok) {
  if (stok === null || stok === undefined || stok === '') return null;
  const num = Number(stok);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

// Public: get active prizes for spinning wheel
async function getPublicPrizes(req, res) {
  try {
    await ensureDoorprizeTable();
    const [prizes] = await db.query(
      `SELECT id, nama, warna, stok, urutan
       FROM doorprize_prizes
       WHERE is_active = 1 AND (stok IS NULL OR stok > 0)
       ORDER BY urutan ASC, id ASC`
    );
    return res.json({ prizes });
  } catch (err) {
    console.error('getPublicPrizes error:', err);
    return res.status(500).json({ message: 'Gagal memuat daftar hadiah doorprize.' });
  }
}

// Public/Event: claim / decrement stock when a prize is won (optional action or auto)
async function claimPrize(req, res) {
  try {
    await ensureDoorprizeTable();
    const prizeId = Number(req.params.id);
    const [rows] = await db.query(
      'SELECT id, nama, stok, is_active FROM doorprize_prizes WHERE id = ?',
      [prizeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Hadiah tidak ditemukan.' });
    }

    const prize = rows[0];
    if (prize.stok !== null) {
      if (prize.stok <= 0) {
        return res.status(400).json({ message: 'Stok hadiah ini sudah habis.' });
      }
      await db.query(
        'UPDATE doorprize_prizes SET stok = GREATEST(stok - 1, 0) WHERE id = ?',
        [prizeId]
      );
    }

    const [[updated]] = await db.query(
      'SELECT id, nama, warna, stok, urutan, is_active FROM doorprize_prizes WHERE id = ?',
      [prizeId]
    );

    return res.json({ message: 'Stok hadiah diperbarui.', prize: updated });
  } catch (err) {
    console.error('claimPrize error:', err);
    return res.status(500).json({ message: 'Gagal memperbarui stok hadiah.' });
  }
}

// Admin: list all prizes
async function getAdminPrizes(req, res) {
  try {
    await ensureDoorprizeTable();
    const [prizes] = await db.query(
      `SELECT id, nama, warna, stok, urutan, is_active, created_at, updated_at
       FROM doorprize_prizes
       ORDER BY urutan ASC, id ASC`
    );
    return res.json({ prizes });
  } catch (err) {
    console.error('getAdminPrizes error:', err);
    return res.status(500).json({ message: 'Gagal memuat daftar hadiah doorprize.' });
  }
}

// Admin: create prize
async function createPrize(req, res) {
  try {
    await ensureDoorprizeTable();
    const { nama, warna, stok, urutan, is_active } = req.body;
    const cleanNama = sanitizeString(nama);
    if (!cleanNama) {
      return res.status(400).json({ message: 'Nama hadiah wajib diisi.' });
    }

    const cleanWarna = normalizeHexColor(warna);
    const cleanStok = normalizeStok(stok);
    const cleanUrutan = Number.isFinite(Number(urutan)) ? Number(urutan) : 0;
    const active = is_active === undefined ? true : Boolean(is_active);

    const [result] = await db.query(
      `INSERT INTO doorprize_prizes (nama, warna, stok, urutan, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [cleanNama, cleanWarna, cleanStok, cleanUrutan, active]
    );

    return res.status(201).json({
      message: 'Hadiah doorprize berhasil ditambahkan.',
      prize: {
        id: result.insertId,
        nama: cleanNama,
        warna: cleanWarna,
        stok: cleanStok,
        urutan: cleanUrutan,
        is_active: active
      }
    });
  } catch (err) {
    console.error('createPrize error:', err);
    return res.status(500).json({ message: 'Gagal menambahkan hadiah doorprize.' });
  }
}

// Admin: update prize
async function updatePrize(req, res) {
  try {
    await ensureDoorprizeTable();
    const prizeId = Number(req.params.id);
    const { nama, warna, stok, urutan, is_active } = req.body;

    const cleanNama = sanitizeString(nama);
    if (!cleanNama) {
      return res.status(400).json({ message: 'Nama hadiah wajib diisi.' });
    }

    const cleanWarna = normalizeHexColor(warna);
    const cleanStok = normalizeStok(stok);
    const cleanUrutan = Number.isFinite(Number(urutan)) ? Number(urutan) : 0;
    const active = Boolean(is_active);

    const [result] = await db.query(
      `UPDATE doorprize_prizes
       SET nama = ?, warna = ?, stok = ?, urutan = ?, is_active = ?
       WHERE id = ?`,
      [cleanNama, cleanWarna, cleanStok, cleanUrutan, active, prizeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Hadiah tidak ditemukan.' });
    }

    return res.json({ message: 'Hadiah doorprize berhasil diperbarui.' });
  } catch (err) {
    console.error('updatePrize error:', err);
    return res.status(500).json({ message: 'Gagal memperbarui hadiah doorprize.' });
  }
}

// Admin: delete prize
async function deletePrize(req, res) {
  try {
    await ensureDoorprizeTable();
    const prizeId = Number(req.params.id);
    const [result] = await db.query('DELETE FROM doorprize_prizes WHERE id = ?', [prizeId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Hadiah tidak ditemukan.' });
    }
    return res.json({ message: 'Hadiah doorprize berhasil dihapus.' });
  } catch (err) {
    console.error('deletePrize error:', err);
    return res.status(500).json({ message: 'Gagal menghapus hadiah doorprize.' });
  }
}

module.exports = {
  ensureDoorprizeTable,
  getPublicPrizes,
  claimPrize,
  getAdminPrizes,
  createPrize,
  updatePrize,
  deletePrize
};
