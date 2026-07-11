# E-Learning App (My-Campus Core System)

![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)

E-Learning App adalah sistem inti (*Core System*) dari ekosistem digital **My-Campus**. Aplikasi ini bertindak sebagai **Centralized Identity Provider** sekaligus **Learning Management System (LMS)** untuk kegiatan akademik kampus.

## 🎯 Peran & Tanggung Jawab
Dalam ekosistem *micro-services* sederhana ini (bersama dengan [E-Book App](../E-Book_App)), **E-Learning App bertindak sebagai sistem utama (Master)** yang memiliki tanggung jawab:
1. **Pusat Migrasi Database**: Struktur tabel fundamental, khususnya tabel `users`, dikendalikan sepenuhnya dari project ini.
2. **Manajemen Identitas**: Mengelola data mahasiswa (NIM), dosen (NIDN), dan berbagai role admin lainnya.
3. **Pusat Seeder**: *Dummy data* awal untuk *role* disuntikkan dari sistem ini.
4. **Fungsi Akademik**: Manajemen mata kuliah, kelas, tugas, dan nilai.

## 👥 Struktur Role (Hak Akses)
Sistem ini menggunakan struktur autentikasi terpusat. Akun yang dibuat di sini dapat digunakan untuk login ke sistem cabang (seperti perpustakaan).
* `root`: Super Admin yang memiliki akses tanpa batas.
* `admin`: Admin akademik untuk mengelola data perkuliahan.
* `finance`: Admin keuangan.
* `teacher`: Dosen yang mengajar dan mengelola materi kuliah.
* `student`: Mahasiswa yang mengikuti kelas.
* `admin_perpustakaan`: Role khusus yang dibuat di sini agar bisa digunakan untuk mengelola modul perpustakaan di aplikasi sebelah (E-Book App).

## 🚀 Alur Database & Migrasi
Aplikasi ini terhubung ke *database* terpusat (Supabase PostgreSQL). 

**PENTING:** Jika Anda ingin melakukan reset *database*, Anda **wajib** melakukannya dari sistem E-Learning ini terlebih dahulu, karena sistem ini yang memegang kunci skema tabel pengguna.

```bash
# Lakukan migrasi beserta seeder HANYA dari direktori E-Learning_App
php artisan migrate:fresh --seed
```

## 🛠️ Instalasi & Setup

1. Clone repositori dan masuk ke direktori `E-Learning_App`
2. Install dependensi PHP & Node.js:
   ```bash
   composer install
   npm install
   ```
3. Salin `.env.example` ke `.env` dan sesuaikan koneksi database (Supabase).
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
4. Jalankan Migrasi & Seeder (Untuk inisialisasi Master Data):
   ```bash
   php artisan migrate:fresh --seed
   ```
5. Jalankan server lokal:
   ```bash
   php artisan serve
   npm run dev
   ```

---
*Dikembangkan untuk ekosistem My-Campus Terpadu.*
