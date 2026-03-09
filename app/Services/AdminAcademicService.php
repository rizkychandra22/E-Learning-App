<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\Fakultas;
use App\Models\Jurusan;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminAcademicService
{
    public function getManageCoursesData(string $search, string $status, string $category = 'all'): array
    {
        $normalizedStatus = in_array($status, ['all', 'draft', 'active', 'archived'], true) ? $status : 'all';
        $normalizedCategory = trim($category) === '' ? 'all' : trim($category);
        $migrationRequired = !Schema::hasTable('courses');
        $materialsMigrationRequired = !Schema::hasTable('course_materials');

        $courses = collect();
        $availableCategories = collect();
        if (!$migrationRequired) {
            $relations = [
                'jurusan:id,name,fakultas_id',
                'jurusan.fakultas:id,name',
                'lecturer:id,name',
            ];

            if (!$materialsMigrationRequired) {
                $relations[] = 'materials:id,course_id,title,file_name,file_path,mime_type,file_size,uploaded_by,created_at';
            }

            $courses = Course::query()
                ->with($relations)
                ->when($normalizedStatus !== 'all', fn ($query) => $query->where('status', $normalizedStatus))
                ->when($normalizedCategory !== 'all', fn ($query) => $query->where('category', $normalizedCategory))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('title', 'like', '%' . $search . '%')
                            ->orWhere('code', 'like', '%' . $search . '%');
                    });
                })
                ->latest('id')
                ->get();

            $availableCategories = Course::query()
                ->whereNotNull('category')
                ->where('category', '!=', '')
                ->select('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->values();
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
            'materialsMigrationRequired' => $materialsMigrationRequired,
            'categories' => $availableCategories,
            'filters' => [
                'search' => $search,
                'status' => $normalizedStatus,
                'category' => $normalizedCategory,
            ],
        ];
    }

    public function canManageCourses(): bool
    {
        return Schema::hasTable('courses');
    }

    public function createCourse(array $payload): void
    {
        Course::create($this->normalizeCoursePayload($payload));
    }

    public function updateCourse(Course $course, array $payload): void
    {
        $course->update($this->normalizeCoursePayload($payload));
    }

    public function deleteCourse(Course $course): void
    {
        if (Schema::hasTable('course_materials')) {
            foreach ($course->materials as $material) {
                if (!empty($material->file_path)) {
                    Storage::disk('public')->delete($material->file_path);
                }
            }
        }

        $course->delete();
    }

    public function canManageCourseMaterials(): bool
    {
        return $this->canManageCourses() && Schema::hasTable('course_materials');
    }

    public function storeCourseMaterial(Course $course, array $payload, int $uploaderId): void
    {
        $file = $payload['file'];
        $storedPath = $file->store('course-materials/' . $course->id, 'public');

        $course->materials()->create([
            'uploaded_by' => $uploaderId,
            'title' => trim((string) $payload['title']),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $storedPath,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize() ?? 0,
        ]);
    }

    public function deleteCourseMaterial(Course $course, CourseMaterial $material): void
    {
        abort_if($material->course_id !== $course->id, 404);

        if (!empty($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();
    }

    public function downloadCourseMaterial(Course $course, CourseMaterial $material): StreamedResponse
    {
        abort_if($material->course_id !== $course->id, 404);

        return Storage::disk('public')->download($material->file_path, $material->file_name);
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
        $user = User::create([
            ...$payload,
            'type' => $payload['role'] === 'student' ? 'nim' : 'nidn',
        ]);

        if (app(SystemSettingService::class)->shouldNotifyOnNewUser()) {
            Log::info('New user created by admin academic.', [
                'email' => $user->email,
                'role' => $user->role,
                'source' => 'admin-academic',
            ]);
        }
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

    private function normalizeCoursePayload(array $payload): array
    {
        $normalizedTags = collect($payload['tags'] ?? [])
            ->map(fn ($tag) => Str::squish((string) $tag))
            ->filter(fn ($tag) => $tag !== '')
            ->unique(fn ($tag) => Str::lower($tag))
            ->take(10)
            ->values()
            ->all();

        $payload['category'] = isset($payload['category']) && trim((string) $payload['category']) !== ''
            ? trim((string) $payload['category'])
            : null;
        $payload['tags'] = $normalizedTags === [] ? null : $normalizedTags;

        return $payload;
    }
}
