-- Database Schema for Dukcapil Web Quiz Application
-- MySQL 8.x

CREATE DATABASE IF NOT EXISTS quiz_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quiz_app;

-- 4.1 users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nik VARCHAR(16) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  no_whatsapp VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT '',
  role ENUM('peserta', 'admin') NOT NULL DEFAULT 'peserta',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_nama (nama)
) ENGINE=InnoDB;

-- 4.2 quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(150) NOT NULL,
  deskripsi TEXT,
  durasi_detik INT NOT NULL DEFAULT 300,
  jumlah_soal INT NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_quizzes_active (is_active)
) ENGINE=InnoDB;

-- 4.3 questions
CREATE TABLE IF NOT EXISTS questions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT UNSIGNED NOT NULL,
  pertanyaan TEXT NOT NULL,
  opsi_a TEXT NOT NULL,
  opsi_b TEXT NOT NULL,
  opsi_c TEXT NOT NULL,
  opsi_d TEXT NOT NULL,
  jawaban_benar ENUM('A', 'B', 'C', 'D') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_questions_quiz
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    ON DELETE CASCADE,
  INDEX idx_questions_quiz_id (quiz_id)
) ENGINE=InnoDB;

-- 4.4 quiz_attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  quiz_id BIGINT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  score INT NOT NULL DEFAULT 0,
  status ENUM('in_progress', 'finished', 'expired') NOT NULL DEFAULT 'in_progress',
  CONSTRAINT fk_attempts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_attempts_quiz
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    ON DELETE CASCADE,
  INDEX idx_attempts_user_quiz (user_id, quiz_id),
  INDEX idx_attempts_status_score (status, score)
) ENGINE=InnoDB;

-- 4.5 quiz_answers
CREATE TABLE IF NOT EXISTS quiz_answers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  jawaban_dipilih ENUM('A', 'B', 'C', 'D') NULL,
  is_benar BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_answers_attempt
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_answers_question
    FOREIGN KEY (question_id) REFERENCES questions(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_attempt_question (attempt_id, question_id)
) ENGINE=InnoDB;
