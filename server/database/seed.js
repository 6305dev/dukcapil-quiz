require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('Running schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);

    const dbName = process.env.DB_NAME || 'quiz_app';
    await connection.query(`USE \`${dbName}\``);

    // 1. Seed default Admin & sample Peserta
    const adminPassword = await bcrypt.hash('admin1234', 10);
    const pesertaPassword = await bcrypt.hash('peserta123', 10);

    await connection.query(
      `INSERT IGNORE INTO users (nik, nama, no_whatsapp, password, role) VALUES
       ('0000000000000001', 'Administrator Dukcapil', '081234567890', ?, 'admin'),
       ('3201010101950001', 'Budi Santoso', '081298765432', ?, 'peserta'),
       ('3201010202960002', 'Siti Aminah', '085612345678', ?, 'peserta')`,
      [adminPassword, pesertaPassword, pesertaPassword]
    );

    // 2. Seed sample Quiz if none exist
    const [existingQuizzes] = await connection.query('SELECT id FROM quizzes LIMIT 1');
    if (existingQuizzes.length === 0) {
      const [quizResult] = await connection.query(
        `INSERT INTO quizzes (judul, deskripsi, durasi_detik, jumlah_soal, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [
          'Evaluasi Layanan Administrasi Kependudukan (Dukcapil)',
          'Kuis evaluasi pemahaman masyarakat dan petugas mengenai prosedur layanan KTP-el, Kartu Keluarga, Akta Kelahiran, dan Identitas Kependudukan Digital (IKD).',
          300,
          5,
          true
        ]
      );

      const quizId = quizResult.insertId;

      const sampleQuestions = [
        [
          quizId,
          'Berapa digit jumlah angka pada Nomor Induk Kependudukan (NIK) di Indonesia?',
          '12 digit',
          '14 digit',
          '16 digit',
          '18 digit',
          'C'
        ],
        [
          quizId,
          'Aplikasi resmi dari Ditjen Dukcapil Kemendagri untuk menyimpan KTP-el dalam bentuk digital di smartphone disebut?',
          'SIPEDULI',
          'Identitas Kependudukan Digital (IKD)',
          'e-Kependudukan',
          'Dukcapil Mobile Pro',
          'B'
        ],
        [
          quizId,
          'Berapa biaya pengurusan dokumen kependudukan (KTP-el, KK, Akta Kelahiran) di Dinas Dukcapil?',
          'Rp 25.000',
          'Rp 50.000',
          'Gratis (Rp 0)',
          'Tergantung wilayah',
          'C'
        ],
        [
          quizId,
          'Berapa usia minimal Warga Negara Indonesia untuk wajib memiliki KTP-el?',
          '15 tahun',
          '16 tahun',
          '17 tahun atau sudah menikah',
          '18 tahun',
          'C'
        ],
        [
          quizId,
          'Dokumen kependudukan yang mencatat susunan, hubungan, dan jumlah anggota keluarga disebut?',
          'Akta Kelahiran',
          'Kartu Keluarga (KK)',
          'Surat Keterangan Pindah',
          'Kartu Identitas Anak (KIA)',
          'B'
        ],
        [
          quizId,
          'Apa kepanjangan dari KIA dalam layanan Administrasi Kependudukan?',
          'Kartu Izin Akses',
          'Kartu Identitas Anak',
          'Kartu Induk Administrasi',
          'Kartu Informasi Akta',
          'B'
        ],
        [
          quizId,
          'Kertas jenis apa yang kini digunakan untuk mencetak Kartu Keluarga dan Akta Kelahiran agar dapat dicetak mandiri?',
          'Kertas Security Printing khusus',
          'Kertas HVS A4 80 gram warna putih',
          'Kertas Karton Folio',
          'Kertas Glossy Foto',
          'B'
        ],
        [
          quizId,
          'Bagaimana cara memverifikasi keaslian dokumen kependudukan yang telah menggunakan Tanda Tangan Elektronik (TTE)?',
          'Melihat stempel basah dari kepala dinas',
          'Memindai QR Code yang tertera pada dokumen',
          'Meminta fotokopi legalisir kelurahan',
          'Mengecek hologram fisik pada kertas',
          'B'
        ],
        [
          quizId,
          'Surat keterangan yang diterbitkan Dukcapil saat penduduk pindah domisili antar kabupaten/kota adalah?',
          'SKPWNI',
          'SKCK',
          'SIUP',
          'NIB',
          'A'
        ],
        [
          quizId,
          'Berapa masa berlaku KTP-el bagi Warga Negara Indonesia (WNI)?',
          '5 tahun',
          '10 tahun',
          'Seumur hidup',
          '20 tahun',
          'C'
        ]
      ];

      await connection.query(
        `INSERT INTO questions (quiz_id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar)
         VALUES ?`,
        [sampleQuestions]
      );

      console.log(`Seeded 1 quiz (id=${quizId}) with ${sampleQuestions.length} questions.`);
    } else {
      console.log('Quizzes already exist, skipping sample quiz seed.');
    }

    // 3. Seed sample Doorprize Prizes if none exist
    const [existingPrizes] = await connection.query('SELECT id FROM doorprize_prizes LIMIT 1');
    if (existingPrizes.length === 0) {
      const samplePrizes = [
        ['Tumbler Eksklusif', '#FFD84D', null, 1, true],
        ['Payung Lipat Dukcapil', '#93C5FD', null, 2, true],
        ['Voucher Belanja 100K', '#A3F7BF', 5, 3, true],
        ['Mug Cantik', '#FF9F68', null, 4, true],
        ['Goodie Bag Spesial', '#C4B5FD', null, 5, true],
        ['Grand Prize Headset', '#FF6B6B', 2, 6, true],
        ['Gantungan Kunci', '#FDE68A', null, 7, true],
        ['Kaos Eksklusif', '#67E8F9', 10, 8, true]
      ];
      await connection.query(
        `INSERT INTO doorprize_prizes (nama, warna, stok, urutan, is_active) VALUES ?`,
        [samplePrizes]
      );
      console.log(`Seeded ${samplePrizes.length} doorprize prizes.`);
    }

    console.log('Seeding completed successfully!');
    console.log('Default Admin  -> NIK: 0000000000000001 | Password: admin1234');
    console.log('Sample Peserta -> NIK: 3201010101950001 | Password: peserta123');
  } finally {
    await connection.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
