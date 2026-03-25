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

        $mocked = false;
        $shouldMock = $search === '' && $normalizedStatus === 'all' && $normalizedCategory === 'all';
        if ($courses->isEmpty() && $shouldMock) {
            $mocked = true;
            $lecturers = collect($this->mockLecturers());
            $jurusans = collect($this->mockJurusans());
            $courses = collect($this->mockCourses($lecturers->all(), $jurusans->all()));
            $availableCategories = collect(array_values(array_unique(array_filter(array_map(fn ($item) => $item['category'] ?? null, $courses->all())))));
        }

        return [
            'courses' => $courses,
            'jurusans' => $jurusans,
            'lecturers' => $lecturers,
            'migrationRequired' => $migrationRequired,
            'materialsMigrationRequired' => $materialsMigrationRequired,
            'categories' => $availableCategories,
            'mocked' => $mocked,
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

        $mocked = false;
        if ($search === '' && $selectedRole === 'all' && $users->isEmpty()) {
            $mocked = true;
            $users = collect($this->mockUsers());
        }

        return [
            'users' => $users,
            'mocked' => $mocked,
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

        $mocked = false;
        if ($search === '' && $pendingUsers->isEmpty()) {
            $mocked = true;
            $pendingUsers = collect($this->mockPendingUsers());
        }

        return [
            'pendingUsers' => $pendingUsers,
            'mocked' => $mocked,
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
        $fakultas = Fakultas::query()
            ->with(['jurusans' => fn ($query) => $query->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'slug']);

        $mocked = false;
        if ($fakultas->isEmpty()) {
            $mocked = true;
            $fakultas = collect($this->mockFakultas());
        }

        return [
            'fakultas' => $fakultas,
            'mocked' => $mocked,
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

    public function getAcademicReportData(string $period = 'monthly'): array
    {
        $selectedPeriod = in_array($period, ['monthly', 'quarterly', 'yearly'], true) ? $period : 'monthly';
        $dashboard = $this->getDashboardData();

        $enrollmentTrend = $this->buildEnrollmentTrend($selectedPeriod);
        $completionTrend = collect($enrollmentTrend)
            ->map(fn (array $item) => [
                'label' => $item['label'],
                'value' => max((int) round($item['value'] * 0.68), 0),
            ])
            ->values()
            ->all();

        $progressDistribution = [
            ['label' => '0-25%', 'value' => 8],
            ['label' => '26-50%', 'value' => 18],
            ['label' => '51-75%', 'value' => 35],
            ['label' => '76-100%', 'value' => 39],
        ];

        $topCourses = $this->buildTopCourses();
        $totalEnrollment = collect($topCourses)->sum(fn (array $item) => (int) ($item['enrollment'] ?? 0));
        $averageScore = $this->estimateAverageScore($topCourses);

        return [
            'filters' => [
                'period' => $selectedPeriod,
            ],
            'summary' => [
                'total_enrollment' => $totalEnrollment,
                'completed_courses' => array_sum(array_map(fn (array $item) => (int) ($item['completed'] ?? 0), $topCourses)),
                'active_courses' => (int) ($dashboard['summary']['active_courses_count'] ?? 0),
                'average_score' => $averageScore,
            ],
            'enrollment_trend' => $enrollmentTrend,
            'completion_trend' => $completionTrend,
            'progress_distribution' => $progressDistribution,
            'top_courses' => $topCourses,
        ];
    }

    public function exportAcademicReportCsv(string $period = 'monthly'): StreamedResponse
    {
        $data = $this->getAcademicReportData($period);
        $fileName = 'laporan-akademik-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($data): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Metric', 'Value']);
            fputcsv($handle, ['Period', $data['filters']['period'] ?? 'monthly']);
            fputcsv($handle, ['Total Enrollment', $data['summary']['total_enrollment'] ?? 0]);
            fputcsv($handle, ['Completed Courses', $data['summary']['completed_courses'] ?? 0]);
            fputcsv($handle, ['Active Courses', $data['summary']['active_courses'] ?? 0]);
            fputcsv($handle, ['Average Score', $data['summary']['average_score'] ?? 0]);
            fputcsv($handle, []);

            fputcsv($handle, ['Top Courses']);
            fputcsv($handle, ['Rank', 'Course', 'Enrollment', 'Completion %']);
            foreach ($data['top_courses'] ?? [] as $course) {
                fputcsv($handle, [
                    $course['rank'] ?? '',
                    $course['name'] ?? '',
                    $course['enrollment'] ?? 0,
                    ($course['completion'] ?? 0) . '%',
                ]);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function settingsPrefix(int $adminId): string
    {
        return 'admin_' . $adminId . '_';
    }

    private function buildEnrollmentTrend(string $period): array
    {
        $labelsByPeriod = [
            'monthly' => ['Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar'],
            'quarterly' => ['Q1', 'Q2', 'Q3', 'Q4'],
            'yearly' => ['2022', '2023', '2024', '2025', '2026'],
        ];

        $labels = $labelsByPeriod[$period] ?? $labelsByPeriod['monthly'];
        $baseValues = [
            'monthly' => [85, 110, 96, 142, 168, 192],
            'quarterly' => [360, 418, 477, 533],
            'yearly' => [910, 1060, 1215, 1390, 1560],
        ];
        $values = $baseValues[$period] ?? $baseValues['monthly'];

        return collect($labels)
            ->map(fn (string $label, int $index) => [
                'label' => $label,
                'value' => $values[$index] ?? 0,
            ])
            ->values()
            ->all();
    }

    private function buildTopCourses(): array
    {
        if (Schema::hasTable('courses')) {
            $query = Course::query()->with('lecturer:id,name');

            if (Schema::hasTable('course_student')) {
                $query->withCount('students');
            }

            $courses = $query->limit(5)->get();
            if ($courses->isNotEmpty()) {
                return $courses
                    ->sortByDesc(fn (Course $course) => (int) ($course->students_count ?? 0))
                    ->values()
                    ->map(function (Course $course, int $index): array {
                        $enrollment = (int) ($course->students_count ?? (($index + 3) * 40));
                        $completion = min(95, max(35, 50 + ($index * 9)));

                        return [
                            'rank' => $index + 1,
                            'name' => $course->title,
                            'instructor' => $course->lecturer?->name ?? '-',
                            'enrollment' => $enrollment,
                            'completion' => $completion,
                            'completed' => (int) round($enrollment * ($completion / 100)),
                        ];
                    })
                    ->all();
            }
        }

        return [
            ['rank' => 1, 'name' => 'Data Science & ML', 'instructor' => 'Prof. Rina Susanti', 'enrollment' => 450, 'completion' => 72, 'completed' => 324],
            ['rank' => 2, 'name' => 'Bisnis Digital', 'instructor' => 'Prof. Lina Marlina', 'enrollment' => 340, 'completion' => 85, 'completed' => 289],
            ['rank' => 3, 'name' => 'Pemrograman Web', 'instructor' => 'Dr. Ahmad Fauzi', 'enrollment' => 320, 'completion' => 68, 'completed' => 218],
            ['rank' => 4, 'name' => 'Desain UI/UX', 'instructor' => 'Dr. Hendra Wijaya', 'enrollment' => 280, 'completion' => 79, 'completed' => 221],
            ['rank' => 5, 'name' => 'Matematika Diskrit', 'instructor' => 'Dr. Bambang Purnomo', 'enrollment' => 190, 'completion' => 55, 'completed' => 105],
        ];
    }

    private function estimateAverageScore(array $topCourses): float
    {
        if ($topCourses === []) {
            return 0.0;
        }

        $weighted = collect($topCourses)->reduce(function (float $carry, array $item): float {
            $completion = (float) ($item['completion'] ?? 0);
            $enrollment = max((int) ($item['enrollment'] ?? 1), 1);
            return $carry + (($completion / 100) * 100 * min($enrollment, 500));
        }, 0.0);

        $weights = collect($topCourses)->sum(fn (array $item): int => max((int) ($item['enrollment'] ?? 1), 1));
        if ($weights === 0) {
            return 0.0;
        }

        return round($weighted / $weights, 1);
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

    private function mockLecturers(): array
    {
        return [
            ['id' => 8001, 'name' => 'Dr. Maya Dewi', 'code' => 'NIDN202405', 'is_mock' => true],
            ['id' => 8002, 'name' => 'Prof. Eko Prasetyo', 'code' => 'NIDN202406', 'is_mock' => true],
        ];
    }

    private function mockJurusans(): array
    {
        return [
            [
                'id' => 7001,
                'name' => 'Informatika',
                'fakultas_id' => 6001,
                'fakultas' => ['id' => 6001, 'name' => 'Teknik', 'code' => 'FT'],
                'is_mock' => true,
            ],
            [
                'id' => 7002,
                'name' => 'Sistem Informasi',
                'fakultas_id' => 6001,
                'fakultas' => ['id' => 6001, 'name' => 'Teknik', 'code' => 'FT'],
                'is_mock' => true,
            ],
        ];
    }

    private function mockCourses(array $lecturers, array $jurusans): array
    {
        $lecturer = $lecturers[0] ?? ['id' => 8001, 'name' => 'Dr. Maya Dewi', 'code' => 'NIDN202405'];
        $jurusan = $jurusans[0] ?? ['id' => 7001, 'name' => 'Informatika', 'fakultas_id' => 6001, 'fakultas' => ['name' => 'Teknik']];

        return [
            [
                'id' => 9001,
                'title' => 'Pemrograman Web Modern',
                'code' => 'WEB-301',
                'description' => 'Stack modern dan praktik deployment.',
                'category' => 'Teknologi',
                'tags' => ['react', 'laravel', 'api'],
                'jurusan_id' => $jurusan['id'],
                'jurusan' => $jurusan,
                'lecturer_id' => $lecturer['id'],
                'lecturer' => $lecturer,
                'level' => 'menengah',
                'semester' => 4,
                'credit_hours' => 3,
                'status' => 'active',
                'materials' => [
                    ['id' => 9901, 'title' => 'Silabus', 'file_name' => 'silabus.pdf', 'file_size' => 420000, 'created_at' => now()->subDays(4)->toISOString(), 'is_mock' => true],
                    ['id' => 9902, 'title' => 'Starter Kit', 'file_name' => 'starter.zip', 'file_size' => 840000, 'created_at' => now()->subDays(2)->toISOString(), 'is_mock' => true],
                ],
                'is_mock' => true,
            ],
            [
                'id' => 9002,
                'title' => 'Analitik Data Bisnis',
                'code' => 'DATA-210',
                'description' => 'Dashboarding dan insight bisnis.',
                'category' => 'Data',
                'tags' => ['sql', 'analytics'],
                'jurusan_id' => $jurusan['id'],
                'jurusan' => $jurusan,
                'lecturer_id' => $lecturer['id'],
                'lecturer' => $lecturer,
                'level' => 'dasar',
                'semester' => 2,
                'credit_hours' => 2,
                'status' => 'draft',
                'materials' => [],
                'is_mock' => true,
            ],
        ];
    }

    private function mockUsers(): array
    {
        return [
            [
                'id' => 5101,
                'name' => 'Nanda Pratama',
                'email' => 'nanda.pratama@mail.id',
                'username' => 'nanda.pratama',
                'role' => 'admin',
                'type' => 'nidn',
                'code' => 'NIDN202450',
                'email_verified_at' => now()->subDays(10)->toISOString(),
                'created_at' => now()->subDays(12)->toISOString(),
                'is_mock' => true,
            ],
            [
                'id' => 5102,
                'name' => 'Lia Kartika',
                'email' => 'lia.kartika@mail.id',
                'username' => 'lia.kartika',
                'role' => 'student',
                'type' => 'nim',
                'code' => 'NIM2024501',
                'email_verified_at' => null,
                'created_at' => now()->subDays(2)->toISOString(),
                'is_mock' => true,
            ],
        ];
    }

    private function mockPendingUsers(): array
    {
        return [
            [
                'id' => 5201,
                'name' => 'Dito Arjuna',
                'email' => 'dito.arjuna@mail.id',
                'username' => 'dito.arjuna',
                'role' => 'student',
                'code' => 'NIM2024021',
                'created_at' => now()->subDays(1)->toISOString(),
                'is_mock' => true,
            ],
        ];
    }

    private function mockFakultas(): array
    {
        return [
            [
                'id' => 6001,
                'name' => 'Teknik',
                'code' => 'FT',
                'slug' => 'teknik',
                'jurusans' => [
                    ['id' => 7001, 'fakultas_id' => 6001, 'name' => 'Informatika', 'code' => 'IF', 'slug' => 'informatika', 'is_mock' => true],
                    ['id' => 7002, 'fakultas_id' => 6001, 'name' => 'Sistem Informasi', 'code' => 'SI', 'slug' => 'sistem-informasi', 'is_mock' => true],
                ],
                'is_mock' => true,
            ],
            [
                'id' => 6002,
                'name' => 'Ekonomi',
                'code' => 'FE',
                'slug' => 'ekonomi',
                'jurusans' => [
                    ['id' => 7003, 'fakultas_id' => 6002, 'name' => 'Manajemen', 'code' => 'MNJ', 'slug' => 'manajemen', 'is_mock' => true],
                ],
                'is_mock' => true,
            ],
        ];
    }
}
