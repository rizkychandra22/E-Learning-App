<div align="center">
  <img src="https://laravel.com/img/logomark.min.svg" width="80" alt="Laravel Logo">
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="80" alt="React Logo" style="margin-left: 20px;">
  
  <h1 align="center">My-Campus: E-Learning System (Core IAM)</h1>
  
  <p align="center">
    <strong>Master Node & Centralized Identity Management untuk Ekosistem My-Campus</strong>
    <br/>
    <em>Dibangun dengan Laravel 11, Inertia.js, React, dan Supabase PostgreSQL</em>
  </p>

  <p align="center">
    <a href="#-arsitektur--peran-sistem"><img src="https://img.shields.io/badge/Architecture-Core_System-blue?style=for-the-badge" alt="Core System"></a>
    <a href="#-tech-stack"><img src="https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"></a>
    <a href="#-tech-stack"><img src="https://img.shields.io/badge/Backend-Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel"></a>
    <a href="#-tech-stack"><img src="https://img.shields.io/badge/Database-Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"></a>
  </p>
</div>

---

## 🎯 Arsitektur & Peran Sistem

Dalam arsitektur *micro-services* My-Campus, **E-Learning App** adalah tulang punggung (*Master Node*). Sistem ini tidak hanya menangani proses belajar mengajar, tetapi juga bertindak sebagai **Identity and Access Management (IAM)** untuk seluruh ekosistem kampus (termasuk [E-Book App](../E-Book_App)).

### Mengapa E-Learning Menjadi Master Node?
1. **Single Source of Truth (Database)**: Sistem ini adalah pemilik penuh atas skema tabel `users`.
2. **Centralized Authentication**: Semua akun login mahasiswa, dosen, dan staf kampus dibuat dan diverifikasi oleh sistem ini.
3. **Master Migrations**: Semua migrasi *database* utama (*fresh migration* dan reset *database*) wajib dieksekusi dari proyek ini untuk menghindari *data collision*.

## 👥 Manajemen Hak Akses (Roles)

Karena menggunakan *Single Database*, role dari subsistem lain juga didefinisikan di sini agar saling terintegrasi:

| Role | Deskripsi & Hak Akses | Lingkup Sistem |
| :--- | :--- | :--- |
| 👑 **`root`** | Super Admin. Mengontrol seluruh *platform*. | Global |
| 🎓 **`admin`** | Admin Akademik. Mengelola fakultas, jurusan, dan kurikulum. | E-Learning |
| 💰 **`finance`** | Admin Keuangan. Mengelola transaksi pembayaran kuliah. | E-Learning |
| 👨‍🏫 **`teacher`** | Dosen. Mengelola kelas, materi, dan nilai. | E-Learning |
| 📚 **`admin_perpustakaan`** | Admin Perpustakaan (Didelegasikan ke modul e-Library). | E-Book App |
| 🧑‍🎓 **`student`** | Mahasiswa (Pemilik NIM). Akun Universal (Kelas & Peminjaman Buku). | Global |

## 💻 Tech Stack Utama

* **Backend**: Laravel 11.x
* **Frontend**: React.js 19 + Inertia.js
* **Styling**: Tailwind CSS + Bootstrap Icons
* **Database**: PostgreSQL (Supabase)
* **Build Tool**: Vite

## 🚀 Alur Bisnis E-Learning
1. **Pendaftaran Akademik**: Admin akademik mendaftarkan dosen (NIDN) dan mahasiswa (NIM).
2. **Manajemen Kelas**: Dosen membuat kelas dan mengunggah modul/materi pembelajaran.
3. **KBM (Kegiatan Belajar Mengajar)**: Mahasiswa mengikuti kelas, mengerjakan kuis, dan mengumpulkan tugas via portal ini.

## 🛠️ Instalasi & Persiapan (*Deployment*)

> ⚠️ **PERHATIAN**: Jika Anda baru pertama kali meng-*install* ekosistem My-Campus, Anda **WAJIB** melakukan instalasi dan migrasi pada proyek E-Learning ini terlebih dahulu sebelum menyentuh proyek E-Book.

```bash
# 1. Masuk ke direktori
cd E-Learning_App

# 2. Install Dependensi
composer install
npm install

# 3. Setup Environment (Koneksikan ke Supabase PostgreSQL)
cp .env.example .env
php artisan key:generate

# 4. Inisialisasi Database (Hanya dijalankan di proyek ini!)
php artisan migrate:fresh --seed

# 5. Jalankan Development Server
php artisan serve
npm run dev
```

---
<div align="center">
  <sub>Dibangun dengan ❤️ untuk Ekosistem My-Campus</sub>
</div>
