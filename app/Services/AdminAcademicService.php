<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Fakultas;
use App\Models\Jurusan;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminAcademicService
{
    public function getManageCoursesData(string $search, string $status): array
    {
        $normalizedStatus = in_array($status, ['all', 'draft', 'active', 'archived'], true) ? $status : 'all';
        $migrationRequired = !Schema::hasTable('courses');

        $courses = collect();
        if (!$migrationRequired) {
            $courses = Course::query()
                ->with(['jurusan:id,name,fakultas_id', 'jurusan.fakultas:id,name', 'lecturer:id,name'])
                ->when($normalizedStatus !== 'all', fn ($query) => $query->where('status', $normalizedStatus))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('title', 'like', '%' . $search . '%')
                            ->orWhere('code', 'like', '%' . $search . '%');
                    });
                })
                ->latest('id')
                ->get();
        }

        $jurusans = Jurusan::query()
            ->with('fakultas:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'fakultas_id']);

        $lecturers = User::query()
            ->where('role', 'teacher')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return [
            'courses' => $courses,
            'jurusans' => $jurusans,
            'lecturers' => $lecturers,
            'migrationRequired' => $migrationRequired,
            'filters' => [
                'search' => $search,
                'status' => $normalizedStatus,
            ],
        ];
    }

    public function canManageCourses(): bool
    {
        return Schema::hasTable('courses');
    }

    public function createCourse(array $payload): void
    {
        Course::create($payload);
    }

    public function updateCourse(Course $course, array $payload): void
    {
        $course->update($payload);
    }

    public function deleteCourse(Course $course): void
    {
        $course->delete();
    }

    public function getManageUsersData(string $search, string $role): array
    {
        $allowedRoles = ['teacher', 'student', 'finance', 'admin'];
        $selectedRole = in_array($role, $allowedRoles, true) ? $role : 'all';

        $users = User::query()
            ->where('role', '!=', 'root')
            ->when($selectedRole !== 'all', fn ($query) => $query->where('role', $selectedRole))
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
            ->get(['id', 'name', 'email', 'username', 'role', 'type', 'code', 'email_verified_at', 'created_at']);

        return [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $selectedRole,
            ],
        ];
    }

    public function createUser(array $payload): void
    {
        User::create([
            ...$payload,
            'type' => $payload['role'] === 'student' ? 'nim' : 'nidn',
        ]);
    }

    public function updateUser(User $user, array $payload): void
    {
        $basePayload = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'username' => $payload['username'],
            'role' => $payload['role'],
            'type' => $payload['role'] === 'student' ? 'nim' : 'nidn',
            'code' => $payload['code'],
        ];

        if (!empty($payload['password'])) {
            $basePayload['password'] = $payload['password'];
        }

        $user->update($basePayload);
    }

    public function deleteUser(User $user): void
    {
        $user->delete();
    }

    public function getApprovalsData(string $search): array
    {
        $pendingUsers = User::query()
            ->where('role', '!=', 'root')
            ->whereNull('email_verified_at')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%')
                        ->orWhere('username', 'like', '%' . $search . '%');
                });
            })
            ->latest('id')
            ->get(['id', 'name', 'email', 'username', 'role', 'code', 'created_at']);

        return [
            'pendingUsers' => $pendingUsers,
            'filters' => [
                'search' => $search,
            ],
        ];
    }

    public function approveUser(User $user): void
    {
        $user->update(['email_verified_at' => now()]);
    }

    public function rejectUser(User $user): void
    {
        $user->delete();
    }

    public function getCategoriesData(): array
    {
        return [
            'fakultas' => Fakultas::query()
                ->with(['jurusans' => fn ($query) => $query->orderBy('name')])
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'slug']),
        ];
    }

    public function createFakultas(array $payload): void
    {
        Fakultas::create([
            'name' => $payload['name'],
            'code' => $payload['code'],
            'slug' => Str::slug($payload['name']),
        ]);
    }

    public function updateFakultas(Fakultas $fakultas, array $payload): void
    {
        $fakultas->update([
            'name' => $payload['name'],
            'code' => $payload['code'],
            'slug' => Str::slug($payload['name']),
        ]);
    }

    public function deleteFakultas(Fakultas $fakultas): void
    {
        $fakultas->delete();
    }

    public function createJurusan(array $payload): void
    {
        Jurusan::create([
            'fakultas_id' => $payload['fakultas_id'],
            'name' => $payload['name'],
            'code' => $payload['code'],
            'slug' => Str::slug($payload['name']),
        ]);
    }

    public function updateJurusan(Jurusan $jurusan, array $payload): void
    {
        $jurusan->update([
            'fakultas_id' => $payload['fakultas_id'],
            'name' => $payload['name'],
            'code' => $payload['code'],
            'slug' => Str::slug($payload['name']),
        ]);
    }

    public function deleteJurusan(Jurusan $jurusan): void
    {
        $jurusan->delete();
    }

    public function getSettings(int $adminId): array
    {
        $defaults = [
            'dashboard_refresh_seconds' => 60,
            'show_pending_first' => true,
            'enable_user_email_notification' => false,
            'default_user_role_filter' => 'all',
        ];

        if (!Schema::hasTable('system_settings')) {
            return $defaults;
        }

        $prefix = $this->settingsPrefix($adminId);
        $stored = SystemSetting::query()
            ->where('key', 'like', $prefix . '%')
            ->pluck('value', 'key');

        return [
            'dashboard_refresh_seconds' => (int) ($stored[$prefix . 'dashboard_refresh_seconds'] ?? $defaults['dashboard_refresh_seconds']),
            'show_pending_first' => ($stored[$prefix . 'show_pending_first'] ?? ($defaults['show_pending_first'] ? '1' : '0')) === '1',
            'enable_user_email_notification' => ($stored[$prefix . 'enable_user_email_notification'] ?? ($defaults['enable_user_email_notification'] ? '1' : '0')) === '1',
            'default_user_role_filter' => (string) ($stored[$prefix . 'default_user_role_filter'] ?? $defaults['default_user_role_filter']),
        ];
    }

    public function updateSettings(int $adminId, array $payload): bool
    {
        if (!Schema::hasTable('system_settings')) {
            return false;
        }

        $prefix = $this->settingsPrefix($adminId);
        foreach ($payload as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $prefix . $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        return true;
    }

    public function getDashboardData(): array
    {
        return Cache::remember('dashboard:admin-academic', now()->addSeconds(30), function () {
            $thisMonth = now()->startOfMonth();

            $pendingApprovals = User::where('role', '!=', 'root')->whereNull('email_verified_at')->count();
            $newUsersMonth = User::where('role', '!=', 'root')->where('created_at', '>=', $thisMonth)->count();

            $usersByRole = [
                'admin' => User::where('role', 'admin')->count(),
                'teacher' => User::where('role', 'teacher')->count(),
                'student' => User::where('role', 'student')->count(),
                'finance' => User::where('role', 'finance')->count(),
            ];

            $recentActivities = User::query()
                ->where('role', '!=', 'root')
                ->latest('updated_at')
                ->limit(8)
                ->get(['id', 'name', 'role', 'created_at', 'updated_at'])
                ->map(function (User $user) {
                    $created = Carbon::parse($user->created_at);
                    $updated = Carbon::parse($user->updated_at);
                    $isCreate = $created->equalTo($updated);

                    return [
                        'id' => $user->id,
                        'action' => $isCreate ? 'create' : 'update',
                        'text' => $isCreate
                            ? 'Akun baru ditambahkan: ' . $user->name . ' (' . $user->role . ')'
                            : 'Data pengguna diperbarui: ' . $user->name . ' (' . $user->role . ')',
                        'time' => $updated->toISOString(),
                    ];
                })
                ->values();

            $coursesCount = 0;
            $activeCoursesCount = 0;
            if (Schema::hasTable('courses')) {
                $coursesCount = Course::count();
                $activeCoursesCount = Course::where('status', 'active')->count();
            }

            return [
                'summary' => [
                    'total_users' => array_sum($usersByRole),
                    'pending_approvals' => $pendingApprovals,
                    'new_users_month' => $newUsersMonth,
                    'fakultas_count' => Fakultas::count(),
                    'jurusan_count' => Jurusan::count(),
                    'courses_count' => $coursesCount,
                    'active_courses_count' => $activeCoursesCount,
                ],
                'role_stats' => $usersByRole,
                'recent_activities' => $recentActivities,
            ];
        });
    }

    private function settingsPrefix(int $adminId): string
    {
        return 'admin_' . $adminId . '_';
    }
}
