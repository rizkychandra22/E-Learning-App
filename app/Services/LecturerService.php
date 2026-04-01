<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseMaterial;
use App\Models\CourseModule;
use App\Models\Discussion;
use App\Models\LessonProgress;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\StudentNote;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LecturerService
{
    public function __construct(
        private readonly NotificationService $notificationService
    ) {
    }

    public function getMyCoursesData(int $lecturerId, string $search, string $status, string $category = 'all'): array
    {
        $normalizedStatus = in_array($status, ['all', 'draft', 'active', 'archived'], true) ? $status : 'all';
        $normalizedCategory = trim($category) === '' ? 'all' : trim($category);
        $migrationRequired = !Schema::hasTable('courses');
        $materialsAvailable = Schema::hasTable('course_materials');

        $courses = collect();
        $availableCategories = collect();
        if (!$migrationRequired) {
            $coursesQuery = Course::query()
                ->where('lecturer_id', $lecturerId);

            if ($materialsAvailable) {
                $coursesQuery->withCount('materials');
            }

            $courses = $coursesQuery
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

            if (!$materialsAvailable) {
                $courses->each(fn (Course $course) => $course->setAttribute('materials_count', 0));
            }

            $availableCategories = Course::query()
                ->where('lecturer_id', $lecturerId)
                ->whereNotNull('category')
                ->where('category', '!=', '')
                ->select('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->values();
        }

        $jurusans = \App\Models\Jurusan::query()
            ->with('fakultas:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'fakultas_id']);

        $mocked = false;

        return [
            'courses' => $courses,
            'jurusans' => $jurusans,
            'categories' => $availableCategories,
            'migrationRequired' => $migrationRequired,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
                'status' => $normalizedStatus,
                'category' => $normalizedCategory,
            ],
        ];
    }

    public function canManageLearningModules(): bool
    {
        return Schema::hasTable('course_modules') && Schema::hasTable('course_lessons');
    }

    public function canTrackLessonProgress(): bool
    {
        return $this->canManageLearningModules() && Schema::hasTable('lesson_progress');
    }

    public function getLearningModulesData(int $actorId, string $actorRole = 'teacher', ?int $courseId = null): array
    {
        $migrationRequired = !$this->canManageLearningModules();
        $courses = Schema::hasTable('courses') ? $this->getCoursesForLearningOperator($actorId, $actorRole) : collect();
        $selectedCourse = null;
        $modules = collect();

        if (!$migrationRequired && $courseId) {
            $selectedCourse = $this->findCourseForLearningOperator($actorId, $actorRole, $courseId);
            $modules = $selectedCourse->modules()
                ->with(['lessons' => fn ($query) => $query->orderBy('sort_order')])
                ->get();
        }

        return [
            'courses' => $courses,
            'selectedCourseId' => $courseId,
            'selectedCourse' => $selectedCourse,
            'modules' => $modules,
            'migrationRequired' => $migrationRequired,
        ];
    }

    public function createModule(int $actorId, string $actorRole, array $payload): void
    {
        $course = $this->findCourseForLearningOperator($actorId, $actorRole, (int) $payload['course_id']);

        $course->modules()->create([
            'title' => trim((string) $payload['title']),
            'description' => $payload['description'] ?? null,
            'sort_order' => (int) ($payload['sort_order'] ?? ($course->modules()->count() + 1)),
        ]);
    }

    public function updateModule(int $actorId, string $actorRole, CourseModule $module, array $payload): void
    {
        $this->ensureModuleOwnerForLearningOperator($actorId, $actorRole, $module);

        $module->update([
            'title' => trim((string) $payload['title']),
            'description' => $payload['description'] ?? null,
            'sort_order' => (int) ($payload['sort_order'] ?? $module->sort_order),
        ]);
    }

    public function deleteModule(int $actorId, string $actorRole, CourseModule $module): void
    {
        $this->ensureModuleOwnerForLearningOperator($actorId, $actorRole, $module);
        $module->delete();
    }

    public function createLesson(int $actorId, string $actorRole, array $payload): void
    {
        $module = $this->findModuleForLearningOperator($actorId, $actorRole, (int) $payload['course_module_id']);

        $module->lessons()->create([
            'title' => trim((string) $payload['title']),
            'summary' => $payload['summary'] ?? null,
            'content_type' => $payload['content_type'],
            'video_url' => $payload['content_type'] === 'video' ? ($payload['video_url'] ?? null) : null,
            'content' => $payload['content'] ?? null,
            'duration_minutes' => (int) ($payload['duration_minutes'] ?? 0),
            'sort_order' => (int) ($payload['sort_order'] ?? ($module->lessons()->count() + 1)),
        ]);
    }

    public function updateLesson(int $actorId, string $actorRole, CourseLesson $lesson, array $payload): void
    {
        $this->ensureLessonOwnerForLearningOperator($actorId, $actorRole, $lesson);

        $lesson->update([
            'title' => trim((string) $payload['title']),
            'summary' => $payload['summary'] ?? null,
            'content_type' => $payload['content_type'],
            'video_url' => $payload['content_type'] === 'video' ? ($payload['video_url'] ?? null) : null,
            'content' => $payload['content'] ?? null,
            'duration_minutes' => (int) ($payload['duration_minutes'] ?? 0),
            'sort_order' => (int) ($payload['sort_order'] ?? $lesson->sort_order),
        ]);
    }

    public function deleteLesson(int $actorId, string $actorRole, CourseLesson $lesson): void
    {
        $this->ensureLessonOwnerForLearningOperator($actorId, $actorRole, $lesson);
        $lesson->delete();
    }

    public function getStudentLearningDashboard(int $studentId): array
    {
        $migrationRequired = !Schema::hasTable('course_student');
        if ($migrationRequired) {
            return [
                'courses' => collect(),
                'available_courses' => collect(),
                'summary' => [
                    'active_courses' => 0,
                    'completed_lessons' => 0,
                    'average_progress' => 0,
                ],
                'migrationRequired' => true,
                'selfEnrollmentAvailable' => false,
            ];
        }

        $student = User::query()->findOrFail($studentId);

        $courses = $student
            ->enrolledCourses()
            ->with(['lecturer:id,name', 'modules.lessons.progress' => fn ($query) => $query->where('student_id', $studentId)])
            ->orderBy('title')
            ->get();

        $mappedCourses = $courses->map(fn (Course $course) => $this->mapStudentCourse($course, $studentId));
        $averageProgress = (int) round($mappedCourses->avg('progress_percent') ?? 0);
        $completedLessons = (int) $mappedCourses->sum('completed_lessons');

        $selfEnrollmentAvailable = Schema::hasTable('courses')
            && Schema::hasColumn('courses', 'allow_self_enrollment')
            && Schema::hasColumn('courses', 'enrollment_key');
        $availableCourses = collect();

        if ($selfEnrollmentAvailable) {
            $enrolledCourseIds = $courses->pluck('id')->all();
            $availableCourses = Course::query()
                ->where('status', 'active')
                ->where('allow_self_enrollment', true)
                ->when(!empty($student->jurusan_id), fn ($query) => $query->where('jurusan_id', (int) $student->jurusan_id))
                ->whereNotIn('id', $enrolledCourseIds)
                ->with('lecturer:id,name')
                ->orderBy('title')
                ->get(['id', 'title', 'code', 'description', 'lecturer_id', 'enrollment_key'])
                ->map(fn (Course $course) => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'code' => $course->code,
                    'description' => $course->description,
                    'lecturer' => $course->lecturer ? ['id' => $course->lecturer->id, 'name' => $course->lecturer->name] : null,
                    'requires_key' => !empty($course->enrollment_key),
                ]);
        }

        return [
            'courses' => $mappedCourses,
            'available_courses' => $availableCourses,
            'summary' => [
                'active_courses' => $mappedCourses->count(),
                'completed_lessons' => $completedLessons,
                'average_progress' => $averageProgress,
            ],
            'migrationRequired' => false,
            'selfEnrollmentAvailable' => $selfEnrollmentAvailable,
        ];
    }

    public function getStudentHomeData(int $studentId): array
    {
        $learning = $this->getStudentLearningDashboard($studentId);
        $assignmentsData = $this->getStudentAssignmentsData($studentId);
        $quizzesData = $this->getStudentQuizzesData($studentId);
        $gradesData = $this->getStudentGradesData($studentId);

        $courses = collect($learning['courses'] ?? []);
        $assignments = collect($assignmentsData['assignments'] ?? []);
        $quizzes = collect($quizzesData['quizzes'] ?? []);
        $records = collect($gradesData['records'] ?? []);

        $now = now();

        $upcomingAssignments = $assignments
            ->filter(fn ($item) => ($item['submission']['status'] ?? null) !== 'graded' && !empty($item['due_at']))
            ->map(fn ($item) => [
                'type' => 'assignment',
                'title' => $item['title'] ?? '-',
                'course' => $item['course']['title'] ?? '-',
                'schedule_at' => $item['due_at'],
                'status' => $item['submission']['status'] ?? 'pending',
            ]);

        $upcomingQuizzes = $quizzes
            ->filter(fn ($item) => in_array($item['status'] ?? 'draft', ['active', 'draft'], true) && !empty($item['scheduled_at']))
            ->map(fn ($item) => [
                'type' => 'quiz',
                'title' => $item['title'] ?? '-',
                'course' => $item['course']['title'] ?? '-',
                'schedule_at' => $item['scheduled_at'],
                'status' => $item['attempt']['status'] ?? 'pending',
            ]);

        $upcomingItems = $upcomingAssignments
            ->concat($upcomingQuizzes)
            ->filter(function ($item) use ($now) {
                $date = isset($item['schedule_at']) ? strtotime((string) $item['schedule_at']) : false;
                return $date !== false && $date >= $now->timestamp;
            })
            ->sortBy('schedule_at')
            ->take(6)
            ->values();

        $latestResults = $records
            ->sortByDesc('graded_at')
            ->take(6)
            ->map(fn ($record) => [
                'type' => $record['type'] ?? '-',
                'title' => $record['title'] ?? '-',
                'course' => $record['course']['title'] ?? '-',
                'score' => (int) ($record['score'] ?? 0),
                'max_score' => (int) ($record['max_score'] ?? 100),
                'graded_at' => $record['graded_at'] ?? null,
            ])
            ->values();

        $recentActivities = collect()
            ->concat(
                $assignments
                    ->filter(fn ($item) => !empty($item['submission']['submitted_at']))
                    ->map(fn ($item) => [
                        'type' => 'assignment',
                        'title' => $item['title'] ?? '-',
                        'text' => 'Tugas dikumpulkan',
                        'time' => $item['submission']['submitted_at'],
                    ])
            )
            ->concat(
                $quizzes
                    ->filter(fn ($item) => !empty($item['attempt']['submitted_at']))
                    ->map(fn ($item) => [
                        'type' => 'quiz',
                        'title' => $item['title'] ?? '-',
                        'text' => 'Kuis dikirim',
                        'time' => $item['attempt']['submitted_at'],
                    ])
            )
            ->concat(
                $latestResults->map(fn ($item) => [
                    'type' => $item['type'],
                    'title' => $item['title'],
                    'text' => "Nilai {$item['score']}/{$item['max_score']}",
                    'time' => $item['graded_at'],
                ])
            )
            ->filter(fn ($item) => !empty($item['time']))
            ->sortByDesc('time')
            ->take(8)
            ->values();

        $todaySchedule = $upcomingItems
            ->filter(function ($item) use ($now) {
                $date = isset($item['schedule_at']) ? strtotime((string) $item['schedule_at']) : false;
                return $date !== false && date('Y-m-d', $date) === $now->toDateString();
            })
            ->count();

        return [
            'stats' => [
                'active_courses' => (int) ($learning['summary']['active_courses'] ?? 0),
                'completed_assignments' => (int) ($assignmentsData['summary']['submitted_count'] ?? 0),
                'graded_items' => (int) ($gradesData['summary']['graded_count'] ?? 0),
                'today_schedule' => (int) $todaySchedule,
                'average_progress' => (int) ($learning['summary']['average_progress'] ?? 0),
            ],
            'courses' => $courses->take(4)->values(),
            'upcoming_items' => $upcomingItems,
            'recent_activities' => $recentActivities,
            'latest_results' => $latestResults,
            'migrationRequired' => [
                'learning' => (bool) ($learning['migrationRequired'] ?? false),
                'assignments' => (bool) ($assignmentsData['migrationRequired']['assignments'] ?? false),
                'submissions' => (bool) ($assignmentsData['migrationRequired']['submissions'] ?? false),
                'quizzes' => (bool) ($quizzesData['migrationRequired']['quizzes'] ?? false),
                'attempts' => (bool) ($quizzesData['migrationRequired']['attempts'] ?? false),
                'grades' => (bool) ($gradesData['migrationRequired'] ?? false),
            ],
        ];
    }

    public function getStudentLearningPlayer(int $studentId, int $courseId, ?int $requestedLessonId = null): array
    {
        $course = Course::query()
            ->whereHas('students', fn ($query) => $query->where('users.id', $studentId))
            ->with([
                'lecturer:id,name',
                'modules.lessons.progress' => fn ($query) => $query->where('student_id', $studentId),
            ])
            ->findOrFail($courseId);

        $mappedCourse = $this->mapStudentCourse($course, $studentId, true);
        $lessons = collect($mappedCourse['modules'])->flatMap(fn ($module) => $module['lessons'])->values();
        $activeLesson = $requestedLessonId ? $lessons->firstWhere('id', $requestedLessonId) : null;

        if (!$activeLesson) {
            $activeLesson = $lessons
                ->filter(fn ($lesson) => !empty($lesson['last_accessed_at']))
                ->sortByDesc('last_accessed_at')
                ->first();
        }

        if (!$activeLesson) {
            $activeLesson = $lessons->firstWhere('is_completed', false) ?? $lessons->first();
        }

        return [
            'course' => $mappedCourse,
            'activeLesson' => $activeLesson,
        ];
    }

    public function updateLessonProgress(int $studentId, CourseLesson $lesson, int $progressPercent): void
    {
        $lesson->loadMissing('module.course.students');

        abort_if(!$this->canTrackLessonProgress(), 404);
        abort_if(!$lesson->module || !$lesson->module->course, 404);
        abort_if(!$lesson->module->course->students()->where('users.id', $studentId)->exists(), 403);

        LessonProgress::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'student_id' => $studentId,
            ],
            [
                'progress_percent' => $progressPercent,
                'is_completed' => $progressPercent >= 100,
                'completed_at' => $progressPercent >= 100 ? now() : null,
                'last_accessed_at' => now(),
            ]
        );
    }

    public function canManageAssessmentSubmissions(): bool
    {
        return Schema::hasTable('assignment_submissions') && Schema::hasTable('quiz_attempts');
    }

    public function getStudentAssignmentsData(int $studentId): array
    {
        $migrationRequired = !Schema::hasTable('assignments') || !Schema::hasTable('course_student');
        $submissionMigrationRequired = !Schema::hasTable('assignment_submissions');

        if ($migrationRequired) {
            return [
                'assignments' => collect(),
                'summary' => [
                    'active_count' => 0,
                    'submitted_count' => 0,
                    'graded_count' => 0,
                ],
                'migrationRequired' => [
                    'assignments' => true,
                    'submissions' => $submissionMigrationRequired,
                ],
            ];
        }

        $assignments = Assignment::query()
            ->where('status', '!=', 'draft')
            ->whereHas('course.students', fn ($query) => $query->where('users.id', $studentId))
            ->with([
                'course:id,title,code',
                'submissions' => fn ($query) => $query->where('student_id', $studentId),
            ])
            ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_at')
            ->get()
            ->map(function (Assignment $assignment) {
                $submission = $assignment->submissions->first();

                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'description' => $assignment->description,
                    'status' => $assignment->status,
                    'due_at' => $assignment->due_at?->toISOString(),
                    'max_score' => $assignment->max_score,
                    'course' => $assignment->course ? [
                        'id' => $assignment->course->id,
                        'title' => $assignment->course->title,
                        'code' => $assignment->course->code,
                    ] : null,
                    'submission' => $submission ? [
                        'id' => $submission->id,
                        'status' => $submission->status,
                        'score' => $submission->score,
                        'feedback' => $submission->feedback,
                        'submission_text' => $submission->submission_text,
                        'attachment_url' => $this->resolveSubmissionAttachmentUrl($submission->attachment_url),
                        'attachment_name' => $submission->attachment_name,
                        'attachment_mime' => $submission->attachment_mime,
                        'attachment_size' => $submission->attachment_size,
                        'submitted_at' => $submission->submitted_at?->toISOString(),
                        'graded_at' => $submission->graded_at?->toISOString(),
                    ] : null,
                ];
            })
            ->values();

        return [
            'assignments' => $assignments,
            'summary' => [
                'active_count' => $assignments->count(),
                'submitted_count' => $assignments->filter(fn ($item) => in_array($item['submission']['status'] ?? null, ['submitted', 'graded'], true))->count(),
                'graded_count' => $assignments->filter(fn ($item) => ($item['submission']['status'] ?? null) === 'graded')->count(),
            ],
            'migrationRequired' => [
                'assignments' => false,
                'submissions' => $submissionMigrationRequired,
            ],
        ];
    }

    public function getStudentAssignmentDetailData(int $studentId, int $assignmentId): array
    {
        $assignment = Assignment::query()
            ->with([
                'course.students:id',
                'lecturer:id,name',
                'submissions' => fn ($query) => $query->where('student_id', $studentId),
            ])
            ->findOrFail($assignmentId);

        $this->ensureStudentCanAccessAssignment($studentId, $assignment);
        $submission = $assignment->submissions->first();

        return [
            'assignment' => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'status' => $assignment->status,
                'due_at' => $assignment->due_at?->toISOString(),
                'max_score' => $assignment->max_score,
                'course' => $assignment->course ? [
                    'id' => $assignment->course->id,
                    'title' => $assignment->course->title,
                    'code' => $assignment->course->code,
                ] : null,
                'lecturer' => $assignment->lecturer ? [
                    'id' => $assignment->lecturer->id,
                    'name' => $assignment->lecturer->name,
                ] : null,
                'submission' => $submission ? [
                    'id' => $submission->id,
                    'status' => $submission->status,
                    'score' => $submission->score,
                    'feedback' => $submission->feedback,
                    'submission_text' => $submission->submission_text,
                    'attachment_url' => $this->resolveSubmissionAttachmentUrl($submission->attachment_url),
                    'attachment_name' => $submission->attachment_name,
                    'attachment_mime' => $submission->attachment_mime,
                    'attachment_size' => $submission->attachment_size,
                    'submitted_at' => $submission->submitted_at?->toISOString(),
                    'graded_at' => $submission->graded_at?->toISOString(),
                ] : null,
            ],
            'migrationRequired' => [
                'submissions' => !Schema::hasTable('assignment_submissions'),
            ],
        ];
    }

    public function submitAssignment(int $studentId, Assignment $assignment, array $payload): void
    {
        $this->ensureStudentCanAccessAssignment($studentId, $assignment);
        abort_if($assignment->status !== 'active', 422, 'Tugas belum dapat dikumpulkan.');
        abort_if(!Schema::hasTable('assignment_submissions'), 404);

        $attachmentUrl = isset($payload['attachment_url']) && trim((string) $payload['attachment_url']) !== ''
            ? trim((string) $payload['attachment_url'])
            : null;
        $attachmentName = null;
        $attachmentMime = null;
        $attachmentSize = null;

        if (isset($payload['attachment_file']) && $payload['attachment_file'] !== null) {
            $file = $payload['attachment_file'];
            $storedPath = $file->store('assignment-submissions/' . $assignment->id . '/' . $studentId, 'public');
            $attachmentUrl = $storedPath;
            $attachmentName = $file->getClientOriginalName();
            $attachmentMime = $file->getClientMimeType();
            $attachmentSize = $file->getSize() ?? 0;
        }

        AssignmentSubmission::updateOrCreate(
            [
                'assignment_id' => $assignment->id,
                'student_id' => $studentId,
            ],
            [
                'submission_text' => trim((string) ($payload['submission_text'] ?? '')),
                'attachment_url' => $attachmentUrl,
                'attachment_name' => $attachmentName,
                'attachment_mime' => $attachmentMime,
                'attachment_size' => $attachmentSize,
                'status' => 'submitted',
                'submitted_at' => now(),
                'score' => null,
                'feedback' => null,
                'graded_at' => null,
            ]
        );
    }

    public function getStudentQuizzesData(int $studentId): array
    {
        $migrationRequired = !Schema::hasTable('quizzes') || !Schema::hasTable('course_student') || !Schema::hasTable('questions');
        $attemptMigrationRequired = !Schema::hasTable('quiz_attempts');

        if ($migrationRequired) {
            return [
                'quizzes' => collect(),
                'summary' => [
                    'active_count' => 0,
                    'submitted_count' => 0,
                    'graded_count' => 0,
                ],
                'migrationRequired' => [
                    'quizzes' => true,
                    'attempts' => $attemptMigrationRequired,
                ],
            ];
        }

        $quizzes = Quiz::query()
            ->where('status', '!=', 'draft')
            ->whereHas('course.students', fn ($query) => $query->where('users.id', $studentId))
            ->with([
                'course:id,title,code',
                'questions:id,quiz_id,question_text,question_type,options,correct_answer,points,sort_order',
                'attempts' => fn ($query) => $query->where('student_id', $studentId),
            ])
            ->orderByRaw('CASE WHEN scheduled_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('scheduled_at')
            ->get()
            ->map(function (Quiz $quiz) {
                $attempt = $quiz->attempts->first();

                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'status' => $quiz->status,
                    'duration_minutes' => $quiz->duration_minutes,
                    'total_questions' => $quiz->total_questions,
                    'scheduled_at' => $quiz->scheduled_at?->toISOString(),
                    'questions' => $quiz->questions->map(fn (Question $question) => [
                        'id' => $question->id,
                        'question_text' => $question->question_text,
                        'question_type' => $question->question_type,
                        'options' => $question->question_type === 'objective' ? array_values(array_filter($question->options ?? [], fn ($value) => trim((string) $value) !== '')) : [],
                        'points' => $question->points,
                        'sort_order' => $question->sort_order,
                    ])->values(),
                    'course' => $quiz->course ? [
                        'id' => $quiz->course->id,
                        'title' => $quiz->course->title,
                        'code' => $quiz->course->code,
                    ] : null,
                    'attempt' => $attempt ? [
                        'id' => $attempt->id,
                        'status' => $attempt->status,
                        'score' => $attempt->score,
                        'feedback' => $attempt->feedback,
                        'answers' => $this->normalizeAttemptAnswers($attempt->answers),
                        'submitted_at' => $attempt->submitted_at?->toISOString(),
                        'graded_at' => $attempt->graded_at?->toISOString(),
                    ] : null,
                ];
            })
            ->values();

        return [
            'quizzes' => $quizzes,
            'summary' => [
                'active_count' => $quizzes->count(),
                'submitted_count' => $quizzes->filter(fn ($item) => in_array($item['attempt']['status'] ?? null, ['submitted', 'graded'], true))->count(),
                'graded_count' => $quizzes->filter(fn ($item) => ($item['attempt']['status'] ?? null) === 'graded')->count(),
            ],
            'migrationRequired' => [
                'quizzes' => false,
                'attempts' => $attemptMigrationRequired,
            ],
        ];
    }

    public function submitQuiz(int $studentId, Quiz $quiz, array $payload): void
    {
        $this->ensureStudentCanAccessQuiz($studentId, $quiz);
        abort_if($quiz->status !== 'active', 422, 'Kuis belum dapat dikerjakan.');
        abort_if(!Schema::hasTable('quiz_attempts'), 404);

        $rawAnswers = $payload['answers'] ?? null;
        $normalizedAnswers = [];
        if (is_array($rawAnswers)) {
            $normalizedAnswers = collect($rawAnswers)
                ->mapWithKeys(function ($value, $key) {
                    $answer = is_string($value) ? trim($value) : (string) $value;
                    return [(string) $key => $answer];
                })
                ->filter(fn ($value) => $value !== '')
                ->all();
        } else {
            $legacy = trim((string) $rawAnswers);
            if ($legacy !== '') {
                $normalizedAnswers = ['legacy_text' => $legacy];
            }
        }
        abort_if($normalizedAnswers === [], 422, 'Jawaban kuis tidak boleh kosong.');

        QuizAttempt::updateOrCreate(
            [
                'quiz_id' => $quiz->id,
                'student_id' => $studentId,
            ],
            [
                'answers' => $normalizedAnswers,
                'status' => 'submitted',
                'started_at' => now(),
                'submitted_at' => now(),
                'score' => null,
                'feedback' => null,
                'graded_at' => null,
            ]
        );
    }

    public function getStudentGradesData(int $studentId): array
    {
        $migrationRequired = !Schema::hasTable('assignment_submissions') || !Schema::hasTable('quiz_attempts');
        if ($migrationRequired) {
            return [
                'records' => collect(),
                'summary' => [
                    'average' => 0,
                    'graded_count' => 0,
                    'assignment_avg' => 0,
                    'quiz_avg' => 0,
                ],
                'migrationRequired' => true,
            ];
        }

        $assignmentRecords = AssignmentSubmission::query()
            ->where('student_id', $studentId)
            ->where('status', 'graded')
            ->whereNotNull('score')
            ->with('assignment.course:id,title,code')
            ->get()
            ->map(function (AssignmentSubmission $submission) {
                $assignment = $submission->assignment;
                $course = $assignment?->course;

                return [
                    'type' => 'assignment',
                    'title' => $assignment?->title ?? '-',
                    'course' => $course ? ['id' => $course->id, 'title' => $course->title, 'code' => $course->code] : null,
                    'score' => $submission->score,
                    'max_score' => $assignment?->max_score ?? 100,
                    'graded_at' => $submission->graded_at?->toISOString(),
                    'feedback' => $submission->feedback,
                ];
            });

        $quizRecords = QuizAttempt::query()
            ->where('student_id', $studentId)
            ->where('status', 'graded')
            ->whereNotNull('score')
            ->with('quiz.course:id,title,code')
            ->get()
            ->map(function (QuizAttempt $attempt) {
                $quiz = $attempt->quiz;
                $course = $quiz?->course;

                return [
                    'type' => 'quiz',
                    'title' => $quiz?->title ?? '-',
                    'course' => $course ? ['id' => $course->id, 'title' => $course->title, 'code' => $course->code] : null,
                    'score' => $attempt->score,
                    'max_score' => 100,
                    'graded_at' => $attempt->graded_at?->toISOString(),
                    'feedback' => $attempt->feedback,
                ];
            });

        $records = $assignmentRecords
            ->concat($quizRecords)
            ->sortByDesc(fn ($item) => $item['graded_at'] ?? '')
            ->values();

        $assignmentAvg = (int) round($assignmentRecords->avg('score') ?? 0);
        $quizAvg = (int) round($quizRecords->avg('score') ?? 0);
        $overallAvg = (int) round($records->avg('score') ?? 0);

        return [
            'records' => $records,
            'summary' => [
                'average' => $overallAvg,
                'graded_count' => $records->count(),
                'assignment_avg' => $assignmentAvg,
                'quiz_avg' => $quizAvg,
            ],
            'migrationRequired' => false,
        ];
    }

    public function canManageCourses(): bool
    {
        return Schema::hasTable('courses');
    }

    public function createCourseForLecturer(int $lecturerId, array $payload): void
    {
        $lecturerJurusanId = $this->resolveLecturerJurusanId($lecturerId);

        Course::create($this->normalizeCoursePayload([
            ...$payload,
            'lecturer_id' => $lecturerId,
            'jurusan_id' => $lecturerJurusanId,
        ]));
    }

    public function updateCourseForLecturer(int $lecturerId, Course $course, array $payload): void
    {
        $this->ensureCourseOwner($lecturerId, $course);
        $lecturerJurusanId = $this->resolveLecturerJurusanId($lecturerId);

        $course->update($this->normalizeCoursePayload([
            ...$payload,
            'lecturer_id' => $lecturerId,
            'jurusan_id' => $lecturerJurusanId,
        ]));
    }

    public function deleteCourseForLecturer(int $lecturerId, Course $course): void
    {
        $this->ensureCourseOwner($lecturerId, $course);

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

    public function getMaterialsData(int $lecturerId, string $search, string $courseId): array
    {
        $migrationRequired = !Schema::hasTable('courses') || !Schema::hasTable('course_materials');
        $selectedCourseId = trim($courseId) !== '' ? (int) $courseId : null;

        $materials = collect();
        $courses = collect();
        if (!$migrationRequired) {
            $materials = CourseMaterial::query()
                ->whereHas('course', fn ($query) => $query->where('lecturer_id', $lecturerId))
                ->with(['course:id,title,code,lecturer_id', 'uploader:id,name'])
                ->when($selectedCourseId, fn ($query) => $query->where('course_id', $selectedCourseId))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('title', 'like', '%' . $search . '%')
                            ->orWhere('file_name', 'like', '%' . $search . '%');
                    });
                })
                ->latest('id')
                ->get();

            $courses = Course::query()
                ->where('lecturer_id', $lecturerId)
                ->orderBy('title')
                ->get(['id', 'title', 'code']);
        }

        $mocked = false;

        return [
            'materials' => $materials,
            'courses' => $courses,
            'migrationRequired' => $migrationRequired,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
                'course' => $selectedCourseId,
            ],
        ];
    }

    public function storeMaterialForLecturer(int $lecturerId, array $payload): void
    {
        $course = $this->findLecturerCourse($lecturerId, (int) $payload['course_id']);

        $file = $payload['file'];
        $storedPath = $file->store('course-materials/' . $course->id, 'public');

        $course->materials()->create([
            'uploaded_by' => $lecturerId,
            'title' => trim((string) $payload['title']),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $storedPath,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize() ?? 0,
        ]);
    }

    public function deleteMaterialForLecturer(int $lecturerId, CourseMaterial $material): void
    {
        $this->ensureMaterialOwner($lecturerId, $material);

        if (!empty($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();
    }

    public function downloadMaterialForLecturer(int $lecturerId, CourseMaterial $material): StreamedResponse
    {
        $this->ensureMaterialOwner($lecturerId, $material);

        return Storage::disk('public')->download($material->file_path, $material->file_name);
    }

    public function getAssignmentsData(int $lecturerId, string $search, string $status, string $courseId): array
    {
        $normalizedStatus = in_array($status, ['all', 'draft', 'active', 'closed'], true) ? $status : 'all';
        $selectedCourseId = trim($courseId) !== '' ? (int) $courseId : null;

        $migrationRequired = !Schema::hasTable('assignments');
        $assignments = collect();
        if (!$migrationRequired) {
            $assignments = Assignment::query()
                ->where('lecturer_id', $lecturerId)
                ->with('course:id,title,code')
                ->when($normalizedStatus !== 'all', fn ($query) => $query->where('status', $normalizedStatus))
                ->when($selectedCourseId, fn ($query) => $query->where('course_id', $selectedCourseId))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('title', 'like', '%' . $search . '%')
                            ->orWhere('description', 'like', '%' . $search . '%');
                    });
                })
                ->latest('id')
                ->get();
        }

        $courses = Schema::hasTable('courses') ? $this->getLecturerCoursesSimple($lecturerId) : collect();
        $mocked = false;

        return [
            'assignments' => $assignments,
            'courses' => $courses,
            'migrationRequired' => $migrationRequired,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
                'status' => $normalizedStatus,
                'course' => $selectedCourseId,
            ],
        ];
    }

    public function canManageAssignments(): bool
    {
        return Schema::hasTable('assignments');
    }

    public function createAssignment(int $lecturerId, array $payload): void
    {
        $courseId = $this->resolveCourseId($lecturerId, $payload['course_id'] ?? null);

        Assignment::create([
            'lecturer_id' => $lecturerId,
            'course_id' => $courseId,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'due_at' => $payload['due_at'] ?? null,
            'status' => $payload['status'],
            'max_score' => $payload['max_score'] ?? 100,
        ]);
    }

    public function updateAssignment(int $lecturerId, Assignment $assignment, array $payload): void
    {
        $this->ensureOwned($lecturerId, $assignment);
        $courseId = $this->resolveCourseId($lecturerId, $payload['course_id'] ?? null);

        $assignment->update([
            'course_id' => $courseId,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'due_at' => $payload['due_at'] ?? null,
            'status' => $payload['status'],
            'max_score' => $payload['max_score'] ?? 100,
        ]);
    }

    public function deleteAssignment(int $lecturerId, Assignment $assignment): void
    {
        $this->ensureOwned($lecturerId, $assignment);
        $assignment->delete();
    }

    public function getQuizzesData(int $lecturerId, string $search, string $status, string $courseId): array
    {
        $normalizedStatus = in_array($status, ['all', 'draft', 'active', 'closed'], true) ? $status : 'all';
        $selectedCourseId = trim($courseId) !== '' ? (int) $courseId : null;

        $migrationRequired = !Schema::hasTable('quizzes') || !Schema::hasTable('questions');
        $quizzes = collect();
        if (!$migrationRequired) {
            $quizzes = Quiz::query()
                ->where('lecturer_id', $lecturerId)
                ->with(['course:id,title,code', 'questions:id,quiz_id,question_text,question_type,options,correct_answer,points,sort_order'])
                ->withCount('attempts')
                ->when($normalizedStatus !== 'all', fn ($query) => $query->where('status', $normalizedStatus))
                ->when($selectedCourseId, fn ($query) => $query->where('course_id', $selectedCourseId))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('title', 'like', '%' . $search . '%')
                            ->orWhere('description', 'like', '%' . $search . '%');
                    });
                })
                ->latest('id')
                ->get()
                ->map(function (Quiz $quiz): array {
                    $avgScore = (int) round((float) ($quiz->attempts()->where('status', 'graded')->avg('score') ?? 0));
                    return [
                        'id' => $quiz->id,
                        'course_id' => $quiz->course_id,
                        'title' => $quiz->title,
                        'description' => $quiz->description,
                        'duration_minutes' => $quiz->duration_minutes,
                        'total_questions' => $quiz->total_questions,
                        'scheduled_at' => $quiz->scheduled_at?->toISOString(),
                        'status' => $quiz->status,
                        'participants_count' => (int) ($quiz->attempts_count ?? 0),
                        'avg_score' => $avgScore,
                        'course' => $quiz->course ? [
                            'id' => $quiz->course->id,
                            'title' => $quiz->course->title,
                            'code' => $quiz->course->code,
                        ] : null,
                        'questions' => $quiz->questions->map(fn (Question $question) => [
                            'id' => $question->id,
                            'question_text' => $question->question_text,
                            'question_type' => $question->question_type,
                            'options' => $question->question_type === 'objective' ? array_values(array_filter($question->options ?? [], fn ($value) => trim((string) $value) !== '')) : [],
                            'correct_answer' => $question->correct_answer,
                            'points' => $question->points,
                            'sort_order' => $question->sort_order,
                        ])->values()->all(),
                    ];
                })
                ->values();
        }

        $courses = Schema::hasTable('courses') ? $this->getLecturerCoursesSimple($lecturerId) : collect();
        $mocked = false;

        return [
            'quizzes' => $quizzes,
            'courses' => $courses,
            'migrationRequired' => $migrationRequired,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
                'status' => $normalizedStatus,
                'course' => $selectedCourseId,
            ],
        ];
    }

    public function canManageQuizzes(): bool
    {
        return Schema::hasTable('quizzes') && Schema::hasTable('questions');
    }

    public function createQuiz(int $lecturerId, array $payload): void
    {
        $courseId = $this->resolveCourseId($lecturerId, $payload['course_id'] ?? null);

        $quiz = Quiz::create([
            'lecturer_id' => $lecturerId,
            'course_id' => $courseId,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'duration_minutes' => $payload['duration_minutes'] ?? null,
            'total_questions' => isset($payload['questions']) ? count($payload['questions']) : ($payload['total_questions'] ?? null),
            'scheduled_at' => $payload['scheduled_at'] ?? null,
            'status' => $payload['status'],
        ]);

        $this->syncQuizQuestions($quiz, $payload['questions'] ?? []);
    }

    public function updateQuiz(int $lecturerId, Quiz $quiz, array $payload): void
    {
        $this->ensureOwned($lecturerId, $quiz);
        $courseId = $this->resolveCourseId($lecturerId, $payload['course_id'] ?? null);

        $quiz->update([
            'course_id' => $courseId,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'duration_minutes' => $payload['duration_minutes'] ?? null,
            'total_questions' => isset($payload['questions']) ? count($payload['questions']) : ($payload['total_questions'] ?? null),
            'scheduled_at' => $payload['scheduled_at'] ?? null,
            'status' => $payload['status'],
        ]);

        if (array_key_exists('questions', $payload)) {
            $this->syncQuizQuestions($quiz, $payload['questions'] ?? []);
        }
    }

    public function deleteQuiz(int $lecturerId, Quiz $quiz): void
    {
        $this->ensureOwned($lecturerId, $quiz);
        $quiz->delete();
    }

    public function getGradesDashboardData(int $lecturerId, string $search = '', string $courseId = '', string $type = 'all', string $status = 'all'): array
    {
        $normalizedType = in_array($type, ['all', 'assignment', 'quiz'], true) ? $type : 'all';
        $normalizedStatus = in_array($status, ['all', 'submitted', 'graded'], true) ? $status : 'all';
        $selectedCourseId = trim($courseId) !== '' ? (int) $courseId : null;

        $assignmentMigrationRequired = !Schema::hasTable('assignment_submissions');
        $quizMigrationRequired = !Schema::hasTable('quiz_attempts');
        $migrationRequired = $assignmentMigrationRequired || $quizMigrationRequired;

        $assignmentSubmissions = collect();
        if (!$assignmentMigrationRequired && $normalizedType !== 'quiz') {
            $assignmentSubmissions = AssignmentSubmission::query()
                ->whereHas('assignment', fn ($query) => $query->where('lecturer_id', $lecturerId))
                ->with(['assignment.course:id,title,code', 'student:id,name,email,code'])
                ->when($normalizedStatus !== 'all', fn ($query) => $query->where('status', $normalizedStatus))
                ->when($selectedCourseId, fn ($query) => $query->whereHas('assignment', fn ($subQuery) => $subQuery->where('course_id', $selectedCourseId)))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('submission_text', 'like', '%' . $search . '%')
                            ->orWhere('feedback', 'like', '%' . $search . '%')
                            ->orWhereHas('assignment', fn ($assignmentQuery) => $assignmentQuery->where('title', 'like', '%' . $search . '%'))
                            ->orWhereHas('student', function ($studentQuery) use ($search) {
                                $studentQuery
                                    ->where('name', 'like', '%' . $search . '%')
                                    ->orWhere('email', 'like', '%' . $search . '%')
                                    ->orWhere('code', 'like', '%' . $search . '%');
                            });
                    });
                })
                ->latest('submitted_at')
                ->latest('id')
                ->get();
        }

        $quizAttempts = collect();
        if (!$quizMigrationRequired && $normalizedType !== 'assignment') {
            $quizAttempts = QuizAttempt::query()
                ->whereHas('quiz', fn ($query) => $query->where('lecturer_id', $lecturerId))
                ->with(['quiz.course:id,title,code', 'student:id,name,email,code'])
                ->when($normalizedStatus !== 'all', fn ($query) => $query->where('status', $normalizedStatus))
                ->when($selectedCourseId, fn ($query) => $query->whereHas('quiz', fn ($subQuery) => $subQuery->where('course_id', $selectedCourseId)))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('answers', 'like', '%' . $search . '%')
                            ->orWhere('feedback', 'like', '%' . $search . '%')
                            ->orWhereHas('quiz', fn ($quizQuery) => $quizQuery->where('title', 'like', '%' . $search . '%'))
                            ->orWhereHas('student', function ($studentQuery) use ($search) {
                                $studentQuery
                                    ->where('name', 'like', '%' . $search . '%')
                                    ->orWhere('email', 'like', '%' . $search . '%')
                                    ->orWhere('code', 'like', '%' . $search . '%');
                            });
                    });
                })
                ->latest('submitted_at')
                ->latest('id')
                ->get();
        }

        $courses = Schema::hasTable('courses')
            ? Course::query()->where('lecturer_id', $lecturerId)->orderBy('title')->get(['id', 'title', 'code'])
            : collect();

        return [
            'assignmentSubmissions' => $assignmentSubmissions,
            'quizAttempts' => $quizAttempts,
            'courses' => $courses,
            'filters' => [
                'search' => $search,
                'course' => $selectedCourseId,
                'type' => $normalizedType,
                'status' => $normalizedStatus,
            ],
            'summary' => [
                'pending_assignment' => $assignmentSubmissions->where('status', 'submitted')->count(),
                'pending_quiz' => $quizAttempts->where('status', 'submitted')->count(),
                'graded_assignment' => $assignmentSubmissions->where('status', 'graded')->count(),
                'graded_quiz' => $quizAttempts->where('status', 'graded')->count(),
            ],
            'migrationRequired' => [
                'assignments' => $assignmentMigrationRequired,
                'quizzes' => $quizMigrationRequired,
                'any' => $migrationRequired,
            ],
        ];
    }

    public function gradeAssignmentSubmission(int $lecturerId, AssignmentSubmission $submission, array $payload): void
    {
        $submission->loadMissing('assignment');
        abort_if(!$submission->assignment || (int) $submission->assignment->lecturer_id !== $lecturerId, 404);

        $maxScore = (int) ($submission->assignment->max_score ?? 100);
        $score = max(0, min((int) $payload['score'], $maxScore));

        $submission->update([
            'score' => $score,
            'feedback' => $payload['feedback'] ?? null,
            'status' => 'graded',
            'graded_at' => now(),
        ]);
    }

    public function gradeQuizAttempt(int $lecturerId, QuizAttempt $attempt, array $payload): void
    {
        $attempt->loadMissing('quiz');
        abort_if(!$attempt->quiz || (int) $attempt->quiz->lecturer_id !== $lecturerId, 404);

        $score = max(0, min((int) $payload['score'], 100));

        $attempt->update([
            'score' => $score,
            'feedback' => $payload['feedback'] ?? null,
            'status' => 'graded',
            'graded_at' => now(),
        ]);
    }

    public function getDiscussionsData(int $lecturerId, string $search, string $status, string $courseId): array
    {
        $normalizedStatus = in_array($status, ['all', 'open', 'closed'], true) ? $status : 'all';
        $selectedCourseId = trim($courseId) !== '' ? (int) $courseId : null;

        $migrationRequired = !Schema::hasTable('discussions');
        $discussions = collect();
        if (!$migrationRequired) {
            $discussions = Discussion::query()
                ->where('lecturer_id', $lecturerId)
                ->with('course:id,title,code')
                ->when($normalizedStatus !== 'all', fn ($query) => $query->where('status', $normalizedStatus))
                ->when($selectedCourseId, fn ($query) => $query->where('course_id', $selectedCourseId))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('title', 'like', '%' . $search . '%')
                            ->orWhere('body', 'like', '%' . $search . '%');
                    });
                })
                ->latest('id')
                ->get();
        }

        $courses = Schema::hasTable('courses') ? $this->getLecturerCoursesSimple($lecturerId) : collect();
        $mocked = false;

        return [
            'discussions' => $discussions,
            'courses' => $courses,
            'migrationRequired' => $migrationRequired,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
                'status' => $normalizedStatus,
                'course' => $selectedCourseId,
            ],
        ];
    }

    public function canManageDiscussions(): bool
    {
        return Schema::hasTable('discussions');
    }

    public function createDiscussion(int $lecturerId, array $payload): void
    {
        $courseId = $this->resolveCourseId($lecturerId, $payload['course_id'] ?? null);

        Discussion::create([
            'lecturer_id' => $lecturerId,
            'course_id' => $courseId,
            'title' => $payload['title'],
            'body' => $payload['body'],
            'status' => $payload['status'],
        ]);
    }

    public function updateDiscussion(int $lecturerId, Discussion $discussion, array $payload): void
    {
        $this->ensureOwned($lecturerId, $discussion);
        $courseId = $this->resolveCourseId($lecturerId, $payload['course_id'] ?? null);

        $discussion->update([
            'course_id' => $courseId,
            'title' => $payload['title'],
            'body' => $payload['body'],
            'status' => $payload['status'],
        ]);
    }

    public function deleteDiscussion(int $lecturerId, Discussion $discussion): void
    {
        $this->ensureOwned($lecturerId, $discussion);
        $discussion->delete();
    }

    public function getStudentNotesData(int $lecturerId, string $search, string $status, string $courseId): array
    {
        $normalizedStatus = in_array($status, ['all', 'active', 'resolved'], true) ? $status : 'all';
        $selectedCourseId = trim($courseId) !== '' ? (int) $courseId : null;

        $notesMigrationRequired = !Schema::hasTable('student_notes');
        $enrollmentsMigrationRequired = !Schema::hasTable('course_student');

        $notes = collect();
        if (!$notesMigrationRequired) {
            $notes = StudentNote::query()
                ->where('lecturer_id', $lecturerId)
                ->with('student:id,name,email,code')
                ->when($normalizedStatus !== 'all', fn ($query) => $query->where('status', $normalizedStatus))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('title', 'like', '%' . $search . '%')
                            ->orWhere('note', 'like', '%' . $search . '%')
                            ->orWhereHas('student', function ($studentQuery) use ($search) {
                                $studentQuery
                                    ->where('name', 'like', '%' . $search . '%')
                                    ->orWhere('email', 'like', '%' . $search . '%')
                                    ->orWhere('code', 'like', '%' . $search . '%');
                            });
                    });
                })
                ->latest('id')
                ->get();
        }

        $courses = Schema::hasTable('courses')
            ? Course::query()->where('lecturer_id', $lecturerId)->orderBy('title')->get(['id', 'title', 'code'])
            : collect();

        $roster = collect();
        if ($selectedCourseId && !$enrollmentsMigrationRequired && Schema::hasTable('courses')) {
            $course = $this->findLecturerCourse($lecturerId, $selectedCourseId);
            $roster = $course->students()
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($studentQuery) use ($search) {
                        $studentQuery
                            ->where('name', 'like', '%' . $search . '%')
                            ->orWhere('email', 'like', '%' . $search . '%')
                            ->orWhere('code', 'like', '%' . $search . '%');
                    });
                })
                ->orderBy('name')
                ->get(['users.id', 'users.name', 'users.email', 'users.code']);
        }

        $lecturerJurusanId = User::query()->where('id', $lecturerId)->value('jurusan_id');

        $students = User::query()
            ->where('role', 'student')
            ->when(!empty($lecturerJurusanId), fn ($query) => $query->where('jurusan_id', (int) $lecturerJurusanId))
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'code']);

        $mocked = false;

        return [
            'notes' => $notes,
            'students' => $students,
            'courses' => $courses,
            'roster' => $roster,
            'filters' => [
                'search' => $search,
                'status' => $normalizedStatus,
                'course' => $selectedCourseId,
            ],
            'migrationRequired' => [
                'notes' => $notesMigrationRequired,
                'enrollments' => $enrollmentsMigrationRequired,
            ],
            'mocked' => $mocked,
        ];
    }

    public function canManageStudentNotes(): bool
    {
        return Schema::hasTable('student_notes');
    }

    public function canManageEnrollments(): bool
    {
        return Schema::hasTable('course_student');
    }

    public function enrollStudent(int $lecturerId, array $payload): void
    {
        $course = $this->findLecturerCourse($lecturerId, (int) $payload['course_id']);
        $student = User::query()
            ->where('id', (int) $payload['student_id'])
            ->where('role', 'student')
            ->firstOrFail();

        abort_if(empty($course->jurusan_id), 422, 'Kursus belum terhubung ke program studi.');
        abort_if(empty($student->jurusan_id), 422, 'Mahasiswa belum terhubung ke program studi.');
        abort_if((int) $course->jurusan_id !== (int) $student->jurusan_id, 422, 'Mahasiswa hanya dapat didaftarkan ke kursus program studi yang sama.');

        $alreadyEnrolled = $course->students()->where('users.id', $student->id)->exists();
        abort_if($alreadyEnrolled, 422, 'Mahasiswa sudah terdaftar di kursus ini.');

        $course->students()->syncWithoutDetaching([
            (int) $student->id => ['enrolled_at' => now()],
        ]);

        $lecturer = User::query()->findOrFail($lecturerId);
        $this->notificationService->notifyEnrollment($student, $lecturer, (string) $course->title, $lecturerId, false);
    }

    public function removeEnrollment(int $lecturerId, int $courseId, int $studentId): void
    {
        $course = $this->findLecturerCourse($lecturerId, $courseId);
        $course->students()->detach($studentId);

        $student = User::query()->find($studentId);
        if ($student) {
            $this->notificationService->notify(
                (int) $student->id,
                'enrollment',
                'Enrollment diperbarui',
                "Anda dikeluarkan dari kursus {$course->title}.",
                '/my-courses',
                ['course_id' => $course->id, 'course_title' => $course->title],
                $lecturerId
            );
        }
    }

    public function selfEnrollStudent(int $studentId, array $payload): void
    {
        abort_if(!$this->canManageEnrollments(), 404);
        abort_if(!Schema::hasColumn('courses', 'allow_self_enrollment') || !Schema::hasColumn('courses', 'enrollment_key'), 404);

        $course = Course::query()
            ->with('lecturer:id,name,email')
            ->where('id', (int) $payload['course_id'])
            ->where('status', 'active')
            ->firstOrFail();

        abort_if(!$course->allow_self_enrollment, 422, 'Kursus ini tidak membuka self-enrollment.');

        $enrollmentKey = trim((string) ($payload['enrollment_key'] ?? ''));
        if (!empty($course->enrollment_key)) {
            abort_if($enrollmentKey === '' || !hash_equals((string) $course->enrollment_key, $enrollmentKey), 422, 'Kunci enrollment tidak valid.');
        }

        $student = User::query()
            ->where('id', $studentId)
            ->where('role', 'student')
            ->firstOrFail();

        abort_if(empty($course->jurusan_id), 422, 'Kursus belum terhubung ke program studi.');
        abort_if(empty($student->jurusan_id), 422, 'Akun Anda belum terhubung ke program studi.');
        abort_if((int) $course->jurusan_id !== (int) $student->jurusan_id, 422, 'Kursus ini bukan untuk program studi Anda.');

        $alreadyEnrolled = $course->students()->where('users.id', $studentId)->exists();
        abort_if($alreadyEnrolled, 422, 'Anda sudah terdaftar di kursus ini.');

        $course->students()->attach($studentId, ['enrolled_at' => now()]);

        if ($course->lecturer) {
            $this->notificationService->notifyEnrollment($student, $course->lecturer, (string) $course->title, $studentId, true);
        } else {
            $this->notificationService->notify(
                $studentId,
                'enrollment',
                'Enrollment berhasil',
                "Anda berhasil mendaftar ke kursus {$course->title}.",
                '/my-courses',
                ['course_id' => $course->id, 'course_title' => $course->title],
                $studentId
            );
        }
    }

    public function createStudentNote(int $lecturerId, array $payload): void
    {
        StudentNote::create([
            'lecturer_id' => $lecturerId,
            'student_id' => $payload['student_id'],
            'title' => $payload['title'],
            'note' => $payload['note'],
            'status' => $payload['status'],
        ]);
    }

    public function updateStudentNote(int $lecturerId, StudentNote $note, array $payload): void
    {
        $this->ensureOwned($lecturerId, $note);

        $note->update([
            'student_id' => $payload['student_id'],
            'title' => $payload['title'],
            'note' => $payload['note'],
            'status' => $payload['status'],
        ]);
    }

    public function deleteStudentNote(int $lecturerId, StudentNote $note): void
    {
        $this->ensureOwned($lecturerId, $note);
        $note->delete();
    }

    private function mapStudentCourse(Course $course, int $studentId, bool $withLessonContent = false): array
    {
        $modules = $course->modules->map(function (CourseModule $module) use ($studentId, $withLessonContent) {
            $lessons = $module->lessons->map(function (CourseLesson $lesson) use ($studentId, $withLessonContent) {
                $progress = $lesson->progress->firstWhere('student_id', $studentId);
                $progressPercent = (int) ($progress->progress_percent ?? 0);

                return [
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'summary' => $lesson->summary,
                    'content_type' => $lesson->content_type,
                    'video_url' => $lesson->video_url,
                    'video_embed_url' => $this->normalizeVideoUrl($lesson->video_url),
                    'content' => $withLessonContent ? $lesson->content : null,
                    'duration_minutes' => $lesson->duration_minutes,
                    'sort_order' => $lesson->sort_order,
                    'progress_percent' => $progressPercent,
                    'is_completed' => (bool) ($progress->is_completed ?? false),
                    'last_accessed_at' => $progress?->last_accessed_at?->toISOString(),
                ];
            })->values();

            return [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'sort_order' => $module->sort_order,
                'lessons' => $lessons,
            ];
        })->values();

        $lessonCollection = $modules->flatMap(fn ($module) => $module['lessons']);
        $totalLessons = $lessonCollection->count();
        $completedLessons = $lessonCollection->where('is_completed', true)->count();
        $progressPercent = $totalLessons > 0 ? (int) round(($completedLessons / $totalLessons) * 100) : 0;

        return [
            'id' => $course->id,
            'title' => $course->title,
            'code' => $course->code,
            'description' => $course->description,
            'category' => $course->category,
            'lecturer' => $course->lecturer ? ['id' => $course->lecturer->id, 'name' => $course->lecturer->name] : null,
            'modules' => $modules,
            'total_lessons' => $totalLessons,
            'completed_lessons' => $completedLessons,
            'progress_percent' => $progressPercent,
        ];
    }

    private function getLecturerCoursesSimple(int $lecturerId): Collection
    {
        return Course::query()
            ->where('lecturer_id', $lecturerId)
            ->orderBy('title')
            ->get(['id', 'title', 'code']);
    }

    private function resolveCourseId(int $lecturerId, $courseId): ?int
    {
        if ($courseId === null || $courseId === '') {
            return null;
        }

        abort_if(!Schema::hasTable('courses'), 404);

        $course = $this->findLecturerCourse($lecturerId, (int) $courseId);

        return (int) $course->id;
    }

    private function ensureCourseOwner(int $lecturerId, Course $course): void
    {
        abort_if((int) $course->lecturer_id !== $lecturerId, 404);
    }

    private function syncQuizQuestions(Quiz $quiz, array $questions): void
    {
        if (!Schema::hasTable('questions')) {
            return;
        }

        $normalized = collect($questions)
            ->map(function ($item, int $index): ?array {
                $text = trim((string) ($item['question_text'] ?? ''));
                if ($text === '') {
                    return null;
                }

                $questionType = in_array(($item['question_type'] ?? 'objective'), ['objective', 'essay'], true)
                    ? $item['question_type']
                    : 'objective';
                $options = collect($item['options'] ?? [])
                    ->map(fn ($value) => trim((string) $value))
                    ->filter(fn ($value) => $value !== '')
                    ->values()
                    ->all();

                return [
                    'question_text' => $text,
                    'question_type' => $questionType,
                    'options' => $questionType === 'objective' ? $options : [],
                    'correct_answer' => isset($item['correct_answer']) ? trim((string) $item['correct_answer']) : null,
                    'points' => max(1, (int) ($item['points'] ?? 10)),
                    'sort_order' => max(1, (int) ($item['sort_order'] ?? ($index + 1))),
                ];
            })
            ->filter()
            ->values();

        $quiz->questions()->delete();
        foreach ($normalized as $row) {
            $quiz->questions()->create($row);
        }

        $quiz->update(['total_questions' => $normalized->count()]);
    }

    private function normalizeAttemptAnswers($answers): array
    {
        if (is_array($answers)) {
            return $answers;
        }

        if (is_string($answers) && trim($answers) !== '') {
            return ['legacy_text' => trim($answers)];
        }

        return [];
    }

    private function resolveSubmissionAttachmentUrl(?string $attachmentUrl): ?string
    {
        if (!$attachmentUrl) {
            return null;
        }

        if (str_starts_with($attachmentUrl, 'http://') || str_starts_with($attachmentUrl, 'https://')) {
            return $attachmentUrl;
        }

        return Storage::disk('public')->url($attachmentUrl);
    }

    private function getCoursesForLearningOperator(int $actorId, string $actorRole): Collection
    {
        if ($actorRole === 'admin') {
            return Course::query()
                ->orderBy('title')
                ->get(['id', 'title', 'code']);
        }

        return $this->getLecturerCoursesSimple($actorId);
    }

    private function findCourseForLearningOperator(int $actorId, string $actorRole, int $courseId): Course
    {
        $query = Course::query()->where('id', $courseId);
        if ($actorRole !== 'admin') {
            $query->where('lecturer_id', $actorId);
        }

        $course = $query->first();
        abort_if(!$course, 404);

        return $course;
    }

    private function findModuleForLearningOperator(int $actorId, string $actorRole, int $moduleId): CourseModule
    {
        $query = CourseModule::query()
            ->where('id', $moduleId)
            ->whereHas('course', function ($subQuery) use ($actorId, $actorRole) {
                if ($actorRole !== 'admin') {
                    $subQuery->where('lecturer_id', $actorId);
                }
            });

        $module = $query->first();
        abort_if(!$module, 404);

        return $module;
    }

    private function ensureModuleOwnerForLearningOperator(int $actorId, string $actorRole, CourseModule $module): void
    {
        $module->loadMissing('course');
        if ($actorRole === 'admin') {
            abort_if(!$module->course, 404);
            return;
        }

        abort_if(!$module->course || (int) $module->course->lecturer_id !== $actorId, 404);
    }

    private function ensureLessonOwnerForLearningOperator(int $actorId, string $actorRole, CourseLesson $lesson): void
    {
        $lesson->loadMissing('module.course');
        if ($actorRole === 'admin') {
            abort_if(!$lesson->module || !$lesson->module->course, 404);
            return;
        }

        abort_if(
            !$lesson->module || !$lesson->module->course || (int) $lesson->module->course->lecturer_id !== $actorId,
            404
        );
    }

    private function ensureModuleOwner(int $lecturerId, CourseModule $module): void
    {
        $module->loadMissing('course');
        abort_if(!$module->course || (int) $module->course->lecturer_id !== $lecturerId, 404);
    }

    private function ensureLessonOwner(int $lecturerId, CourseLesson $lesson): void
    {
        $lesson->loadMissing('module.course');
        abort_if(!$lesson->module || !$lesson->module->course || (int) $lesson->module->course->lecturer_id !== $lecturerId, 404);
    }

    private function ensureMaterialOwner(int $lecturerId, CourseMaterial $material): void
    {
        $material->loadMissing('course');
        abort_if(!$material->course || (int) $material->course->lecturer_id !== $lecturerId, 404);
    }

    private function ensureOwned(int $lecturerId, $model): void
    {
        abort_if((int) $model->lecturer_id !== $lecturerId, 404);
    }

    private function ensureStudentCanAccessAssignment(int $studentId, Assignment $assignment): void
    {
        $assignment->loadMissing('course.students:id');
        abort_if(!$assignment->course, 404);
        abort_if(!$assignment->course->students->contains('id', $studentId), 403);
    }

    private function ensureStudentCanAccessQuiz(int $studentId, Quiz $quiz): void
    {
        $quiz->loadMissing('course.students:id');
        abort_if(!$quiz->course, 404);
        abort_if(!$quiz->course->students->contains('id', $studentId), 403);
    }

    private function findLecturerCourse(int $lecturerId, int $courseId): Course
    {
        $course = Course::query()
            ->where('id', $courseId)
            ->where('lecturer_id', $lecturerId)
            ->first();

        abort_if(!$course, 404);

        return $course;
    }

    private function resolveLecturerJurusanId(int $lecturerId): int
    {
        $lecturer = User::query()
            ->where('id', $lecturerId)
            ->where('role', 'teacher')
            ->firstOrFail();

        abort_if(empty($lecturer->jurusan_id), 422, 'Profil dosen belum terhubung ke program studi.');

        return (int) $lecturer->jurusan_id;
    }

    private function findLecturerModule(int $lecturerId, int $moduleId): CourseModule
    {
        $module = CourseModule::query()
            ->where('id', $moduleId)
            ->whereHas('course', fn ($query) => $query->where('lecturer_id', $lecturerId))
            ->first();

        abort_if(!$module, 404);

        return $module;
    }

    private function normalizeVideoUrl(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        if (str_contains($url, 'youtube.com/watch?v=')) {
            $videoId = Str::after($url, 'watch?v=');
            $videoId = Str::before($videoId, '&');

            return 'https://www.youtube.com/embed/' . $videoId;
        }

        if (str_contains($url, 'youtu.be/')) {
            $videoId = Str::afterLast($url, 'youtu.be/');
            $videoId = Str::before($videoId, '?');

            return 'https://www.youtube.com/embed/' . $videoId;
        }

        if (str_contains($url, 'vimeo.com/') && !str_contains($url, 'player.vimeo.com/video/')) {
            $videoId = Str::afterLast($url, 'vimeo.com/');
            $videoId = Str::before($videoId, '?');

            return 'https://player.vimeo.com/video/' . $videoId;
        }

        return $url;
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

    private function mockCourses(): array
    {
        return [
            [
                'id' => 901,
                'title' => 'Pengantar UI/UX untuk Produk Digital',
                'code' => 'UX-101',
                'description' => 'Dasar riset pengguna, alur, dan prototyping.',
                'category' => 'Desain Produk',
                'tags' => ['ux', 'figma', 'research'],
                'jurusan_id' => null,
                'level' => 'dasar',
                'semester' => 2,
                'credit_hours' => 2,
                'status' => 'active',
                'materials_count' => 4,
                'is_mock' => true,
            ],
            [
                'id' => 902,
                'title' => 'Pemrograman Web Modern',
                'code' => 'WEB-202',
                'description' => 'Stack modern, API, dan deployment.',
                'category' => 'Teknologi',
                'tags' => ['react', 'laravel', 'api'],
                'jurusan_id' => null,
                'level' => 'menengah',
                'semester' => 4,
                'credit_hours' => 3,
                'status' => 'draft',
                'materials_count' => 2,
                'is_mock' => true,
            ],
            [
                'id' => 903,
                'title' => 'Data Analytics untuk Bisnis',
                'code' => 'DA-310',
                'description' => 'Analisis data dan insight bisnis.',
                'category' => 'Data Science',
                'tags' => ['analytics', 'sql', 'dashboard'],
                'jurusan_id' => null,
                'level' => 'lanjutan',
                'semester' => 6,
                'credit_hours' => 3,
                'status' => 'archived',
                'materials_count' => 6,
                'is_mock' => true,
            ],
        ];
    }

    private function mockCourseOptions(): array
    {
        return array_map(fn ($course) => [
            'id' => $course['id'],
            'title' => $course['title'],
            'code' => $course['code'],
            'is_mock' => true,
        ], $this->mockCourses());
    }

    private function mockMaterials(array $courses): array
    {
        return [
            [
                'id' => 1201,
                'course_id' => $courses[0]['id'],
                'title' => 'Slide Pengantar UX',
                'file_name' => 'ux-introduction.pdf',
                'file_size' => 820000,
                'created_at' => now()->subDays(3)->toISOString(),
                'course' => $courses[0],
                'is_mock' => true,
            ],
            [
                'id' => 1202,
                'course_id' => $courses[1]['id'],
                'title' => 'Brief Project Web',
                'file_name' => 'project-brief.docx',
                'file_size' => 450000,
                'created_at' => now()->subDays(5)->toISOString(),
                'course' => $courses[1],
                'is_mock' => true,
            ],
            [
                'id' => 1203,
                'course_id' => $courses[2]['id'],
                'title' => 'Dataset & Panduan',
                'file_name' => 'dataset-guide.zip',
                'file_size' => 2450000,
                'created_at' => now()->subDays(7)->toISOString(),
                'course' => $courses[2],
                'is_mock' => true,
            ],
        ];
    }

    private function mockAssignments(array $courses): array
    {
        return [
            [
                'id' => 2101,
                'course_id' => $courses[0]['id'],
                'title' => 'Audit UX Landing Page',
                'description' => 'Analisis UI/UX halaman landing dan rekomendasinya.',
                'due_at' => now()->addDays(5)->toISOString(),
                'status' => 'active',
                'max_score' => 100,
                'created_at' => now()->subDays(2)->toISOString(),
                'course' => $courses[0],
                'is_mock' => true,
            ],
            [
                'id' => 2102,
                'course_id' => $courses[1]['id'],
                'title' => 'Setup API + Auth',
                'description' => 'Buat API login sederhana dengan token.',
                'due_at' => now()->addDays(9)->toISOString(),
                'status' => 'draft',
                'max_score' => 120,
                'created_at' => now()->subDays(1)->toISOString(),
                'course' => $courses[1],
                'is_mock' => true,
            ],
        ];
    }

    private function mockQuizzes(array $courses): array
    {
        return [
            [
                'id' => 3101,
                'course_id' => $courses[0]['id'],
                'title' => 'Kuis Persona & Journey',
                'description' => 'Uji pemahaman konsep persona dan user journey.',
                'duration_minutes' => 30,
                'total_questions' => 20,
                'scheduled_at' => now()->addDays(2)->toISOString(),
                'status' => 'active',
                'course' => $courses[0],
                'is_mock' => true,
            ],
            [
                'id' => 3102,
                'course_id' => $courses[2]['id'],
                'title' => 'Kuis Exploratory Data',
                'description' => 'Pertanyaan terkait EDA dan visualisasi data.',
                'duration_minutes' => 45,
                'total_questions' => 25,
                'scheduled_at' => now()->addDays(6)->toISOString(),
                'status' => 'draft',
                'course' => $courses[2],
                'is_mock' => true,
            ],
        ];
    }

    private function mockDiscussions(array $courses): array
    {
        return [
            [
                'id' => 4101,
                'course_id' => $courses[0]['id'],
                'title' => 'Tips riset pengguna untuk pemula',
                'body' => 'Bagikan pengalaman awal melakukan interview user.',
                'status' => 'open',
                'created_at' => now()->subDays(1)->toISOString(),
                'course' => $courses[0],
                'is_mock' => true,
            ],
            [
                'id' => 4102,
                'course_id' => $courses[1]['id'],
                'title' => 'Best practice struktur folder',
                'body' => 'Bagaimana struktur folder terbaik untuk proyek web?',
                'status' => 'closed',
                'created_at' => now()->subDays(4)->toISOString(),
                'course' => $courses[1],
                'is_mock' => true,
            ],
        ];
    }

    private function mockStudents(): array
    {
        return [
            ['id' => 6101, 'name' => 'Dina Putri', 'email' => 'dina.putri@mail.id', 'code' => 'NIM2024001', 'is_mock' => true],
            ['id' => 6102, 'name' => 'Raka Mahendra', 'email' => 'raka.mahendra@mail.id', 'code' => 'NIM2024002', 'is_mock' => true],
            ['id' => 6103, 'name' => 'Sari Lestari', 'email' => 'sari.lestari@mail.id', 'code' => 'NIM2024003', 'is_mock' => true],
        ];
    }

    private function mockRoster(array $courses, array $students): array
    {
        return array_map(fn ($student) => [
            ...$student,
            'pivot' => ['enrolled_at' => now()->subDays(10)->toISOString()],
            'course' => $courses[0],
            'is_mock' => true,
        ], $students);
    }

    private function mockStudentNotes(array $students): array
    {
        return [
            [
                'id' => 7101,
                'student_id' => $students[0]['id'],
                'title' => 'Perlu bimbingan tambahan',
                'note' => 'Mahasiswa butuh sesi tambahan untuk materi riset.',
                'status' => 'active',
                'student' => $students[0],
                'is_mock' => true,
            ],
            [
                'id' => 7102,
                'student_id' => $students[1]['id'],
                'title' => 'Progres sangat baik',
                'note' => 'Konsisten mengumpulkan tugas tepat waktu.',
                'status' => 'resolved',
                'student' => $students[1],
                'is_mock' => true,
            ],
        ];
    }
}
