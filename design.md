# 📋 Design Document - Web Quiz Application

## 1. Overview

Aplikasi web quiz berbasis Vue.js (frontend) dan MySQL (backend database). Peserta login menggunakan NIK, dan dapat menjawab 5 soal acak dengan batas waktu. Admin dapat mengelola peserta, quiz, melihat skor, dan ranking.

**Tujuan:** Media evaluasi/kuis online dengan sistem autentikasi sederhana berbasis NIK dan tracking skor real-time.

---

## 2. Tech Stack

| Layer        | Teknologi                   | Keterangan                                 |
| ------------ | --------------------------- | ------------------------------------------ |
| Frontend     | Vue 3 + Vite                | Composition API, Pinia (state), Vue Router |
| UI Framework | TailwindCSS / Vuetify       | Untuk styling cepat                        |
| Backend      | Node.js (Express) / Laravel | REST API                                   |
| Database     | MySQL 8.x                   | Relational DB                              |
| Auth         | JWT / Session               | Token-based                                |
| HTTP Client  | Axios                       | Di frontend                                |

> Catatan: Backend bisa menggunakan Express.js atau Laravel — pilih salah satu. Dokumen ini mengasumsikan **Express.js + mysql2**.

---

## 3. Arsitektur Sistem

```
┌─────────────────┐        HTTPS        ┌─────────────────┐       ┌──────────┐
│   Vue 3 SPA     │ ──────────────────▶ │   REST API      │ ────▶ │  MySQL   │
│ (Browser)       │ ◀────────────────── │  (Express.js)   │ ◀──── │          │
└─────────────────┘        JSON         └─────────────────┘       └──────────┘
```

- **SPA** menangani routing & UI.
- **API** menangani business logic, validasi, dan akses DB.
- **JWT** disimpan di `localStorage`/`httpOnly cookie`.

---

## 4. Database Schema

### 4.1 `users`

| Kolom       | Tipe                                      | Keterangan       |
| ----------- | ----------------------------------------- | ---------------- |
| id          | BIGINT UNSIGNED PK AI                     |                  |
| nik         | VARCHAR(16) UNIQUE                        | Login identifier |
| nama        | VARCHAR(100)                              |                  |
| no_whatsapp | VARCHAR(20)                               |                  |
| password    | VARCHAR(255)                              | Hashed (bcrypt)  |
| role        | ENUM('peserta','admin') DEFAULT 'peserta' |                  |
| created_at  | TIMESTAMP                                 |                  |
| updated_at  | TIMESTAMP                                 |                  |

### 4.2 `quizzes`

| Kolom                   | Tipe                  | Keterangan                             |
| ----------------------- | --------------------- | -------------------------------------- |
| id                      | BIGINT UNSIGNED PK AI |                                        |
| judul                   | VARCHAR(150)          | Nama quiz                              |
| deskripsi               | TEXT                  |                                        |
| durasi_detik            | INT                   | Total batas waktu (mis. 300 = 5 menit) |
| jumlah_soal             | INT DEFAULT 5         | Jumlah soal yang diambil acak          |
| is_active               | BOOLEAN DEFAULT TRUE  |                                        |
| created_at / updated_at | TIMESTAMP             |                                        |

### 4.3 `questions`

| Kolom                             | Tipe                   | Keterangan |
| --------------------------------- | ---------------------- | ---------- |
| id                                | BIGINT UNSIGNED PK AI  |            |
| quiz_id                           | BIGINT FK → quizzes.id |            |
| pertanyaan                        | TEXT                   |            |
| opsi_a / opsi_b / opsi_c / opsi_d | TEXT                   |            |
| jawaban_benar                     | ENUM('A','B','C','D')  |            |
| created_at / updated_at           | TIMESTAMP              |            |

### 4.4 `quiz_attempts`

| Kolom       | Tipe                                     | Keterangan |
| ----------- | ---------------------------------------- | ---------- |
| id          | BIGINT UNSIGNED PK AI                    |            |
| user_id     | BIGINT FK → users.id                     |            |
| quiz_id     | BIGINT FK → quizzes.id                   |            |
| started_at  | DATETIME                                 |            |
| finished_at | DATETIME NULL                            |            |
| score       | INT DEFAULT 0                            |            |
| status      | ENUM('in_progress','finished','expired') |            |

### 4.5 `quiz_answers`

| Kolom           | Tipe                         | Keterangan |
| --------------- | ---------------------------- | ---------- |
| id              | BIGINT UNSIGNED PK AI        |            |
| attempt_id      | BIGINT FK → quiz_attempts.id |            |
| question_id     | BIGINT FK → questions.id     |            |
| jawaban_dipilih | ENUM('A','B','C','D') NULL   |            |
| is_benar        | BOOLEAN DEFAULT FALSE        |            |

### 4.6 Relasi

```
users (1) ──< quiz_attempts >── (1) quizzes
quizzes (1) ──< questions
quiz_attempts (1) ──< quiz_answers >── (1) questions
```

---

## 5. API Endpoints

### Auth

| Method | Endpoint             | Deskripsi                                     |
| ------ | -------------------- | --------------------------------------------- |
| POST   | `/api/auth/register` | Registrasi (nik, nama, no_whatsapp, password) |
| POST   | `/api/auth/login`    | Login (nik + password) → JWT                  |
| GET    | `/api/auth/me`       | Ambil data user aktif                         |

### Peserta (Quiz)

| Method | Endpoint                  | Deskripsi                                           |
| ------ | ------------------------- | --------------------------------------------------- |
| GET    | `/api/quizzes/active`     | List quiz aktif                                     |
| POST   | `/api/quiz/:id/start`     | Mulai attempt (generate 5 soal acak)                |
| GET    | `/api/attempt/:id`        | Ambil soal + sisa waktu                             |
| POST   | `/api/attempt/:id/answer` | Simpan jawaban per soal                             |
| POST   | `/api/attempt/:id/submit` | Selesai & hitung skor                               |
| GET    | `/api/attempt/:id/result` | Hasil akhir                                         |
| GET    | `/api/ranking`            | Ranking peserta (by skor tertinggi, waktu tercepat) |

### Admin

| Method              | Endpoint                   | Deskripsi                                          |
| ------------------- | -------------------------- | -------------------------------------------------- |
| GET                 | `/api/admin/users`         | List peserta (search, pagination)                  |
| POST                | `/api/admin/users`         | Tambah peserta                                     |
| PUT                 | `/api/admin/users/:id`     | Update peserta                                     |
| DELETE              | `/api/admin/users/:id`     | Hapus peserta                                      |
| GET/POST/PUT/DELETE | `/api/admin/quizzes/...`   | CRUD quiz                                          |
| GET/POST/PUT/DELETE | `/api/admin/questions/...` | CRUD soal                                          |
| GET                 | `/api/admin/scores`        | Semua skor peserta                                 |
| GET                 | `/api/admin/ranking`       | Ranking keseluruhan                                |
| GET                 | `/api/admin/dashboard`     | Statistik (total peserta, total attempt, avg skor) |

**Middleware:**

- `authenticate` → validasi JWT
- `isAdmin` → cek role = 'admin'

---

## 6. Frontend Structure (Vue 3)

```
src/
├── main.js
├── App.vue
├── router/index.js
├── stores/
│   ├── auth.js          # Pinia store user & token
│   └── quiz.js
├── services/
│   └── api.js           # Axios instance + interceptor
├── layouts/
│   ├── AuthLayout.vue
│   ├── PesertaLayout.vue
│   └── AdminLayout.vue
├── views/
│   ├── auth/
│   │   ├── LoginView.vue
│   │   └── RegisterView.vue
│   ├── peserta/
│   │   ├── DashboardView.vue
│   │   ├── QuizListView.vue
│   │   ├── QuizPlayView.vue
│   │   ├── ResultView.vue
│   │   └── RankingView.vue
│   └── admin/
│       ├── DashboardView.vue
│       ├── UserManageView.vue
│       ├── QuizManageView.vue
│       ├── QuestionManageView.vue
│       ├── ScoreView.vue
│       └── RankingView.vue
└── components/
    ├── TimerCountdown.vue
    ├── QuestionCard.vue
    ├── RankingTable.vue
    └── ...
```

### Route Guards

- `/login`, `/register` → publik
- `/peserta/*` → butuh login (role peserta)
- `/admin/*` → butuh login (role admin)
- Redirect otomatis berdasarkan role setelah login.

---

## 7. Alur Aplikasi (User Flow)

### 7.1 Registrasi & Login

1. User membuka `/register`.
2. Isi **NIK (16 digit)**, **nama**, **no WhatsApp**, **password**.
3. Validasi: NIK unik, format 16 digit, no WA format `08xxxx`.
4. Login menggunakan **NIK + password**.
5. Backend mengembalikan JWT → disimpan, redirect sesuai role.

### 7.2 Peserta – Mengikuti Quiz

1. Peserta lihat daftar quiz aktif.
2. Klik **Mulai** → sistem membuat `quiz_attempt`, memilih **5 soal acak** dari bank soal quiz.
3. Timer mulai berjalan (mis. 5 menit) → countdown client-side berdasarkan `started_at` + `durasi_detik` dari server (**server-side authoritative**).
4. Peserta menjawab; jawaban bisa auto-save per soal.
5. Jika waktu habis → auto-submit; jawaban kosong dianggap salah.
6. Setelah submit → skor dihitung: `skor = (benar / 5) * 100`.
7. Tampilkan halaman hasil + posisi ranking saat ini.

### 7.3 Admin

1. Login sebagai admin → dashboard statistik.
2. Kelola peserta (CRUD).
3. Kelola quiz & soal (CRUD).
4. Lihat skor setiap peserta & ranking global.

---

## 8. Fitur Detail

### 8.1 Batas Waktu (Timer)

- Sumber kebenaran: **server** (`started_at + durasi_detik`).
- Frontend menerima `remaining_seconds` dari API saat load soal.
- Countdown di client hanya visual; API `submit` menolak jika `now > deadline`.
- Auto-submit saat countdown habis.

### 8.2 Pengambilan Soal Acak

- Server query: `SELECT * FROM questions WHERE quiz_id = ? ORDER BY RAND() LIMIT 5`.
- Soal yang disajikan **dikunci** dalam `quiz_answers` saat `attempt` dibuat (opsi A: pre-generate; opsi B: simpan saat start). **Rekomendasi: pre-generate** saat `POST /start` agar konsisten jika refresh halaman.

### 8.3 Perhitungan Skor

```
score = (jumlah_jawaban_benar / jumlah_soal) * 100
```

Dibulatkan ke integer. Disimpan di `quiz_attempts.score`.

### 8.4 Ranking

Query:

```sql
SELECT u.nik, u.nama, MAX(a.score) AS skor_tertinggi,
       MIN(TIMESTAMPDIFF(SECOND, a.started_at, a.finished_at)) AS waktu_tercepat
FROM users u
JOIN quiz_attempts a ON a.user_id = u.id
WHERE a.status = 'finished'
GROUP BY u.id
ORDER BY skor_tertinggi DESC, waktu_tercepat ASC;
```

Kriteria ranking: **skor tertinggi → waktu tercepat → attempt terbaru**.

### 8.5 Validasi Input

- NIK: 16 digit angka.
- No WA: `^08[0-9]{8,13}$`.
- Nama: minimal 3 karakter.
- Password: minimal 8 karakter, bcrypt hash.

---

## 9. Keamanan

| Aspek         | Implementasi                                                |
| ------------- | ----------------------------------------------------------- |
| Password      | bcrypt (cost 10+)                                           |
| JWT           | Expired 1 jam, refresh opsional                             |
| CORS          | Whitelist origin frontend                                   |
| Rate limit    | Login 5x/menit per IP                                       |
| SQL Injection | Prepared statements (mysql2)                                |
| XSS           | Sanitasi input di frontend + backend                        |
| Anti-cheat    | Timer server-side, one attempt per quiz per user (opsional) |
| Role          | Middleware `isAdmin`                                        |

---

## 10. Skema UI (Ringkas)

### Halaman Peserta

- **Login** → form NIK & password.
- **Register** → NIK, nama, no WA, password, konfirmasi.
- **Dashboard** → card quiz tersedia, riwayat attempt.
- **Quiz Play** → header timer, progress "Soal 3/5", card soal + 4 opsi, tombol Next/Prev, Submit.
- **Result** → skor, benar/salah per soal, posisi ranking.
- **Ranking** → tabel peserta + skor.

### Halaman Admin

- **Dashboard** → total peserta, total quiz, total attempt, rata-rata skor.
- **Kelola Peserta** → tabel + tombol tambah/edit/hapus + search.
- **Kelola Quiz** → list quiz + modal CRUD.
- **Kelola Soal** → pilih quiz → list soal + form CRUD.
- **Skor** → tabel semua attempt peserta.
- **Ranking** → tabel ranking global (bisa filter per quiz).

---

## 11. Struktur Folder Backend (Express)

```
server/
├── src/
│   ├── config/db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── isAdmin.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── quizController.js
│   │   ├── attemptController.js
│   │   └── adminController.js
│   ├── routes/
│   ├── utils/
│   │   ├── jwt.js
│   │   └── validator.js
│   └── app.js
├── .env
└── package.json
```

`.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=quiz_app
JWT_SECRET=...
JWT_EXPIRES=1h
```

---

## 12. Rencana Pengembangan (Milestone)

| Fase | Fitur                                  | Estimasi |
| ---- | -------------------------------------- | -------- |
| 1    | Setup project, DB, auth login/register | 2 hari   |
| 2    | CRUD quiz & soal (admin)               | 2 hari   |
| 3    | Play quiz + timer + submit + skor      | 3 hari   |
| 4    | Ranking & dashboard                    | 2 hari   |
| 5    | Polishing UI + testing                 | 2 hari   |

---

## 13. Testing Checklist

- [ ] Register dengan NIK duplikat → error.
- [ ] Login NIK tidak terdaftar → error.
- [ ] Peserta tidak bisa akses `/admin` → 403.
- [ ] Timer habis → auto-submit, jawaban kosong = salah.
- [ ] Submit setelah deadline → ditolak.
- [ ] Skor dihitung benar (5/5 = 100).
- [ ] Ranking konsisten (skor → waktu).
- [ ] CRUD quiz/soal/peserta bekerja.
- [ ] Responsive mobile & desktop.

---

## 14. Catatan & Pengembangan Lanjutan

- **Pengembangan lanjutan:**
  - Reset password via OTP WhatsApp.
  - Export skor ke Excel.
  - Multiple attempt policy (boleh berapa kali).
  - Bank soal dengan kategori & difficulty.
  - Notifikasi hasil via WA (gateway).
  - Audit log admin.

- **Opsional:** tambahkan field `foto` peserta, atau integrasi Google SSO (jika NIK tidak wajib).
