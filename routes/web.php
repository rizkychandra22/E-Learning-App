<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminAcademicController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinanceController;
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

    Route::middleware('role:admin')->group(function () {
        Route::get('/manage-users', [AdminAcademicController::class, 'manageUsers']);
        Route::post('/manage-users', [AdminAcademicController::class, 'storeUser']);
        Route::put('/manage-users/{user}', [AdminAcademicController::class, 'updateUser']);
        Route::delete('/manage-users/{user}', [AdminAcademicController::class, 'destroyUser']);

        Route::get('/manage-courses', [AdminAcademicController::class, 'manageCourses']);
        Route::post('/manage-courses', [AdminAcademicController::class, 'storeCourse']);
        Route::put('/manage-courses/{course}', [AdminAcademicController::class, 'updateCourse']);
        Route::delete('/manage-courses/{course}', [AdminAcademicController::class, 'destroyCourse']);

        Route::get('/approvals', [AdminAcademicController::class, 'approvals']);
        Route::put('/approvals/{user}/approve', [AdminAcademicController::class, 'approve']);
        Route::delete('/approvals/{user}/reject', [AdminAcademicController::class, 'reject']);

        Route::get('/categories', [AdminAcademicController::class, 'categories']);
        Route::post('/categories/fakultas', [AdminAcademicController::class, 'storeFakultas']);
        Route::put('/categories/fakultas/{fakultas}', [AdminAcademicController::class, 'updateFakultas']);
        Route::delete('/categories/fakultas/{fakultas}', [AdminAcademicController::class, 'destroyFakultas']);
        Route::post('/categories/jurusan', [AdminAcademicController::class, 'storeJurusan']);
        Route::put('/categories/jurusan/{jurusan}', [AdminAcademicController::class, 'updateJurusan']);
        Route::delete('/categories/jurusan/{jurusan}', [AdminAcademicController::class, 'destroyJurusan']);

        Route::put('/settings/admin-academic', [AdminAcademicController::class, 'updateSettings']);
    });

    Route::middleware('role:finance')->group(function () {
        Route::get('/finance-invoices', [FinanceController::class, 'invoices']);
        Route::post('/finance-invoices', [FinanceController::class, 'storeInvoice']);
        Route::put('/finance-invoices/{invoice}', [FinanceController::class, 'updateInvoice']);
        Route::delete('/finance-invoices/{invoice}', [FinanceController::class, 'destroyInvoice']);

        Route::get('/finance-payments', [FinanceController::class, 'payments']);
        Route::post('/finance-payments', [FinanceController::class, 'storePayment']);
        Route::put('/finance-payments/{payment}/verify', [FinanceController::class, 'verifyPayment']);
        Route::put('/finance-payments/{payment}/reject', [FinanceController::class, 'rejectPayment']);

        Route::get('/finance-reports', [FinanceController::class, 'reports']);
        Route::put('/settings/finance', [FinanceController::class, 'updateSettings']);
    });

    Route::get('/settings', function () {
        if (auth()->user()?->role === 'root') {
            return app(SuperAdminOverviewController::class)->settings();
        }

        if (auth()->user()?->role === 'admin') {
            return app(AdminAcademicController::class)->settings();
        }

        if (auth()->user()?->role === 'finance') {
            return app(FinanceController::class)->settings();
        }

        return Inertia::render('Placeholder', [
            'title' => 'Pengaturan',
            'description' => 'Halaman pengaturan untuk role ini sedang dalam pengembangan.',
        ]);
    });

    Route::get('/my-courses', function () {
        return Inertia::render('Courses');
    });

    $placeholderRoutes = [
        '/materials' => ['title' => 'Materi', 'description' => 'Kelola dan akses materi pembelajaran'],
        '/assignments' => ['title' => 'Tugas', 'description' => 'Lihat dan kerjakan tugas yang tersedia'],
        '/quizzes' => ['title' => 'Kuis', 'description' => 'Akses kuis dan ujian online'],
        '/grades' => ['title' => 'Nilai', 'description' => 'Lihat rekap nilai dan progress akademik'],
        '/discussions' => ['title' => 'Diskusi', 'description' => 'Forum diskusi antar mahasiswa dan dosen'],
        '/students' => ['title' => 'Mahasiswa', 'description' => 'Daftar mahasiswa yang terdaftar'],
    ];

    foreach ($placeholderRoutes as $uri => $props) {
        Route::get($uri, function () use ($props) {
            return Inertia::render('Placeholder', $props);
        });
    }
});
