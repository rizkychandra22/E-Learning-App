<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return auth()->check() ? redirect('/dashboard') : redirect('/login');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::any('/register', function () {
    abort(404);
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    });

    Route::get('/my-courses', function () {
        return Inertia::render('Courses');
    });

    Route::get('/manage-courses', function () {
        return Inertia::render('Courses');
    });

    $placeholderRoutes = [
        '/materials' => ['title' => 'Materi', 'description' => 'Kelola dan akses materi pembelajaran'],
        '/assignments' => ['title' => 'Tugas', 'description' => 'Lihat dan kerjakan tugas yang tersedia'],
        '/quizzes' => ['title' => 'Kuis', 'description' => 'Akses kuis dan ujian online'],
        '/grades' => ['title' => 'Nilai', 'description' => 'Lihat rekap nilai dan progress akademik'],
        '/discussions' => ['title' => 'Diskusi', 'description' => 'Forum diskusi antar mahasiswa dan dosen'],
        '/students' => ['title' => 'Mahasiswa', 'description' => 'Daftar mahasiswa yang terdaftar'],
        '/manage-admins' => ['title' => 'Kelola Admin'],
        '/manage-lecturers' => ['title' => 'Kelola Dosen'],
        '/manage-students' => ['title' => 'Kelola Mahasiswa'],
        '/manage-users' => ['title' => 'Kelola User'],
        '/approvals' => ['title' => 'Persetujuan Akun'],
        '/categories' => ['title' => 'Kategori'],
        '/statistics' => ['title' => 'Statistik Global'],
        '/activity-logs' => ['title' => 'Log Aktivitas'],
        '/settings' => ['title' => 'Pengaturan'],
    ];

    foreach ($placeholderRoutes as $uri => $props) {
        Route::get($uri, function () use ($props) {
            return Inertia::render('Placeholder', $props);
        });
    }
});
