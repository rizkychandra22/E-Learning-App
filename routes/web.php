<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminAcademicController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\LecturerController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\PerformanceLogController;
use App\Http\Controllers\SuperAdminOverviewController;
use App\Http\Controllers\SuperAdminUserManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return auth()->check() ? redirect('/dashboard') : app(LandingController::class)->index();
});

Route::get('/maintenance', function () {
    return Inertia::render('MaintenanceNotice');
})->name('maintenance.notice');

Route::post('/perf/vitals', [PerformanceController::class, 'store'])
    ->middleware('throttle:60,1')
    ->name('perf.vitals');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update');
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
        Route::get('/perf-logs', [PerformanceLogController::class, 'index']);
        Route::get('/perf-logs/download', [PerformanceLogController::class, 'download']);
        Route::put('/settings', [SuperAdminOverviewController::class, 'updateSettings']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/manage-users', [AdminAcademicController::class, 'manageUsers']);
        Route::post('/manage-users', [AdminAcademicController::class, 'storeUser']);
        Route::put('/manage-users/{user}', [AdminAcademicController::class, 'updateUser']);
        Route::delete('/manage-users/{user}', [AdminAcademicController::class, 'destroyUser']);

        Route::get('/manage-courses', [AdminAcademicController::class, 'manageCourses']);
        Route::post('/manage-courses', [AdminAcademicController::class, 'storeCourse']);
        Route::post('/manage-courses/{course}/materials', [AdminAcademicController::class, 'storeCourseMaterial']);
        Route::get('/manage-courses/{course}/materials/{material}/download', [AdminAcademicController::class, 'downloadCourseMaterial']);
        Route::delete('/manage-courses/{course}/materials/{material}', [AdminAcademicController::class, 'destroyCourseMaterial']);
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

    Route::get('/my-courses', [LecturerController::class, 'myCourses']);
    Route::post('/my-courses', [LecturerController::class, 'storeCourse']);
    Route::put('/my-courses/{course}', [LecturerController::class, 'updateCourse']);
    Route::delete('/my-courses/{course}', [LecturerController::class, 'destroyCourse']);
    Route::get('/learning-modules', [LecturerController::class, 'learningModules']);
    Route::post('/learning-modules/modules', [LecturerController::class, 'storeModule']);
    Route::put('/learning-modules/modules/{module}', [LecturerController::class, 'updateModule']);
    Route::delete('/learning-modules/modules/{module}', [LecturerController::class, 'destroyModule']);
    Route::post('/learning-modules/lessons', [LecturerController::class, 'storeLesson']);
    Route::put('/learning-modules/lessons/{lesson}', [LecturerController::class, 'updateLesson']);
    Route::delete('/learning-modules/lessons/{lesson}', [LecturerController::class, 'destroyLesson']);
    Route::get('/learning/{course}', [LecturerController::class, 'learningPlayer']);
    Route::post('/learning/lessons/{lesson}/progress', [LecturerController::class, 'updateLearningProgress']);

    Route::get('/materials', [LecturerController::class, 'materials']);
    Route::post('/materials', [LecturerController::class, 'storeMaterial']);
    Route::delete('/materials/{material}', [LecturerController::class, 'destroyMaterial']);
    Route::get('/materials/{material}/download', [LecturerController::class, 'downloadMaterial']);

    Route::get('/assignments', [LecturerController::class, 'assignments']);
    Route::get('/assignments/{assignment}', function ($assignment) {
        if (auth()->user()?->role === 'student') {
            return Inertia::render('Student/AssignmentDetail', [
                'assignmentId' => (int) $assignment,
            ]);
        }

        return redirect('/assignments');
    });
    Route::post('/assignments', [LecturerController::class, 'storeAssignment']);
    Route::put('/assignments/{assignment}', [LecturerController::class, 'updateAssignment']);
    Route::delete('/assignments/{assignment}', [LecturerController::class, 'destroyAssignment']);

    Route::get('/quizzes', [LecturerController::class, 'quizzes']);
    Route::post('/quizzes', [LecturerController::class, 'storeQuiz']);
    Route::put('/quizzes/{quiz}', [LecturerController::class, 'updateQuiz']);
    Route::delete('/quizzes/{quiz}', [LecturerController::class, 'destroyQuiz']);

    Route::get('/discussions', [LecturerController::class, 'discussions']);
    Route::post('/discussions', [LecturerController::class, 'storeDiscussion']);
    Route::put('/discussions/{discussion}', [LecturerController::class, 'updateDiscussion']);
    Route::delete('/discussions/{discussion}', [LecturerController::class, 'destroyDiscussion']);

    Route::get('/students', [LecturerController::class, 'students']);
    Route::post('/students', [LecturerController::class, 'storeStudentNote']);
    Route::put('/students/{note}', [LecturerController::class, 'updateStudentNote']);
    Route::delete('/students/{note}', [LecturerController::class, 'destroyStudentNote']);
    Route::post('/students/enrollments', [LecturerController::class, 'enrollStudent']);
    Route::delete('/students/enrollments/{course}/{student}', [LecturerController::class, 'removeEnrollment']);

    Route::get('/grades', function () {
        if (auth()->user()?->role === 'student') {
            return Inertia::render('Student/Grades');
        }

        return Inertia::render('Placeholder', [
            'title' => 'Nilai',
            'description' => 'Lihat rekap nilai dan progress akademik',
        ]);
    });

    $placeholderRoutes = [];

    foreach ($placeholderRoutes as $uri => $props) {
        Route::get($uri, function () use ($props) {
            return Inertia::render('Placeholder', $props);
        });
    }
});







