<?php

use App\Http\Controllers\Auth\ViewFormController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use function Termwind\render;

Route::redirect('/', '/login');

Route::middleware('guest')->group(function () {
    Route::get('/login', [ViewFormController::class, 'login'])->name('login');
    Route::post('/login', [ViewFormController::class, 'authenticate'])->name('login.post');
    // Route::get('/register', [ViewFormController::class, 'register'])->name('register');
});

Route::get('/logout', [ViewFormController::class, 'logout'])->name('logout');

Route::get('/root/dashboard', function () {
    return Inertia::render('Dashboard/Root');
})->middleware(['role:root'])->name('root.dashboard');

Route::get('/dashboard/admin', function () {
    return Inertia::render('Dashboard/Admin');
})->middleware(['role:admin'])->name('admin.dashboard');

Route::get('/dashboard/finance', function () {
    return Inertia::render('Dashboard/Finance');
})->middleware(['role:user'])->name('finance.dashboard');

Route::get('/dashboard/teacher', function () {
    return Inertia::render('Dashboard/Teacher');
})->middleware(['role:teacher'])->name('teacher.dashboard');

Route::get('/student/home', function () {
    return Inertia::render('Dashboard/Student');
})->middleware(['role:student'])->name('student.home');

// Route::get('/', function () {
//     return view('welcome');
// });
