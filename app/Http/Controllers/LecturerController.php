<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminAcademic\StoreCourseRequest;
use App\Http\Requests\AdminAcademic\UpdateCourseRequest;
use App\Http\Requests\Lecturer\StoreAssignmentRequest;
use App\Models\CourseLesson;
use App\Models\CourseModule;
use App\Http\Requests\Lecturer\StoreDiscussionRequest;
use App\Http\Requests\Lecturer\StoreMaterialRequest;
use App\Http\Requests\Lecturer\StoreQuizRequest;
use App\Http\Requests\Lecturer\StoreStudentNoteRequest;
use App\Http\Requests\Lecturer\UpdateAssignmentRequest;
use App\Http\Requests\Lecturer\UpdateDiscussionRequest;
use App\Http\Requests\Lecturer\UpdateQuizRequest;
use App\Http\Requests\Lecturer\UpdateStudentNoteRequest;
use App\Http\Requests\Lecturer\EnrollStudentRequest;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\Discussion;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\StudentNote;
use App\Services\LecturerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LecturerController extends Controller
{
    public function __construct(
        private readonly LecturerService $service
    ) {
    }

    public function myCourses(Request $request): Response
    {
        $user = $request->user();
        if ($user && $user->role === 'student') {
            return Inertia::render('Student/MyCourses', $this->service->getStudentLearningDashboard((int) $user->id));
        }
        if (!$user || $user->role !== 'teacher') {
            return Inertia::render('Courses');
        }

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));
        $category = trim((string) $request->query('category', 'all'));

        return Inertia::render('Lecturer/MyCourses', $this->service->getMyCoursesData((int) $user->id, $search, $status, $category));
    }

    public function learningModules(Request $request): Response
    {
        $user = $this->requireLecturer();
        $courseId = $request->query('course') ? (int) $request->query('course') : null;

        return Inertia::render('Lecturer/LearningModules', $this->service->getLearningModulesData((int) $user->id, $courseId));
    }

    public function storeModule(Request $request): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageLearningModules()) {
            return back()->withErrors(['modules' => 'Tabel learning modules belum tersedia. Jalankan migrasi terlebih dahulu.']);
        }

        $payload = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:1'],
        ]);

        $this->service->createModule((int) $user->id, $payload);

        return back()->with('success', 'Modul berhasil ditambahkan.');
    }

    public function updateModule(Request $request, CourseModule $module): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageLearningModules()) {
            return back()->withErrors(['modules' => 'Tabel learning modules belum tersedia. Jalankan migrasi terlebih dahulu.']);
        }

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:1'],
        ]);

        $this->service->updateModule((int) $user->id, $module, $payload);

        return back()->with('success', 'Modul berhasil diperbarui.');
    }

    public function destroyModule(CourseModule $module): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageLearningModules()) {
            return back()->withErrors(['modules' => 'Tabel learning modules belum tersedia. Jalankan migrasi terlebih dahulu.']);
        }

        $this->service->deleteModule((int) $user->id, $module);

        return back()->with('success', 'Modul berhasil dihapus.');
    }

    public function storeLesson(Request $request): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageLearningModules()) {
            return back()->withErrors(['lessons' => 'Tabel learning modules belum tersedia. Jalankan migrasi terlebih dahulu.']);
        }

        $payload = $request->validate([
            'course_module_id' => ['required', 'integer', 'exists:course_modules,id'],
            'title' => ['required', 'string', 'max:150'],
            'summary' => ['nullable', 'string'],
            'content_type' => ['required', 'in:video,document,text'],
            'video_url' => ['nullable', 'url', 'max:255'],
            'content' => ['nullable', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'sort_order' => ['nullable', 'integer', 'min:1'],
        ]);

        $this->service->createLesson((int) $user->id, $payload);

        return back()->with('success', 'Lesson berhasil ditambahkan.');
    }

    public function updateLesson(Request $request, CourseLesson $lesson): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageLearningModules()) {
            return back()->withErrors(['lessons' => 'Tabel learning modules belum tersedia. Jalankan migrasi terlebih dahulu.']);
        }

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'summary' => ['nullable', 'string'],
            'content_type' => ['required', 'in:video,document,text'],
            'video_url' => ['nullable', 'url', 'max:255'],
            'content' => ['nullable', 'string'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'sort_order' => ['nullable', 'integer', 'min:1'],
        ]);

        $this->service->updateLesson((int) $user->id, $lesson, $payload);

        return back()->with('success', 'Lesson berhasil diperbarui.');
    }

    public function destroyLesson(CourseLesson $lesson): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageLearningModules()) {
            return back()->withErrors(['lessons' => 'Tabel learning modules belum tersedia. Jalankan migrasi terlebih dahulu.']);
        }

        $this->service->deleteLesson((int) $user->id, $lesson);

        return back()->with('success', 'Lesson berhasil dihapus.');
    }

    public function learningPlayer(Request $request, Course $course): Response
    {
        $user = auth()->user();
        abort_if(!$user || $user->role !== 'student', 403);
        $lessonId = $request->query('lesson') ? (int) $request->query('lesson') : null;

        return Inertia::render('Student/LearningPlayer', $this->service->getStudentLearningPlayer((int) $user->id, (int) $course->id, $lessonId));
    }

    public function updateLearningProgress(Request $request, CourseLesson $lesson): RedirectResponse
    {
        $user = auth()->user();
        abort_if(!$user || $user->role !== 'student', 403);

        if (!$this->service->canTrackLessonProgress()) {
            return back()->withErrors(['progress' => 'Tabel lesson progress belum tersedia. Jalankan migrasi terlebih dahulu.']);
        }

        $payload = $request->validate([
            'progress_percent' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $this->service->updateLessonProgress((int) $user->id, $lesson, (int) $payload['progress_percent']);

        return back()->with('success', 'Progress belajar berhasil diperbarui.');
    }

    public function storeCourse(StoreCourseRequest $request): RedirectResponse
    {
        $user = $this->requireLecturer();

        if (!$this->service->canManageCourses()) {
            return back()->withErrors([
                'courses' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->createCourseForLecturer((int) $user->id, $request->validated());

        return back()->with('success', 'Kursus berhasil ditambahkan.');
    }

    public function updateCourse(UpdateCourseRequest $request, Course $course): RedirectResponse
    {
        $user = $this->requireLecturer();

        if (!$this->service->canManageCourses()) {
            return back()->withErrors([
                'courses' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->updateCourseForLecturer((int) $user->id, $course, $request->validated());

        return back()->with('success', 'Kursus berhasil diperbarui.');
    }

    public function destroyCourse(Course $course): RedirectResponse
    {
        $user = $this->requireLecturer();

        if (!$this->service->canManageCourses()) {
            return back()->withErrors([
                'courses' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->deleteCourseForLecturer((int) $user->id, $course);

        return back()->with('success', 'Kursus berhasil dihapus.');
    }

    public function materials(Request $request): Response
    {
        $user = $request->user();
        if ($user && $user->role === 'student') {
            return Inertia::render('Student/Materials');
        }
        if (!$user || $user->role !== 'teacher') {
            return $this->placeholder('Materi', 'Kelola dan akses materi pembelajaran');
        }

        $search = trim((string) $request->query('search', ''));
        $courseId = trim((string) $request->query('course', ''));

        return Inertia::render('Lecturer/Materials', $this->service->getMaterialsData((int) $user->id, $search, $courseId));
    }

    public function storeMaterial(StoreMaterialRequest $request): RedirectResponse
    {
        $user = $this->requireLecturer();

        if (!$this->service->canManageCourseMaterials()) {
            return back()->withErrors([
                'materials' => 'Tabel course_materials belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->storeMaterialForLecturer((int) $user->id, $request->validated());

        return back()->with('success', 'Materi kursus berhasil diunggah.');
    }

    public function destroyMaterial(CourseMaterial $material): RedirectResponse
    {
        $user = $this->requireLecturer();

        if (!$this->service->canManageCourseMaterials()) {
            return back()->withErrors([
                'materials' => 'Tabel course_materials belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->deleteMaterialForLecturer((int) $user->id, $material);

        return back()->with('success', 'Materi kursus berhasil dihapus.');
    }

    public function downloadMaterial(CourseMaterial $material): StreamedResponse
    {
        $user = $this->requireLecturer();

        if (!$this->service->canManageCourseMaterials()) {
            abort(404);
        }

        return $this->service->downloadMaterialForLecturer((int) $user->id, $material);
    }

    public function assignments(Request $request): Response
    {
        $user = $request->user();
        if ($user && $user->role === 'student') {
            return Inertia::render('Student/Assignments', $this->service->getStudentAssignmentsData((int) $user->id));
        }
        if (!$user || $user->role !== 'teacher') {
            return $this->placeholder('Tugas', 'Kelola tugas mahasiswa berdasarkan kursus yang diampu');
        }

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));
        $courseId = trim((string) $request->query('course', ''));

        return Inertia::render('Lecturer/Assignments', $this->service->getAssignmentsData((int) $user->id, $search, $status, $courseId));
    }

    public function assignmentDetail(Request $request, Assignment $assignment): Response|RedirectResponse
    {
        $user = $request->user();
        if (!$user) {
            abort(403);
        }

        if ($user->role === 'student') {
            return Inertia::render('Student/AssignmentDetail', $this->service->getStudentAssignmentDetailData((int) $user->id, (int) $assignment->id));
        }

        if ($user->role === 'teacher') {
            return redirect('/assignments');
        }

        abort(403);
    }

    public function submitAssignment(Request $request, Assignment $assignment): RedirectResponse
    {
        $user = auth()->user();
        abort_if(!$user || $user->role !== 'student', 403);

        $payload = $request->validate([
            'submission_text' => ['required', 'string', 'min:5'],
            'attachment_url' => ['nullable', 'url', 'max:255'],
        ]);

        $this->service->submitAssignment((int) $user->id, $assignment, $payload);

        return back()->with('success', 'Tugas berhasil dikumpulkan.');
    }

    public function storeAssignment(StoreAssignmentRequest $request): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageAssignments()) {
            return back()->withErrors([
                'assignments' => 'Tabel assignments belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->createAssignment((int) $user->id, $request->validated());

        return back()->with('success', 'Tugas berhasil ditambahkan.');
    }

    public function updateAssignment(UpdateAssignmentRequest $request, Assignment $assignment): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageAssignments()) {
            return back()->withErrors([
                'assignments' => 'Tabel assignments belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->updateAssignment((int) $user->id, $assignment, $request->validated());

        return back()->with('success', 'Tugas berhasil diperbarui.');
    }

    public function destroyAssignment(Assignment $assignment): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageAssignments()) {
            return back()->withErrors([
                'assignments' => 'Tabel assignments belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->deleteAssignment((int) $user->id, $assignment);

        return back()->with('success', 'Tugas berhasil dihapus.');
    }

    public function quizzes(Request $request): Response
    {
        $user = $request->user();
        if ($user && $user->role === 'student') {
            return Inertia::render('Student/Quizzes', $this->service->getStudentQuizzesData((int) $user->id));
        }
        if (!$user || $user->role !== 'teacher') {
            return $this->placeholder('Kuis', 'Kelola kuis dan ujian online untuk mahasiswa');
        }

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));
        $courseId = trim((string) $request->query('course', ''));

        return Inertia::render('Lecturer/Quizzes', $this->service->getQuizzesData((int) $user->id, $search, $status, $courseId));
    }

    public function submitQuiz(Request $request, Quiz $quiz): RedirectResponse
    {
        $user = auth()->user();
        abort_if(!$user || $user->role !== 'student', 403);

        $payload = $request->validate([
            'answers' => ['required', 'string', 'min:5'],
        ]);

        $this->service->submitQuiz((int) $user->id, $quiz, $payload);

        return back()->with('success', 'Jawaban kuis berhasil dikirim.');
    }

    public function storeQuiz(StoreQuizRequest $request): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageQuizzes()) {
            return back()->withErrors([
                'quizzes' => 'Tabel quizzes belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->createQuiz((int) $user->id, $request->validated());

        return back()->with('success', 'Kuis berhasil ditambahkan.');
    }

    public function updateQuiz(UpdateQuizRequest $request, Quiz $quiz): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageQuizzes()) {
            return back()->withErrors([
                'quizzes' => 'Tabel quizzes belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->updateQuiz((int) $user->id, $quiz, $request->validated());

        return back()->with('success', 'Kuis berhasil diperbarui.');
    }

    public function destroyQuiz(Quiz $quiz): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageQuizzes()) {
            return back()->withErrors([
                'quizzes' => 'Tabel quizzes belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->deleteQuiz((int) $user->id, $quiz);

        return back()->with('success', 'Kuis berhasil dihapus.');
    }

    public function discussions(Request $request): Response
    {
        $user = $request->user();
        if ($user && $user->role === 'student') {
            return Inertia::render('Student/Discussions');
        }
        if (!$user || $user->role !== 'teacher') {
            return $this->placeholder('Diskusi', 'Forum diskusi antar mahasiswa dan dosen');
        }

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));
        $courseId = trim((string) $request->query('course', ''));

        return Inertia::render('Lecturer/Discussions', $this->service->getDiscussionsData((int) $user->id, $search, $status, $courseId));
    }

    public function storeDiscussion(StoreDiscussionRequest $request): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageDiscussions()) {
            return back()->withErrors([
                'discussions' => 'Tabel discussions belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->createDiscussion((int) $user->id, $request->validated());

        return back()->with('success', 'Diskusi berhasil ditambahkan.');
    }

    public function updateDiscussion(UpdateDiscussionRequest $request, Discussion $discussion): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageDiscussions()) {
            return back()->withErrors([
                'discussions' => 'Tabel discussions belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->updateDiscussion((int) $user->id, $discussion, $request->validated());

        return back()->with('success', 'Diskusi berhasil diperbarui.');
    }

    public function destroyDiscussion(Discussion $discussion): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageDiscussions()) {
            return back()->withErrors([
                'discussions' => 'Tabel discussions belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->deleteDiscussion((int) $user->id, $discussion);

        return back()->with('success', 'Diskusi berhasil dihapus.');
    }

    public function students(Request $request): Response
    {
        $user = $request->user();
        if (!$user || $user->role !== 'teacher') {
            return $this->placeholder('Mahasiswa', 'Daftar mahasiswa yang terdaftar');
        }

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));
        $courseId = trim((string) $request->query('course', ''));

        return Inertia::render('Lecturer/Students', $this->service->getStudentNotesData((int) $user->id, $search, $status, $courseId));
    }

    public function storeStudentNote(StoreStudentNoteRequest $request): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageStudentNotes()) {
            return back()->withErrors([
                'students' => 'Tabel student_notes belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->createStudentNote((int) $user->id, $request->validated());

        return back()->with('success', 'Catatan mahasiswa berhasil ditambahkan.');
    }

    public function updateStudentNote(UpdateStudentNoteRequest $request, StudentNote $note): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageStudentNotes()) {
            return back()->withErrors([
                'students' => 'Tabel student_notes belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->updateStudentNote((int) $user->id, $note, $request->validated());

        return back()->with('success', 'Catatan mahasiswa berhasil diperbarui.');
    }

    public function destroyStudentNote(StudentNote $note): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageStudentNotes()) {
            return back()->withErrors([
                'students' => 'Tabel student_notes belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }
        $this->service->deleteStudentNote((int) $user->id, $note);

        return back()->with('success', 'Catatan mahasiswa berhasil dihapus.');
    }

    public function enrollStudent(EnrollStudentRequest $request): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageEnrollments()) {
            return back()->withErrors([
                'students' => 'Tabel course_student belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->enrollStudent((int) $user->id, $request->validated());

        return back()->with('success', 'Mahasiswa berhasil ditambahkan ke kursus.');
    }

    public function selfEnroll(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(!$user || $user->role !== 'student', 403);

        $payload = $request->validate([
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'enrollment_key' => ['nullable', 'string', 'max:120'],
        ]);

        $this->service->selfEnrollStudent((int) $user->id, $payload);

        return back()->with('success', 'Enrollment kursus berhasil.');
    }

    public function removeEnrollment(int $course, int $student): RedirectResponse
    {
        $user = $this->requireLecturer();
        if (!$this->service->canManageEnrollments()) {
            return back()->withErrors([
                'students' => 'Tabel course_student belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->removeEnrollment((int) $user->id, $course, $student);

        return back()->with('success', 'Mahasiswa berhasil dikeluarkan dari kursus.');
    }

    public function grades(Request $request): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(403);
        }

        if ($user->role === 'student') {
            return Inertia::render('Student/Grades', $this->service->getStudentGradesData((int) $user->id));
        }

        if ($user->role !== 'teacher') {
            return Inertia::render('Placeholder', [
                'title' => 'Nilai',
                'description' => 'Lihat rekap nilai dan progress akademik',
            ]);
        }

        $search = trim((string) $request->query('search', ''));
        $courseId = trim((string) $request->query('course', ''));
        $type = trim((string) $request->query('type', 'all'));
        $status = trim((string) $request->query('status', 'all'));

        return Inertia::render('Lecturer/Grades', $this->service->getGradesDashboardData((int) $user->id, $search, $courseId, $type, $status));
    }

    public function gradeAssignmentSubmission(Request $request, AssignmentSubmission $submission): RedirectResponse
    {
        $user = $this->requireLecturer();

        $maxScore = (int) ($submission->assignment?->max_score ?? 100);
        $payload = $request->validate([
            'score' => ['required', 'integer', 'min:0', 'max:' . max(1, $maxScore)],
            'feedback' => ['nullable', 'string'],
        ]);

        $this->service->gradeAssignmentSubmission((int) $user->id, $submission, $payload);

        return back()->with('success', 'Nilai tugas berhasil disimpan.');
    }

    public function gradeQuizAttempt(Request $request, QuizAttempt $attempt): RedirectResponse
    {
        $user = $this->requireLecturer();

        $payload = $request->validate([
            'score' => ['required', 'integer', 'min:0', 'max:100'],
            'feedback' => ['nullable', 'string'],
        ]);

        $this->service->gradeQuizAttempt((int) $user->id, $attempt, $payload);

        return back()->with('success', 'Nilai kuis berhasil disimpan.');
    }

    private function requireLecturer()
    {
        $user = auth()->user();
        abort_if(!$user || $user->role !== 'teacher', 403);

        return $user;
    }

    private function placeholder(string $title, string $description): Response
    {
        return Inertia::render('Placeholder', [
            'title' => $title,
            'description' => $description,
        ]);
    }
}
