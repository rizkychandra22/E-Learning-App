<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $authUser = auth()->user();
        $superAdminData = null;
        $adminAcademicData = null;

        if ($authUser?->role === 'root') {
            $monthlyUsers = collect(range(0, 5))
                ->map(function (int $offset) {
                    $date = now()->subMonths(5 - $offset);
                    $start = $date->copy()->startOfMonth();
                    $end = $date->copy()->endOfMonth();

                    return [
                        'month' => $date->translatedFormat('M Y'),
                        'total' => User::whereBetween('created_at', [$start, $end])->count(),
                    ];
                })
                ->values();

            $usersByRole = [
                'root' => User::where('role', 'root')->count(),
                'admin' => User::where('role', 'admin')->count(),
                'finance' => User::where('role', 'finance')->count(),
                'teacher' => User::where('role', 'teacher')->count(),
                'student' => User::where('role', 'student')->count(),
            ];

            $recentUserActivities = User::query()
                ->latest('updated_at')
                ->limit(12)
                ->get(['id', 'name', 'role', 'created_at', 'updated_at'])
                ->map(function (User $user) {
                    $created = Carbon::parse($user->created_at);
                    $updated = Carbon::parse($user->updated_at);
                    $isCreate = $created->equalTo($updated);

                    return [
                        'id' => 'user-' . $user->id,
                        'module' => 'users',
                        'role' => $user->role,
                        'action' => $isCreate ? 'create' : 'update',
                        'text' => $isCreate
                            ? 'Akun ' . $user->name . ' (' . $user->role . ') ditambahkan'
                            : 'Data akun ' . $user->name . ' (' . $user->role . ') diperbarui',
                        'time' => $updated->toISOString(),
                    ];
                });

            $settingActivities = collect();
            if (Schema::hasTable('system_settings')) {
                $settingActivities = SystemSetting::query()
                    ->latest('updated_at')
                    ->limit(5)
                    ->get(['id', 'key', 'updated_at'])
                    ->map(fn (SystemSetting $item) => [
                        'id' => 'setting-' . $item->id,
                        'module' => 'settings',
                        'role' => 'root',
                        'action' => 'update',
                        'text' => 'Pengaturan sistem diperbarui: ' . $item->key,
                        'time' => Carbon::parse($item->updated_at)->toISOString(),
                    ]);
            }

            $recentActivities = $recentUserActivities
                ->concat($settingActivities)
                ->sortByDesc('time')
                ->take(12)
                ->values();

            $activeSessions = DB::table('sessions')
                ->where('last_activity', '>=', now()->subMinutes(15)->timestamp)
                ->count();

            $thisMonth = now()->startOfMonth();
            $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();

            $superAdminData = [
                'summary' => [
                    'total_users' => array_sum($usersByRole),
                    'active_sessions' => $activeSessions,
                    'new_this_month' => User::where('created_at', '>=', $thisMonth)->count(),
                    'new_last_month' => User::whereBetween('created_at', [$lastMonthStart, $thisMonth])->count(),
                ],
                'role_stats' => $usersByRole,
                'monthly_users' => $monthlyUsers,
                'recent_activities' => $recentActivities,
            ];
        }

        if ($authUser?->role === 'admin') {
            $adminAcademicData = app(AdminAcademicController::class)->dashboardData();
        }

        return Inertia::render('Dashboard', [
            'superAdmin' => $superAdminData,
            'adminAcademic' => $adminAcademicData,
        ]);
    }
}
