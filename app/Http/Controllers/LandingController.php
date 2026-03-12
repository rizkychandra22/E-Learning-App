<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

class LandingController extends Controller
{
    public function index()
    {
        $hasUsers = Schema::hasTable('users');
        $hasCourses = Schema::hasTable('courses');
        $hasInvoices = Schema::hasTable('invoices');

        $totalUsers = $hasUsers ? User::count() : 0;
        $totalStudents = $hasUsers ? User::where('role', 'student')->count() : 0;
        $totalLecturers = $hasUsers ? User::where('role', 'teacher')->count() : 0;
        $totalCourses = $hasCourses ? Course::count() : 0;
        $receivables = $hasInvoices
            ? (float) Invoice::query()
                ->whereIn('status', ['unpaid', 'partial', 'overdue'])
                ->sum('amount')
            : 0;

        return view('welcome', [
            'stats' => [
                'total_users' => $totalUsers,
                'total_students' => $totalStudents,
                'total_lecturers' => $totalLecturers,
                'total_courses' => $totalCourses,
                'receivables' => $receivables,
            ],
        ]);
    }
}
