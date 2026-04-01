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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
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
            ->with([
                'jurusan:id,name,fakultas_id',
                'jurusan.fakultas:id,name,code',
            ])
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
            ->get(['id', 'name', 'email', 'username', 'role', 'type', 'code', 'jurusan_id', 'email_verified_at', 'created_at']);

        $jurusans = Jurusan::query()
            ->with('fakultas:id,name,code')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'fakultas_id']);

        $mocked = false;

        return [
            'users' => $users,
            'jurusans' => $jurusans,
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
            'jurusan_id' => $this->resolveUserJurusanId($payload),
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
            'jurusan_id' => $this->resolveUserJurusanId($payload),
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

    public function getAcademicReportData(string $period = 'monthly', ?int $courseId = null): array
    {
        $selectedPeriod = $this->normalizePeriod($period);
        $dashboard = $this->getDashboardData();
        $analytics = $this->getLearningAnalyticsData($selectedPeriod, $courseId);

        $enrollmentTrend = $this->buildEnrollmentTrend($selectedPeriod, $courseId);
        $completionTrend = $analytics['completion_trend'] ?? [];
        $topCourses = $this->buildTopCourses($courseId);
        $totalEnrollment = collect($topCourses)->sum(fn (array $item) => (int) ($item['enrollment'] ?? 0));

        return [
            'filters' => [
                'period' => $selectedPeriod,
                'course_id' => $analytics['filters']['course_id'] ?? null,
            ],
            'summary' => [
                'total_enrollment' => $totalEnrollment,
                'completed_courses' => array_sum(array_map(fn (array $item) => (int) ($item['completed'] ?? 0), $topCourses)),
                'active_courses' => (int) ($dashboard['summary']['active_courses_count'] ?? 0),
                'average_score' => (float) ($analytics['summary']['average_score'] ?? 0),
            ],
            'enrollment_trend' => $enrollmentTrend,
            'completion_trend' => $completionTrend,
            'progress_distribution' => $analytics['progress_distribution'] ?? [],
            'top_courses' => $topCourses,
            'available_courses' => $analytics['available_courses'] ?? [],
            'analytics' => $analytics,
        ];
    }

    public function getLearningAnalyticsData(string $period = 'monthly', ?int $courseId = null): array
    {
        $selectedPeriod = $this->normalizePeriod($period);
        $selectedCourseId = $courseId !== null && $courseId > 0 ? $courseId : null;
        $buckets = $this->buildPeriodBuckets($selectedPeriod);
        $availableCourses = $this->buildCourseOptions();
        $courseIds = $this->resolveScopedCourseIds($selectedCourseId);

        if ($courseIds === []) {
            return [
                'filters' => [
                    'period' => $selectedPeriod,
                    'course_id' => null,
                ],
                'summary' => [
                    'total_students' => 0,
                    'total_lessons' => 0,
                    'completion_rate' => 0.0,
                    'engagement_rate' => 0.0,
                    'average_score' => 0.0,
                ],
                'completion_trend' => $this->emptyTrend($buckets),
                'engagement_trend' => $this->emptyTrend($buckets),
                'score_trend' => $this->emptyTrend($buckets),
                'progress_distribution' => [
                    ['label' => '0-25%', 'value' => 0],
                    ['label' => '26-50%', 'value' => 0],
                    ['label' => '51-75%', 'value' => 0],
                    ['label' => '76-100%', 'value' => 0],
                ],
                'available_courses' => $availableCourses,
            ];
        }

        $studentIds = $this->resolveScopedStudentIds($courseIds);
        $lessonIds = $this->resolveScopedLessonIds($courseIds);
        $totalStudents = count($studentIds);
        $totalLessons = count($lessonIds);

        $totalCompletedEntries = empty($lessonIds)
            ? 0
            : (int) DB::table('lesson_progress')
                ->whereIn('lesson_id', $lessonIds)
                ->where('is_completed', true)
                ->count();
        $completionDenominator = max(1, $totalLessons * max(1, $totalStudents));
        $completionRate = round(($totalCompletedEntries / $completionDenominator) * 100, 1);

        $activeStudents = empty($studentIds)
            ? 0
            : (int) DB::table('lesson_progress')
                ->when(!empty($lessonIds), fn ($query) => $query->whereIn('lesson_id', $lessonIds))
                ->whereIn('student_id', $studentIds)
                ->whereNotNull('last_accessed_at')
                ->where('last_accessed_at', '>=', now()->subDays($this->engagementWindowDays($selectedPeriod)))
                ->distinct('student_id')
                ->count('student_id');
        $engagementRate = $totalStudents > 0 ? round(($activeStudents / $totalStudents) * 100, 1) : 0.0;

        $scores = $this->collectScores($courseIds);
        $averageScore = count($scores) > 0 ? round(collect($scores)->avg(), 1) : 0.0;

        return [
            'filters' => [
                'period' => $selectedPeriod,
                'course_id' => $selectedCourseId,
            ],
            'summary' => [
                'total_students' => $totalStudents,
                'total_lessons' => $totalLessons,
                'completion_rate' => $completionRate,
                'engagement_rate' => $engagementRate,
                'average_score' => $averageScore,
            ],
            'completion_trend' => $this->buildCompletionTrend($buckets, $lessonIds, $studentIds),
            'engagement_trend' => $this->buildEngagementTrend($buckets, $lessonIds, $studentIds),
            'score_trend' => $this->buildScoreTrend($buckets, $courseIds),
            'progress_distribution' => $this->buildProgressDistribution($lessonIds, $studentIds),
            'available_courses' => $availableCourses,
        ];
    }

    public function exportAcademicReport(string $period = 'monthly', string $format = 'csv', ?int $courseId = null): SymfonyResponse|StreamedResponse
    {
        $selectedFormat = in_array(Str::lower($format), ['csv', 'pdf'], true) ? Str::lower($format) : 'csv';

        return $selectedFormat === 'pdf'
            ? $this->exportAcademicReportPdf($period, $courseId)
            : $this->exportAcademicReportCsv($period, $courseId);
    }

    public function exportAcademicReportCsv(string $period = 'monthly', ?int $courseId = null): StreamedResponse
    {
        $data = $this->getAcademicReportData($period, $courseId);
        $analytics = $data['analytics'] ?? [];
        $fileName = 'laporan-akademik-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($data, $analytics): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Metric', 'Value']);
            fputcsv($handle, ['Period', $data['filters']['period'] ?? 'monthly']);
            fputcsv($handle, ['Course ID', $data['filters']['course_id'] ?? 'all']);
            fputcsv($handle, ['Total Enrollment', $data['summary']['total_enrollment'] ?? 0]);
            fputcsv($handle, ['Completed Courses', $data['summary']['completed_courses'] ?? 0]);
            fputcsv($handle, ['Active Courses', $data['summary']['active_courses'] ?? 0]);
            fputcsv($handle, ['Average Score', $data['summary']['average_score'] ?? 0]);
            fputcsv($handle, ['Completion Rate', ($analytics['summary']['completion_rate'] ?? 0) . '%']);
            fputcsv($handle, ['Engagement Rate', ($analytics['summary']['engagement_rate'] ?? 0) . '%']);
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

            fputcsv($handle, []);
            fputcsv($handle, ['Learning Analytics Trend']);
            fputcsv($handle, ['Label', 'Completion %', 'Engagement %', 'Score']);
            $completionTrend = $analytics['completion_trend'] ?? [];
            $engagementTrend = $analytics['engagement_trend'] ?? [];
            $scoreTrend = $analytics['score_trend'] ?? [];
            foreach ($completionTrend as $index => $item) {
                fputcsv($handle, [
                    $item['label'] ?? '',
                    $item['value'] ?? 0,
                    $engagementTrend[$index]['value'] ?? 0,
                    $scoreTrend[$index]['value'] ?? 0,
                ]);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function exportAcademicReportPdf(string $period = 'monthly', ?int $courseId = null): SymfonyResponse
    {
        $data = $this->getAcademicReportData($period, $courseId);
        $analytics = $data['analytics'] ?? [];
        $pdfContent = $this->buildBasicPdf([
            'Laporan Akademik',
            'Periode: ' . ($data['filters']['period'] ?? 'monthly'),
            'Filter Course ID: ' . (($data['filters']['course_id'] ?? null) ?: 'all'),
            'Total Enrollment: ' . (string) ($data['summary']['total_enrollment'] ?? 0),
            'Completed Courses: ' . (string) ($data['summary']['completed_courses'] ?? 0),
            'Active Courses: ' . (string) ($data['summary']['active_courses'] ?? 0),
            'Average Score: ' . (string) ($data['summary']['average_score'] ?? 0),
            'Completion Rate: ' . (string) (($analytics['summary']['completion_rate'] ?? 0) . '%'),
            'Engagement Rate: ' . (string) (($analytics['summary']['engagement_rate'] ?? 0) . '%'),
        ]);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="laporan-akademik-' . now()->format('Ymd-His') . '.pdf"',
        ]);
    }

    private function settingsPrefix(int $adminId): string
    {
        return 'admin_' . $adminId . '_';
    }

    private function buildEnrollmentTrend(string $period, ?int $courseId = null): array
    {
        $buckets = $this->buildPeriodBuckets($period);
        $courseIds = $this->resolveScopedCourseIds($courseId !== null && $courseId > 0 ? $courseId : null);

        return $buckets->map(function (array $bucket) use ($courseIds): array {
            if ($courseIds === [] || !Schema::hasTable('course_student')) {
                return ['label' => $bucket['label'], 'value' => 0];
            }

            $value = DB::table('course_student')
                ->whereIn('course_id', $courseIds)
                ->whereBetween(DB::raw('COALESCE(enrolled_at, created_at)'), [$bucket['start'], $bucket['end']])
                ->count();

            return [
                'label' => $bucket['label'],
                'value' => (int) $value,
            ];
        })->all();
    }

    private function buildTopCourses(?int $courseId = null): array
    {
        if (Schema::hasTable('courses')) {
            $query = Course::query()->with('lecturer:id,name');
            if ($courseId !== null && $courseId > 0) {
                $query->where('id', $courseId);
            }

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

    private function normalizePeriod(string $period): string
    {
        return in_array($period, ['monthly', 'quarterly', 'yearly'], true) ? $period : 'monthly';
    }

    private function buildPeriodBuckets(string $period): Collection
    {
        $now = now();

        if ($period === 'quarterly') {
            return collect(range(3, 0))
                ->map(function (int $offset) use ($now): array {
                    $date = $now->copy()->subQuarters($offset - 1)->startOfQuarter();

                    return [
                        'label' => 'Q' . $date->quarter . ' ' . $date->year,
                        'start' => $date->copy()->startOfQuarter(),
                        'end' => $date->copy()->endOfQuarter(),
                    ];
                })
                ->values();
        }

        if ($period === 'yearly') {
            return collect(range(4, 0))
                ->map(function (int $offset) use ($now): array {
                    $date = $now->copy()->subYears($offset - 1)->startOfYear();

                    return [
                        'label' => (string) $date->year,
                        'start' => $date->copy()->startOfYear(),
                        'end' => $date->copy()->endOfYear(),
                    ];
                })
                ->values();
        }

        return collect(range(5, 0))
            ->map(function (int $offset) use ($now): array {
                $date = $now->copy()->subMonths($offset - 1)->startOfMonth();

                return [
                    'label' => $date->format('M Y'),
                    'start' => $date->copy()->startOfMonth(),
                    'end' => $date->copy()->endOfMonth(),
                ];
            })
            ->values();
    }

    private function buildCourseOptions(): array
    {
        if (!Schema::hasTable('courses')) {
            return [];
        }

        return Course::query()
            ->orderBy('title')
            ->get(['id', 'title'])
            ->map(fn (Course $course): array => ['id' => $course->id, 'title' => $course->title])
            ->all();
    }

    private function resolveScopedCourseIds(?int $courseId): array
    {
        if (!Schema::hasTable('courses')) {
            return [];
        }

        return Course::query()
            ->when($courseId !== null && $courseId > 0, fn ($query) => $query->where('id', $courseId))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function resolveScopedStudentIds(array $courseIds): array
    {
        if ($courseIds === [] || !Schema::hasTable('course_student')) {
            return [];
        }

        return DB::table('course_student')
            ->whereIn('course_id', $courseIds)
            ->distinct()
            ->pluck('student_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function resolveScopedLessonIds(array $courseIds): array
    {
        if ($courseIds === [] || !Schema::hasTable('course_modules') || !Schema::hasTable('course_lessons')) {
            return [];
        }

        return DB::table('course_lessons')
            ->join('course_modules', 'course_modules.id', '=', 'course_lessons.course_module_id')
            ->whereIn('course_modules.course_id', $courseIds)
            ->pluck('course_lessons.id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function collectScores(array $courseIds): array
    {
        if ($courseIds === []) {
            return [];
        }

        $assignmentScores = Schema::hasTable('assignment_submissions') && Schema::hasTable('assignments')
            ? DB::table('assignment_submissions')
                ->join('assignments', 'assignments.id', '=', 'assignment_submissions.assignment_id')
                ->whereIn('assignments.course_id', $courseIds)
                ->whereNotNull('assignment_submissions.score')
                ->pluck('assignment_submissions.score')
                ->map(fn ($value) => (float) $value)
                ->all()
            : [];

        $quizScores = Schema::hasTable('quiz_attempts') && Schema::hasTable('quizzes')
            ? DB::table('quiz_attempts')
                ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quiz_id')
                ->whereIn('quizzes.course_id', $courseIds)
                ->whereNotNull('quiz_attempts.score')
                ->pluck('quiz_attempts.score')
                ->map(fn ($value) => (float) $value)
                ->all()
            : [];

        return [...$assignmentScores, ...$quizScores];
    }

    private function buildCompletionTrend(Collection $buckets, array $lessonIds, array $studentIds): array
    {
        return $buckets->map(function (array $bucket) use ($lessonIds, $studentIds): array {
            if ($lessonIds === [] || $studentIds === [] || !Schema::hasTable('lesson_progress')) {
                return ['label' => $bucket['label'], 'value' => 0];
            }

            $query = DB::table('lesson_progress')
                ->whereIn('lesson_id', $lessonIds)
                ->whereIn('student_id', $studentIds)
                ->whereBetween('updated_at', [$bucket['start'], $bucket['end']]);

            $total = (clone $query)->count();
            $completed = (clone $query)->where('is_completed', true)->count();
            $value = $total > 0 ? round(($completed / $total) * 100, 1) : 0;

            return ['label' => $bucket['label'], 'value' => $value];
        })->all();
    }

    private function buildEngagementTrend(Collection $buckets, array $lessonIds, array $studentIds): array
    {
        return $buckets->map(function (array $bucket) use ($lessonIds, $studentIds): array {
            if ($lessonIds === [] || $studentIds === [] || !Schema::hasTable('lesson_progress')) {
                return ['label' => $bucket['label'], 'value' => 0];
            }

            $active = DB::table('lesson_progress')
                ->whereIn('lesson_id', $lessonIds)
                ->whereIn('student_id', $studentIds)
                ->whereBetween('last_accessed_at', [$bucket['start'], $bucket['end']])
                ->distinct('student_id')
                ->count('student_id');
            $value = count($studentIds) > 0 ? round(($active / count($studentIds)) * 100, 1) : 0;

            return ['label' => $bucket['label'], 'value' => $value];
        })->all();
    }

    private function buildScoreTrend(Collection $buckets, array $courseIds): array
    {
        return $buckets->map(function (array $bucket) use ($courseIds): array {
            if ($courseIds === []) {
                return ['label' => $bucket['label'], 'value' => 0];
            }

            $assignmentScores = [];
            if (Schema::hasTable('assignment_submissions') && Schema::hasTable('assignments')) {
                $assignmentScores = DB::table('assignment_submissions')
                    ->join('assignments', 'assignments.id', '=', 'assignment_submissions.assignment_id')
                    ->whereIn('assignments.course_id', $courseIds)
                    ->whereNotNull('assignment_submissions.score')
                    ->whereBetween(DB::raw('COALESCE(assignment_submissions.graded_at, assignment_submissions.updated_at)'), [$bucket['start'], $bucket['end']])
                    ->pluck('assignment_submissions.score')
                    ->map(fn ($score) => (float) $score)
                    ->all();
            }

            $quizScores = [];
            if (Schema::hasTable('quiz_attempts') && Schema::hasTable('quizzes')) {
                $quizScores = DB::table('quiz_attempts')
                    ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quiz_id')
                    ->whereIn('quizzes.course_id', $courseIds)
                    ->whereNotNull('quiz_attempts.score')
                    ->whereBetween(DB::raw('COALESCE(quiz_attempts.graded_at, quiz_attempts.updated_at)'), [$bucket['start'], $bucket['end']])
                    ->pluck('quiz_attempts.score')
                    ->map(fn ($score) => (float) $score)
                    ->all();
            }

            $scores = [...$assignmentScores, ...$quizScores];
            $value = count($scores) > 0 ? round(collect($scores)->avg(), 1) : 0;

            return ['label' => $bucket['label'], 'value' => $value];
        })->all();
    }

    private function buildProgressDistribution(array $lessonIds, array $studentIds): array
    {
        if ($lessonIds === [] || $studentIds === [] || !Schema::hasTable('lesson_progress')) {
            return [
                ['label' => '0-25%', 'value' => 0],
                ['label' => '26-50%', 'value' => 0],
                ['label' => '51-75%', 'value' => 0],
                ['label' => '76-100%', 'value' => 0],
            ];
        }

        $rows = DB::table('lesson_progress')
            ->whereIn('lesson_id', $lessonIds)
            ->whereIn('student_id', $studentIds)
            ->pluck('progress_percent')
            ->map(fn ($value) => (int) $value);

        $total = max(1, $rows->count());
        $bands = [
            '0-25%' => $rows->filter(fn ($value) => $value <= 25)->count(),
            '26-50%' => $rows->filter(fn ($value) => $value >= 26 && $value <= 50)->count(),
            '51-75%' => $rows->filter(fn ($value) => $value >= 51 && $value <= 75)->count(),
            '76-100%' => $rows->filter(fn ($value) => $value >= 76)->count(),
        ];

        return collect($bands)
            ->map(fn (int $count, string $label): array => [
                'label' => $label,
                'value' => (int) round(($count / $total) * 100),
            ])
            ->values()
            ->all();
    }

    private function emptyTrend(Collection $buckets): array
    {
        return $buckets
            ->map(fn (array $bucket): array => ['label' => $bucket['label'], 'value' => 0])
            ->all();
    }

    private function engagementWindowDays(string $period): int
    {
        return match ($period) {
            'quarterly' => 90,
            'yearly' => 365,
            default => 30,
        };
    }

    private function buildBasicPdf(array $lines): string
    {
        $escape = static fn (string $text): string => str_replace(
            ['\\', '(', ')'],
            ['\\\\', '\\(', '\\)'],
            $text
        );

        $streamLines = [];
        $initialY = 780;
        foreach ($lines as $index => $line) {
            $y = $initialY - ($index * 18);
            $streamLines[] = 'BT /F1 12 Tf 40 ' . $y . ' Td (' . $escape($line) . ') Tj ET';
        }
        $stream = implode("\n", $streamLines);

        $objects = [];
        $objects[] = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj";
        $objects[] = "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj";
        $objects[] = "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj";
        $objects[] = "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj";
        $objects[] = "5 0 obj << /Length " . strlen($stream) . " >> stream\n" . $stream . "\nendstream endobj";

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object . "\n";
        }

        $xrefPosition = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        $pdf .= "trailer << /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n" . $xrefPosition . "\n%%EOF";

        return $pdf;
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

    private function resolveUserJurusanId(array $payload): ?int
    {
        $role = (string) ($payload['role'] ?? '');
        if (!in_array($role, ['teacher', 'student'], true)) {
            return null;
        }

        if (!isset($payload['jurusan_id']) || $payload['jurusan_id'] === null || $payload['jurusan_id'] === '') {
            return null;
        }

        return (int) $payload['jurusan_id'];
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
