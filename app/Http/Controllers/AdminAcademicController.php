<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminAcademic\StoreCourseRequest;
use App\Http\Requests\AdminAcademic\StoreCourseMaterialRequest;
use App\Http\Requests\AdminAcademic\StoreFakultasRequest;
use App\Http\Requests\AdminAcademic\StoreJurusanRequest;
use App\Http\Requests\AdminAcademic\StoreUserRequest;
use App\Http\Requests\AdminAcademic\UpdateCourseRequest;
use App\Http\Requests\AdminAcademic\UpdateFakultasRequest;
use App\Http\Requests\AdminAcademic\UpdateJurusanRequest;
use App\Http\Requests\AdminAcademic\UpdateSettingsRequest;
use App\Http\Requests\AdminAcademic\UpdateUserRequest;
use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\Fakultas;
use App\Models\Jurusan;
use App\Models\User;
use App\Services\AdminAcademicService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminAcademicController extends Controller
{
    public function __construct(
        private readonly AdminAcademicService $service
    ) {
    }

    public function manageCourses(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));
        $category = trim((string) $request->query('category', 'all'));

        return Inertia::render('AdminAcademic/ManageCourses', $this->service->getManageCoursesData($search, $status, $category));
    }

    public function storeCourse(StoreCourseRequest $request): RedirectResponse
    {
        if (!$this->service->canManageCourses()) {
            return back()->withErrors([
                'courses' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->createCourse($request->validated());

        return back()->with('success', 'Kursus berhasil ditambahkan.');
    }

    public function updateCourse(UpdateCourseRequest $request, Course $course): RedirectResponse
    {
        if (!$this->service->canManageCourses()) {
            return back()->withErrors([
                'courses' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->updateCourse($course, $request->validated());

        return back()->with('success', 'Kursus berhasil diperbarui.');
    }

    public function destroyCourse(Course $course): RedirectResponse
    {
        if (!$this->service->canManageCourses()) {
            return back()->withErrors([
                'courses' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->deleteCourse($course);

        return back()->with('success', 'Kursus berhasil dihapus.');
    }

    public function storeCourseMaterial(StoreCourseMaterialRequest $request, Course $course): RedirectResponse
    {
        if (!$this->service->canManageCourseMaterials()) {
            return back()->withErrors([
                'materials' => 'Tabel course_materials belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->storeCourseMaterial($course, $request->validated(), (int) auth()->id());

        return back()->with('success', 'Materi kursus berhasil diunggah.');
    }

    public function destroyCourseMaterial(Course $course, CourseMaterial $material): RedirectResponse
    {
        if (!$this->service->canManageCourseMaterials()) {
            return back()->withErrors([
                'materials' => 'Tabel course_materials belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $this->service->deleteCourseMaterial($course, $material);

        return back()->with('success', 'Materi kursus berhasil dihapus.');
    }

    public function downloadCourseMaterial(Course $course, CourseMaterial $material): StreamedResponse
    {
        if (!$this->service->canManageCourseMaterials()) {
            abort(404);
        }

        return $this->service->downloadCourseMaterial($course, $material);
    }

    public function manageUsers(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $role = trim((string) $request->query('role', ''));
        $settings = $this->service->getSettings((int) auth()->id());
        $defaultRoleFilter = (string) ($settings['default_user_role_filter'] ?? 'all');
        $showPendingFirst = (bool) ($settings['show_pending_first'] ?? true);

        if ($role === '') {
            $role = $defaultRoleFilter;
        }

        return Inertia::render('AdminAcademic/ManageUsers', $this->service->getManageUsersData($search, $role, $showPendingFirst));
    }

    public function storeUser(StoreUserRequest $request): RedirectResponse
    {
        $this->service->createUser($request->validated(), (int) auth()->id());

        return back()->with('success', 'Data user berhasil ditambahkan.');
    }

    public function updateUser(UpdateUserRequest $request, User $user): RedirectResponse
    {
        abort_if($user->role === 'root', 403);
        $this->service->updateUser($user, $request->validated());

        return back()->with('success', 'Data user berhasil diperbarui.');
    }

    public function destroyUser(User $user): RedirectResponse
    {
        abort_if($user->role === 'root', 403);
        $this->service->deleteUser($user);

        return back()->with('success', 'Data user berhasil dihapus.');
    }

    public function generateJurusanAccounts(Request $request): RedirectResponse
    {
        @set_time_limit(300);
        @ini_set('max_execution_time', '300');

        $validated = $request->validate([
            'students_per_jurusan' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $result = $this->service->generateJurusanAccounts(
            (int) ($validated['students_per_jurusan'] ?? 10),
            3,
            (int) auth()->id()
        );

        if (!($result['ok'] ?? false)) {
            return back()->withErrors([
                'users' => (string) ($result['message'] ?? 'Gagal membuat akun otomatis per jurusan.'),
            ]);
        }

        return back()->with(
            'success',
            "Generate data jurusan selesai: {$result['jurusan_count']} jurusan, {$result['lecturer_count']} dosen, {$result['student_count']} mahasiswa, {$result['course_count']} kursus. Password default akun baru: Kampus12345"
        );
    }

    public function importUsers(Request $request): RedirectResponse
    {
        @set_time_limit(300);
        @ini_set('max_execution_time', '300');

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx', 'max:10240'],
            'default_password' => ['nullable', 'string', 'min:6', 'max:72'],
        ]);

        $result = $this->service->importUsersFromFile(
            $validated['file'],
            (string) ($validated['default_password'] ?? 'Kampus12345'),
            (int) auth()->id()
        );

        if (!($result['ok'] ?? false)) {
            return back()->withErrors([
                'users' => (string) ($result['message'] ?? 'Import user gagal diproses.'),
                'import_errors' => implode(' | ', $result['errors'] ?? []),
            ]);
        }

        $warningText = '';
        if (!empty($result['errors'])) {
            $warningText = ' Catatan: ada beberapa baris dilewati (' . count($result['errors']) . ' error).';
        }

        return back()->with(
            'success',
            "Import user selesai: {$result['created']} dibuat, {$result['updated']} diperbarui, {$result['skipped']} kosong/dilewati." . $warningText
        );
    }

    public function previewImportUsers(Request $request): JsonResponse
    {
        @set_time_limit(180);
        @ini_set('max_execution_time', '180');

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx', 'max:10240'],
            'default_password' => ['nullable', 'string', 'min:6', 'max:72'],
        ]);

        $result = $this->service->previewUsersImportFile(
            $validated['file'],
            (string) ($validated['default_password'] ?? 'Kampus12345')
        );

        if (!($result['ok'] ?? false)) {
            return response()->json([
                'ok' => false,
                'message' => (string) ($result['message'] ?? 'Preview import gagal diproses.'),
            ], 422);
        }

        return response()->json($result);
    }

    public function approvals(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $role = trim((string) $request->query('role', 'all'));

        return Inertia::render('AdminAcademic/Approvals', $this->service->getApprovalsData($search, $role));
    }

    public function approve(User $user): RedirectResponse
    {
        abort_if($user->role === 'root', 403);
        $this->service->approveUser($user);

        return back()->with('success', 'Akun berhasil disetujui.');
    }

    public function reject(User $user): RedirectResponse
    {
        abort_if($user->role === 'root', 403);
        $this->service->rejectUser($user);

        return back()->with('success', 'Akun ditolak dan dihapus.');
    }

    public function approveAll(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['nullable', 'in:all,admin,finance,teacher,student'],
        ]);

        $role = (string) ($validated['role'] ?? 'all');
        $count = $this->service->approveAllPendingByRole($role);
        if ($count <= 0) {
            return back()->withErrors([
                'approvals' => 'Tidak ada akun pending yang sesuai role untuk disetujui.',
            ]);
        }

        return back()->with('success', "Berhasil menyetujui {$count} akun pending untuk role {$role}.");
    }

    public function categories(): Response
    {
        return Inertia::render('AdminAcademic/Categories', $this->service->getCategoriesData());
    }

    public function storeFakultas(StoreFakultasRequest $request): RedirectResponse
    {
        $this->service->createFakultas($request->validated());

        return back()->with('success', 'Fakultas berhasil ditambahkan.');
    }

    public function updateFakultas(UpdateFakultasRequest $request, Fakultas $fakultas): RedirectResponse
    {
        $this->service->updateFakultas($fakultas, $request->validated());

        return back()->with('success', 'Fakultas berhasil diperbarui.');
    }

    public function destroyFakultas(Fakultas $fakultas): RedirectResponse
    {
        $this->service->deleteFakultas($fakultas);

        return back()->with('success', 'Fakultas berhasil dihapus.');
    }

    public function storeJurusan(StoreJurusanRequest $request): RedirectResponse
    {
        $this->service->createJurusan($request->validated());

        return back()->with('success', 'Jurusan berhasil ditambahkan.');
    }

    public function updateJurusan(UpdateJurusanRequest $request, Jurusan $jurusan): RedirectResponse
    {
        $this->service->updateJurusan($jurusan, $request->validated());

        return back()->with('success', 'Jurusan berhasil diperbarui.');
    }

    public function destroyJurusan(Jurusan $jurusan): RedirectResponse
    {
        $this->service->deleteJurusan($jurusan);

        return back()->with('success', 'Jurusan berhasil dihapus.');
    }

    public function settings(): Response
    {
        return Inertia::render('AdminAcademic/Settings', [
            'settings' => $this->service->getSettings((int) auth()->id()),
        ]);
    }

    public function academicReport(Request $request): Response
    {
        $period = trim((string) $request->query('period', 'monthly'));
        $courseId = (int) $request->query('course_id', 0);

        return Inertia::render('AdminAcademic/AcademicReport', $this->service->getAcademicReportData($period, $courseId > 0 ? $courseId : null));
    }

    public function learningAnalytics(Request $request): JsonResponse
    {
        $period = trim((string) $request->query('period', 'monthly'));
        $courseId = (int) $request->query('course_id', 0);

        return response()->json(
            $this->service->getLearningAnalyticsData($period, $courseId > 0 ? $courseId : null)
        );
    }

    public function exportAcademicReport(Request $request): SymfonyResponse|StreamedResponse
    {
        $period = trim((string) $request->query('period', 'monthly'));
        $format = trim((string) $request->query('format', 'csv'));
        $courseId = (int) $request->query('course_id', 0);

        return $this->service->exportAcademicReport($period, $format, $courseId > 0 ? $courseId : null);
    }

    public function updateSettings(UpdateSettingsRequest $request): RedirectResponse
    {
        $updated = $this->service->updateSettings((int) auth()->id(), $request->validated());
        if (!$updated) {
            return back()->withErrors([
                'settings' => 'Tabel system_settings belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        return back()->with('success', 'Pengaturan admin akademik berhasil disimpan.');
    }
}
