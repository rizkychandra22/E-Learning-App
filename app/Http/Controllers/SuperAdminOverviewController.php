<?php

namespace App\Http\Controllers;

use App\Models\Fakultas;
use App\Models\Jurusan;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminOverviewController extends Controller
{
    public function statistics(): Response
    {
        $totalUsers = User::count();
        $totalAdmins = User::where('role', 'admin')->count();
        $totalLecturers = User::where('role', 'teacher')->count();
        $totalStudents = User::where('role', 'student')->count();
        $totalFakultas = Fakultas::count();
        $totalJurusan = Jurusan::count();

        $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();
        $thisMonthStart = now()->startOfMonth();

        $newUsersLastMonth = User::whereBetween('created_at', [$lastMonthStart, $thisMonthStart])->count();
        $newUsersThisMonth = User::where('created_at', '>=', $thisMonthStart)->count();

        $monthlyUsers = collect(range(0, 5))
            ->map(function (int $offset) {
                $date = now()->subMonths(5 - $offset);
                $start = $date->copy()->startOfMonth();
                $end = $date->copy()->endOfMonth();
                $total = User::whereBetween('created_at', [$start, $end])->count();

                return [
                    'month' => $date->translatedFormat('M Y'),
                    'total' => $total,
                ];
            })
            ->values();

        $roleDistribution = [
            ['label' => 'Super Admin', 'value' => User::where('role', 'root')->count()],
            ['label' => 'Admin', 'value' => $totalAdmins],
            ['label' => 'Dosen', 'value' => $totalLecturers],
            ['label' => 'Mahasiswa', 'value' => $totalStudents],
            ['label' => 'Finance', 'value' => User::where('role', 'finance')->count()],
        ];

        $fakultasStats = Fakultas::query()
            ->withCount('jurusans')
            ->orderBy('name')
            ->get()
            ->map(fn (Fakultas $fakultas) => [
                'name' => $fakultas->name,
                'code' => $fakultas->code,
                'jurusan_count' => $fakultas->jurusans_count,
            ]);

        $activeSessions = DB::table('sessions')
            ->where('last_activity', '>=', now()->subMinutes(15)->timestamp)
            ->count();

        return Inertia::render('SuperAdmin/Statistics', [
            'summary' => [
                'total_users' => $totalUsers,
                'total_admins' => $totalAdmins,
                'total_lecturers' => $totalLecturers,
                'total_students' => $totalStudents,
                'total_fakultas' => $totalFakultas,
                'total_jurusan' => $totalJurusan,
                'active_sessions' => $activeSessions,
                'new_users_this_month' => $newUsersThisMonth,
                'new_users_last_month' => $newUsersLastMonth,
            ],
            'monthly_users' => $monthlyUsers,
            'role_distribution' => $roleDistribution,
            'fakultas_stats' => $fakultasStats,
        ]);
    }

    public function activityLogs(Request $request): Response
    {
        $query = trim((string) $request->query('q', ''));
        $type = trim((string) $request->query('type', 'all'));

        $logs = collect();

        $userEvents = User::query()
            ->latest('updated_at')
            ->limit(50)
            ->get(['id', 'name', 'role', 'created_at', 'updated_at'])
            ->map(function (User $user) {
                $created = Carbon::parse($user->created_at);
                $updated = Carbon::parse($user->updated_at);
                $sameMoment = $created->equalTo($updated);

                return [
                    'id' => 'user-' . $user->id,
                    'type' => $sameMoment ? 'create' : 'update',
                    'module' => 'users',
                    'actor' => 'System',
                    'message' => $sameMoment
                        ? 'Akun pengguna ditambahkan: ' . $user->name
                        : 'Data pengguna diperbarui: ' . $user->name,
                    'time' => $updated->toISOString(),
                ];
            });

        $fakultasEvents = Fakultas::query()
            ->latest('updated_at')
            ->limit(20)
            ->get(['id', 'name', 'created_at', 'updated_at'])
            ->map(function (Fakultas $fakultas) {
                $created = Carbon::parse($fakultas->created_at);
                $updated = Carbon::parse($fakultas->updated_at);
                $sameMoment = $created->equalTo($updated);

                return [
                    'id' => 'fakultas-' . $fakultas->id,
                    'type' => $sameMoment ? 'create' : 'update',
                    'module' => 'fakultas',
                    'actor' => 'System',
                    'message' => $sameMoment
                        ? 'Fakultas ditambahkan: ' . $fakultas->name
                        : 'Fakultas diperbarui: ' . $fakultas->name,
                    'time' => $updated->toISOString(),
                ];
            });

        $logs = $logs
            ->concat($userEvents)
            ->concat($fakultasEvents)
            ->sortByDesc('time')
            ->values();

        if ($type !== '' && $type !== 'all') {
            $logs = $logs->where('type', $type)->values();
        }

        if ($query !== '') {
            $keyword = mb_strtolower($query);
            $logs = $logs->filter(function (array $item) use ($keyword) {
                return str_contains(mb_strtolower($item['message']), $keyword)
                    || str_contains(mb_strtolower($item['module']), $keyword);
            })->values();
        }

        return Inertia::render('SuperAdmin/ActivityLogs', [
            'logs' => $logs->take(100)->values(),
            'filters' => [
                'q' => $query,
                'type' => $type === '' ? 'all' : $type,
            ],
        ]);
    }

    public function settings(): Response
    {
        return Inertia::render('SuperAdmin/Settings', [
            'settings' => $this->getSettingsMap(),
        ]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        if (!Schema::hasTable('system_settings')) {
            return back()->withErrors([
                'settings' => 'Tabel system_settings belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $validated = $request->validate([
            'platform_name' => ['required', 'string', 'max:120'],
            'support_email' => ['required', 'email', 'max:120'],
            'default_language' => ['required', 'in:id,en'],
            'maintenance_mode' => ['required', 'boolean'],
            'allow_registration' => ['required', 'boolean'],
            'notify_on_new_user' => ['required', 'boolean'],
            'session_timeout_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'max_upload_mb' => ['required', 'integer', 'min:1', 'max:200'],
        ]);

        foreach ($validated as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        return back()->with('success', 'Pengaturan berhasil diperbarui.');
    }

    private function getSettingsMap(): array
    {
        $defaults = [
            'platform_name' => 'Smart Learning',
            'support_email' => 'support@univ.ac.id',
            'default_language' => 'id',
            'maintenance_mode' => false,
            'allow_registration' => false,
            'notify_on_new_user' => true,
            'session_timeout_minutes' => 60,
            'max_upload_mb' => 20,
        ];

        if (!Schema::hasTable('system_settings')) {
            return $defaults;
        }

        $stored = SystemSetting::query()->pluck('value', 'key');

        return [
            'platform_name' => (string) ($stored['platform_name'] ?? $defaults['platform_name']),
            'support_email' => (string) ($stored['support_email'] ?? $defaults['support_email']),
            'default_language' => (string) ($stored['default_language'] ?? $defaults['default_language']),
            'maintenance_mode' => ($stored['maintenance_mode'] ?? ($defaults['maintenance_mode'] ? '1' : '0')) === '1',
            'allow_registration' => ($stored['allow_registration'] ?? ($defaults['allow_registration'] ? '1' : '0')) === '1',
            'notify_on_new_user' => ($stored['notify_on_new_user'] ?? ($defaults['notify_on_new_user'] ? '1' : '0')) === '1',
            'session_timeout_minutes' => (int) ($stored['session_timeout_minutes'] ?? $defaults['session_timeout_minutes']),
            'max_upload_mb' => (int) ($stored['max_upload_mb'] ?? $defaults['max_upload_mb']),
        ];
    }
}
