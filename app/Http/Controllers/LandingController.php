<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class LandingController extends Controller
{
    private static ?bool $hasUsersTable = null;
    private static ?bool $hasCoursesTable = null;
    private static ?bool $hasInvoicesTable = null;

    public function index()
    {
        $stats = Cache::remember('landing:stats', now()->addMinutes(3), function (): array {
            $hasUsers = $this->hasUsersTable();
            $hasCourses = $this->hasCoursesTable();
            $hasInvoices = $this->hasInvoicesTable();

            $userStats = $hasUsers
                ? User::query()
                    ->selectRaw('COUNT(*) as total_users')
                    ->selectRaw("SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as total_students")
                    ->selectRaw("SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as total_lecturers")
                    ->first()
                : null;

            return [
                'total_users' => (int) ($userStats?->total_users ?? 0),
                'total_students' => (int) ($userStats?->total_students ?? 0),
                'total_lecturers' => (int) ($userStats?->total_lecturers ?? 0),
                'total_courses' => $hasCourses ? (int) Course::count() : 0,
                'receivables' => $hasInvoices
                    ? (float) Invoice::query()
                        ->whereIn('status', ['unpaid', 'partial', 'overdue'])
                        ->sum('amount')
                    : 0.0,
            ];
        });

        return view('welcome', [
            'stats' => $stats,
        ]);
    }

    private function hasUsersTable(): bool
    {
        if (self::$hasUsersTable !== null) {
            return self::$hasUsersTable;
        }

        self::$hasUsersTable = Schema::hasTable('users');

        return self::$hasUsersTable;
    }

    private function hasCoursesTable(): bool
    {
        if (self::$hasCoursesTable !== null) {
            return self::$hasCoursesTable;
        }

        self::$hasCoursesTable = Schema::hasTable('courses');

        return self::$hasCoursesTable;
    }

    private function hasInvoicesTable(): bool
    {
        if (self::$hasInvoicesTable !== null) {
            return self::$hasInvoicesTable;
        }

        self::$hasInvoicesTable = Schema::hasTable('invoices');

        return self::$hasInvoicesTable;
    }
}
