<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\Discussion;
use App\Models\Quiz;
use App\Models\StudentNote;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LecturerService
{
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
        $shouldMock = $search === '' && $normalizedStatus === 'all' && $normalizedCategory === 'all';
        if ($courses->isEmpty() && $shouldMock) {
            $mocked = true;
            $courses = collect($this->mockCourses());
            $availableCategories = collect(array_values(array_unique(array_filter(array_map(fn ($item) => $item['category'] ?? null, $courses->all())))));
        }

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

    public function canManageCourses(): bool
    {
        return Schema::hasTable('courses');
    }

    public function createCourseForLecturer(int $lecturerId, array $payload): void
    {
        Course::create($this->normalizeCoursePayload([
            ...$payload,
            'lecturer_id' => $lecturerId,
        ]));
    }

    public function updateCourseForLecturer(int $lecturerId, Course $course, array $payload): void
    {
        $this->ensureCourseOwner($lecturerId, $course);
        $course->update($this->normalizeCoursePayload([
            ...$payload,
            'lecturer_id' => $lecturerId,
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
        $shouldMock = $search === '' && $selectedCourseId === null;
        if ($materials->isEmpty() && $courses->isEmpty() && $shouldMock) {
            $mocked = true;
            $mockCourses = $this->mockCourseOptions();
            $courses = collect($mockCourses);
            $materials = collect($this->mockMaterials($mockCourses));
        }

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
        $shouldMock = $search === '' && $normalizedStatus === 'all' && $selectedCourseId === null;
        if ($assignments->isEmpty() && $courses->isEmpty() && $shouldMock) {
            $mocked = true;
            $mockCourses = $this->mockCourseOptions();
            $courses = collect($mockCourses);
            $assignments = collect($this->mockAssignments($mockCourses));
        }

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

        $migrationRequired = !Schema::hasTable('quizzes');
        $quizzes = collect();
        if (!$migrationRequired) {
            $quizzes = Quiz::query()
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
        $shouldMock = $search === '' && $normalizedStatus === 'all' && $selectedCourseId === null;
        if ($quizzes->isEmpty() && $courses->isEmpty() && $shouldMock) {
            $mocked = true;
            $mockCourses = $this->mockCourseOptions();
            $courses = collect($mockCourses);
            $quizzes = collect($this->mockQuizzes($mockCourses));
        }

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
        return Schema::hasTable('quizzes');
    }

    public function createQuiz(int $lecturerId, array $payload): void
    {
        $courseId = $this->resolveCourseId($lecturerId, $payload['course_id'] ?? null);

        Quiz::create([
            'lecturer_id' => $lecturerId,
            'course_id' => $courseId,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'duration_minutes' => $payload['duration_minutes'] ?? null,
            'total_questions' => $payload['total_questions'] ?? null,
            'scheduled_at' => $payload['scheduled_at'] ?? null,
            'status' => $payload['status'],
        ]);
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
            'total_questions' => $payload['total_questions'] ?? null,
            'scheduled_at' => $payload['scheduled_at'] ?? null,
            'status' => $payload['status'],
        ]);
    }

    public function deleteQuiz(int $lecturerId, Quiz $quiz): void
    {
        $this->ensureOwned($lecturerId, $quiz);
        $quiz->delete();
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
        $shouldMock = $search === '' && $normalizedStatus === 'all' && $selectedCourseId === null;
        if ($discussions->isEmpty() && $courses->isEmpty() && $shouldMock) {
            $mocked = true;
            $mockCourses = $this->mockCourseOptions();
            $courses = collect($mockCourses);
            $discussions = collect($this->mockDiscussions($mockCourses));
        }

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

        $students = User::query()
            ->where('role', 'student')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'code']);

        $mocked = false;
        $shouldMock = $search === '' && $normalizedStatus === 'all' && $selectedCourseId === null;
        if ($notes->isEmpty() && $roster->isEmpty() && $courses->isEmpty() && $shouldMock) {
            $mocked = true;
            $mockCourses = $this->mockCourseOptions();
            $courses = collect($mockCourses);
            $students = collect($this->mockStudents());
            $roster = collect($this->mockRoster($mockCourses, $students->all()));
            $notes = collect($this->mockStudentNotes($students->all()));
        }

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

        $course->students()->syncWithoutDetaching([
            (int) $payload['student_id'] => ['enrolled_at' => now()],
        ]);
    }

    public function removeEnrollment(int $lecturerId, int $courseId, int $studentId): void
    {
        $course = $this->findLecturerCourse($lecturerId, $courseId);
        $course->students()->detach($studentId);
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

    private function ensureMaterialOwner(int $lecturerId, CourseMaterial $material): void
    {
        $material->loadMissing('course');
        abort_if(!$material->course || (int) $material->course->lecturer_id !== $lecturerId, 404);
    }

    private function ensureOwned(int $lecturerId, $model): void
    {
        abort_if((int) $model->lecturer_id !== $lecturerId, 404);
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
