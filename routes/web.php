<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SuperAdminOverviewController;
use App\Http\Controllers\SuperAdminUserManagementController;
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
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::middleware('role:root')->group(function () {
        Route::get('/manage-admins', [SuperAdminUserManagementController::class, 'index'])->defaults('target', 'admins');
        Route::post('/manage-admins', [SuperAdminUserManagementController::class, 'store'])->defaults('target', 'admins');
        Route::put('/manage-admins/{user}', [SuperAdminUserManagementController::class, 'update'])->defaults('target', 'admins');
        Route::delete('/manage-admins/{user}', [SuperAdminUserManagementController::class, 'destroy'])->defaults('target', 'admins');

        Route::get('/manage-lecturers', [SuperAdminUserManagementController::class, 'index'])->defaults('target', 'lecturers');
        Route::post('/manage-lecturers', [SuperAdminUserManagementController::class, 'store'])->defaults('target', 'lecturers');
        Route::put('/manage-lecturers/{user}', [SuperAdminUserManagementController::class, 'update'])->defaults('target', 'lecturers');
        Route::delete('/manage-lecturers/{user}', [SuperAdminUserManagementController::class, 'destroy'])->defaults('target', 'lecturers');

        Route::get('/manage-students', [SuperAdminUserManagementController::class, 'index'])->defaults('target', 'students');
        Route::post('/manage-students', [SuperAdminUserManagementController::class, 'store'])->defaults('target', 'students');
        Route::put('/manage-students/{user}', [SuperAdminUserManagementController::class, 'update'])->defaults('target', 'students');
        Route::delete('/manage-students/{user}', [SuperAdminUserManagementController::class, 'destroy'])->defaults('target', 'students');

        Route::get('/statistics', [SuperAdminOverviewController::class, 'statistics']);
        Route::get('/activity-logs', [SuperAdminOverviewController::class, 'activityLogs']);
        Route::put('/settings', [SuperAdminOverviewController::class, 'updateSettings']);
    });

    Route::get('/settings', function () {
        if (auth()->user()?->role === 'root') {
            return app(SuperAdminOverviewController::class)->settings();
        }

        return Inertia::render('Placeholder', [
            'title' => 'Pengaturan',
            'description' => 'Halaman pengaturan untuk role ini sedang dalam pengembangan.',
        ]);
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
        '/manage-users' => ['title' => 'Kelola User'],
        '/approvals' => ['title' => 'Persetujuan Akun'],
        '/categories' => ['title' => 'Kategori'],
    ];

    foreach ($placeholderRoutes as $uri => $props) {
        Route::get($uri, function () use ($props) {
            return Inertia::render('Placeholder', $props);
        });
    }
});
