<?php

namespace App\Services;

use App\Models\Fakultas;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class SuperAdminService
{
    public function getManagedUsersData(string $target, string $search): array
    {
        $config = $this->resolveUserConfig($target);

        $users = User::query()
            ->where('role', $config['role'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%')
                        ->orWhere('username', 'like', '%' . $search . '%')
                        ->orWhere('code', 'like', '%' . $search . '%');
                });
            })
            ->latest('id')
            ->get(['id', 'name', 'email', 'username', 'code', 'created_at']);

        $mocked = false;
        if ($search === '' && $users->isEmpty()) {
            $mocked = true;
            $users = collect($this->mockManagedUsers($target));
        }

        return [
            'title' => $config['title'],
            'description' => $config['description'],
            'target' => $target,
            'endpoint' => $config['endpoint'],
            'users' => $users,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
            ],
        ];
    }

    public function createManagedUser(string $target, array $payload): string
    {
        $config = $this->resolveUserConfig($target);

        $user = User::create([
            ...$payload,
            'role' => $config['role'],
            'type' => $config['type'],
        ]);

        if (app(SystemSettingService::class)->shouldNotifyOnNewUser()) {
            Log::info('New managed user created by super admin.', [
                'email' => $user->email,
                'role' => $user->role,
                'source' => 'super-admin',
            ]);
        }

        return $config['singleLabel'];
    }

    public function updateManagedUser(string $target, User $user, array $payload): string
    {
        $config = $this->resolveUserConfig($target);
        $this->ensureUserMatchesTarget($user, $config['role']);

        $updatePayload = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'username' => $payload['username'],
            'code' => $payload['code'],
            'role' => $config['role'],
            'type' => $config['type'],
        ];

        if (!empty($payload['password'])) {
            $updatePayload['password'] = $payload['password'];
        }

        $user->update($updatePayload);

        return $config['singleLabel'];
    }

    public function deleteManagedUser(string $target, User $user): string
    {
        $config = $this->resolveUserConfig($target);
        $this->ensureUserMatchesTarget($user, $config['role']);

        $user->delete();

        return $config['singleLabel'];
    }

    public function getStatisticsData(): array
    {
        $totalUsers = User::count();
        $totalAdmins = User::where('role', 'admin')->count();
        $totalLecturers = User::where('role', 'teacher')->count();
        $totalStudents = User::where('role', 'student')->count();
        $totalFakultas = Fakultas::count();
        $totalJurusan = \App\Models\Jurusan::count();

        $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();
        $thisMonthStart = now()->startOfMonth();

        $newUsersLastMonth = User::whereBetween('created_at', [$lastMonthStart, $thisMonthStart])->count();
        $newUsersThisMonth = User::where('created_at', '>=', $thisMonthStart)->count();

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

        $mocked = false;
        $roleTotal = array_sum(array_map(fn ($item) => (int) $item['value'], $roleDistribution));
        $allMonthlyZero = $monthlyUsers->every(fn ($item) => (int) $item['total'] === 0);
        if ($totalUsers === 0 && $totalFakultas === 0 && $totalJurusan === 0 && $fakultasStats->isEmpty() && $roleTotal === 0 && $allMonthlyZero) {
            $mocked = true;
            $mock = $this->mockStatisticsData();
            return [
                ...$mock,
                'mocked' => $mocked,
            ];
        }

        return [
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
            'mocked' => $mocked,
        ];
    }

    public function getDashboardData(): array
    {
        return Cache::remember('dashboard:super-admin', now()->addSeconds(30), function () {
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

            return [
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
        });
    }

    public function getActivityLogsData(string $query, string $type): array
    {
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

        $mocked = false;
        if ($query === '' && ($type === '' || $type === 'all') && $logs->isEmpty()) {
            $mocked = true;
            $logs = collect($this->mockActivityLogs());
        }

        return [
            'logs' => $logs->take(100)->values(),
            'mocked' => $mocked,
            'filters' => [
                'q' => $query,
                'type' => $type === '' ? 'all' : $type,
            ],
        ];
    }

    public function getSettings(): array
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

    public function updateSettings(array $payload): bool
    {
        if (!Schema::hasTable('system_settings')) {
            return false;
        }

        foreach ($payload as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        Cache::forget('dashboard:super-admin');
        app(SystemSettingService::class)->clearCache();

        return true;
    }

    private function ensureUserMatchesTarget(User $user, string $expectedRole): void
    {
        abort_if($user->role !== $expectedRole, 404);
    }

    private function resolveUserConfig(string $target): array
    {
        $config = match ($target) {
            'admins' => [
                'role' => 'admin',
                'type' => 'nidn',
                'title' => 'Kelola Admin',
                'description' => 'CRUD data admin akademik',
                'singleLabel' => 'Admin',
                'endpoint' => '/manage-admins',
            ],
            'lecturers' => [
                'role' => 'teacher',
                'type' => 'nidn',
                'title' => 'Kelola Dosen',
                'description' => 'CRUD data dosen',
                'singleLabel' => 'Dosen',
                'endpoint' => '/manage-lecturers',
            ],
            'students' => [
                'role' => 'student',
                'type' => 'nim',
                'title' => 'Kelola Mahasiswa',
                'description' => 'CRUD data mahasiswa',
                'singleLabel' => 'Mahasiswa',
                'endpoint' => '/manage-students',
            ],
            default => null,
        };

        abort_if($config === null, 404);

        return $config;
    }

    private function mockManagedUsers(string $target): array
    {
        $roleLabel = match ($target) {
            'admins' => 'admin',
            'lecturers' => 'teacher',
            'students' => 'student',
            default => 'admin',
        };

        $base = [
            [
                'id' => 9101,
                'name' => 'Rizky Maulana',
                'email' => 'rizky.maulana@mail.id',
                'username' => 'rizky.maulana',
                'code' => $roleLabel === 'student' ? 'NIM2024009' : 'NIDN202401',
            ],
            [
                'id' => 9102,
                'name' => 'Aulia Prameswari',
                'email' => 'aulia.prameswari@mail.id',
                'username' => 'aulia.prameswari',
                'code' => $roleLabel === 'student' ? 'NIM2024010' : 'NIDN202402',
            ],
        ];

        return array_map(fn ($item) => [
            ...$item,
            'created_at' => now()->subDays(3)->toISOString(),
            'is_mock' => true,
        ], $base);
    }

    private function mockActivityLogs(): array
    {
        return [
            [
                'id' => 'mock-activity-1',
                'type' => 'create',
                'module' => 'users',
                'actor' => 'System',
                'message' => 'Akun pengguna ditambahkan: Rina Putri',
                'time' => now()->subHours(5)->toISOString(),
                'is_mock' => true,
            ],
            [
                'id' => 'mock-activity-2',
                'type' => 'update',
                'module' => 'fakultas',
                'actor' => 'System',
                'message' => 'Fakultas diperbarui: Teknik Informatika',
                'time' => now()->subDays(1)->toISOString(),
                'is_mock' => true,
            ],
            [
                'id' => 'mock-activity-3',
                'type' => 'delete',
                'module' => 'users',
                'actor' => 'System',
                'message' => 'Data pengguna dihapus: Bagus Wijaya',
                'time' => now()->subDays(2)->toISOString(),
                'is_mock' => true,
            ],
        ];
    }

    private function mockStatisticsData(): array
    {
        $monthlyUsers = collect(range(0, 5))
            ->map(function (int $offset) {
                $date = now()->subMonths(5 - $offset);
                return [
                    'month' => $date->translatedFormat('M Y'),
                    'total' => 320 + ($offset * 20),
                ];
            })
            ->values();

        return [
            'summary' => [
                'total_users' => 420,
                'total_admins' => 12,
                'total_lecturers' => 38,
                'total_students' => 360,
                'total_fakultas' => 6,
                'total_jurusan' => 18,
                'active_sessions' => 42,
                'new_users_this_month' => 24,
                'new_users_last_month' => 18,
            ],
            'monthly_users' => $monthlyUsers,
            'role_distribution' => [
                ['label' => 'Super Admin', 'value' => 2],
                ['label' => 'Admin', 'value' => 12],
                ['label' => 'Dosen', 'value' => 38],
                ['label' => 'Mahasiswa', 'value' => 360],
                ['label' => 'Finance', 'value' => 8],
            ],
            'fakultas_stats' => [
                ['name' => 'Teknik', 'code' => 'FT', 'jurusan_count' => 6],
                ['name' => 'Ekonomi', 'code' => 'FE', 'jurusan_count' => 4],
                ['name' => 'Sains', 'code' => 'FS', 'jurusan_count' => 5],
                ['name' => 'Humaniora', 'code' => 'FH', 'jurusan_count' => 3],
            ],
        ];
    }
}
