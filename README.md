# Dukcapil Quiz — Web Quiz Application

Aplikasi web quiz online berbasis **Vue 3 + Vite + TailwindCSS** (frontend) dan **Express.js + MySQL 8** (backend), sesuai spesifikasi di [`design.md`](./design.md).

## Fitur Utama

- **Autentikasi NIK + JWT**: Registrasi & login dengan validasi NIK 16 digit, No. WhatsApp (`08xxxx`), bcrypt password hashing, dan rate limit login (5x/menit/IP).
- **Portal Peserta**:
  - Dashboard ringkasan & riwayat pengerjaan.
  - Daftar quiz aktif dengan pengambilan **soal acak** yang dikunci saat attempt dimulai (aman saat refresh).
  - **Timer server-side authoritative** dengan countdown visual & auto-submit saat waktu habis.
  - Auto-save jawaban per soal, perhitungan skor otomatis, pembahasan benar/salah per soal, serta papan ranking real-time.
- **Portal Admin**:
  - Dashboard statistik (total peserta, total quiz, total attempt, rata-rata skor).
  - CRUD Peserta (pencarian & pagination), CRUD Quiz, CRUD Bank Soal.
  - Rekap semua skor peserta & Ranking global (filter per quiz).

---

## Cara Menjalankan

### 1. Konfigurasi Database & Backend (`server/`)

1. Buka [`server/.env`](./server/.env) dan sesuaikan kredensial MySQL Anda (terutama `DB_PASSWORD`):
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=password_mysql_anda
   DB_NAME=quiz_app
   JWT_SECRET=dukcapil_quiz_super_secret_change_me_2026
   JWT_EXPIRES=1h
   CORS_ORIGIN=http://localhost:5173
   ```
2. Jalankan migrasi & seed database (otomatis membuat database `quiz_app`, 5 tabel, akun default, dan 10 soal contoh):
   ```powershell
   cd server
   npm.cmd run seed
   ```
3. Jalankan backend API:
   ```powershell
   npm.cmd run dev
   ```
   API berjalan di `http://localhost:3000`.

### 2. Jalankan Frontend (`client/`)

Buka terminal baru:
```powershell
cd client
npm.cmd run dev
```
Aplikasi web berjalan di `http://localhost:5173`.

---

## Akun Default (Hasil Seed)

| Role    | NIK                | Password     |
| ------- | ------------------ | ------------ |
| Admin   | `0000000000000001` | `admin1234`  |
| Peserta | `3201010101950001` | `peserta123` |
| Peserta | `3201010202960002` | `peserta123` |
