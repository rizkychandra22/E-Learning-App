<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Fakultas;
use App\Models\Jurusan;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminAcademicController extends Controller
{
    public function manageCourses(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', 'all'));
        $migrationRequired = !Schema::hasTable('courses');

        $courses = collect();
        if (!$migrationRequired) {
            $courses = Course::query()
                ->with(['jurusan:id,name,fakultas_id', 'jurusan.fakultas:id,name', 'lecturer:id,name'])
                ->when($status !== 'all', fn ($query) => $query->where('status', $status))
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

        return Inertia::render('AdminAcademic/ManageCourses', [
            'courses' => $courses,
            'jurusans' => $jurusans,
            'lecturers' => $lecturers,
            'migrationRequired' => $migrationRequired,
            'filters' => [
                'search' => $search,
                'status' => in_array($status, ['all', 'draft', 'active', 'archived'], true) ? $status : 'all',
            ],
        ]);
    }

    public function storeCourse(Request $request): RedirectResponse
    {
        if (!Schema::hasTable('courses')) {
            return back()->withErrors([
                'courses' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $validated = $this->validateCoursePayload($request);
        Course::create($validated);

        return back()->with('success', 'Kursus berhasil ditambahkan.');
    }

    public function updateCourse(Request $request, Course $course): RedirectResponse
    {
        if (!Schema::hasTable('courses')) {
            return back()->withErrors([
                'courses' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $validated = $this->validateCoursePayload($request, $course->id);
        $course->update($validated);

        return back()->with('success', 'Kursus berhasil diperbarui.');
    }

    public function destroyCourse(Course $course): RedirectResponse
    {
        if (!Schema::hasTable('courses')) {
            return back()->withErrors([
                'courses' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $course->delete();

        return back()->with('success', 'Kursus berhasil dihapus.');
    }

    public function manageUsers(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $role = trim((string) $request->query('role', 'all'));

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

        return Inertia::render('AdminAcademic/ManageUsers', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $selectedRole,
            ],
        ]);
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $validated = $this->validateUserPayload($request);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'],
            'role' => $validated['role'],
            'type' => $validated['role'] === 'student' ? 'nim' : 'nidn',
            'code' => $validated['code'],
            'password' => $validated['password'],
        ]);

        return back()->with('success', 'Data user berhasil ditambahkan.');
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        abort_if($user->role === 'root', 403);
        $validated = $this->validateUserPayload($request, $user->id, true);

        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'],
            'role' => $validated['role'],
            'type' => $validated['role'] === 'student' ? 'nim' : 'nidn',
            'code' => $validated['code'],
        ];

        if (!empty($validated['password'])) {
            $payload['password'] = $validated['password'];
        }

        $user->update($payload);

        return back()->with('success', 'Data user berhasil diperbarui.');
    }

    public function destroyUser(User $user): RedirectResponse
    {
        abort_if($user->role === 'root', 403);
        $user->delete();

        return back()->with('success', 'Data user berhasil dihapus.');
    }

    public function approvals(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

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

        return Inertia::render('AdminAcademic/Approvals', [
            'pendingUsers' => $pendingUsers,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function approve(User $user): RedirectResponse
    {
        abort_if($user->role === 'root', 403);
        $user->update([
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Akun berhasil disetujui.');
    }

    public function reject(User $user): RedirectResponse
    {
        abort_if($user->role === 'root', 403);
        $user->delete();

        return back()->with('success', 'Akun ditolak dan dihapus.');
    }

    public function categories(): Response
    {
        $fakultas = Fakultas::query()
            ->with(['jurusans' => fn ($query) => $query->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'slug']);

        return Inertia::render('AdminAcademic/Categories', [
            'fakultas' => $fakultas,
        ]);
    }

    public function storeFakultas(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:20', Rule::unique('fakultas', 'code')],
        ]);

        Fakultas::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'slug' => Str::slug($validated['name']),
        ]);

        return back()->with('success', 'Fakultas berhasil ditambahkan.');
    }

    public function updateFakultas(Request $request, Fakultas $fakultas): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:20', Rule::unique('fakultas', 'code')->ignore($fakultas->id)],
        ]);

        $fakultas->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'slug' => Str::slug($validated['name']),
        ]);

        return back()->with('success', 'Fakultas berhasil diperbarui.');
    }

    public function destroyFakultas(Fakultas $fakultas): RedirectResponse
    {
        $fakultas->delete();

        return back()->with('success', 'Fakultas berhasil dihapus.');
    }

    public function storeJurusan(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'fakultas_id' => ['required', 'integer', 'exists:fakultas,id'],
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:20', Rule::unique('jurusans', 'code')],
        ]);

        Jurusan::create([
            'fakultas_id' => $validated['fakultas_id'],
            'name' => $validated['name'],
            'code' => $validated['code'],
            'slug' => Str::slug($validated['name']),
        ]);

        return back()->with('success', 'Jurusan berhasil ditambahkan.');
    }

    public function updateJurusan(Request $request, Jurusan $jurusan): RedirectResponse
    {
        $validated = $request->validate([
            'fakultas_id' => ['required', 'integer', 'exists:fakultas,id'],
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:20', Rule::unique('jurusans', 'code')->ignore($jurusan->id)],
        ]);

        $jurusan->update([
            'fakultas_id' => $validated['fakultas_id'],
            'name' => $validated['name'],
            'code' => $validated['code'],
            'slug' => Str::slug($validated['name']),
        ]);

        return back()->with('success', 'Jurusan berhasil diperbarui.');
    }

    public function destroyJurusan(Jurusan $jurusan): RedirectResponse
    {
        $jurusan->delete();

        return back()->with('success', 'Jurusan berhasil dihapus.');
    }

    public function settings(): Response
    {
        return Inertia::render('AdminAcademic/Settings', [
            'settings' => $this->getAdminSettingsMap(),
        ]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'dashboard_refresh_seconds' => ['required', 'integer', 'min:10', 'max:300'],
            'show_pending_first' => ['required', 'boolean'],
            'enable_user_email_notification' => ['required', 'boolean'],
            'default_user_role_filter' => ['required', 'in:all,teacher,student,finance,admin'],
        ]);

        if (!Schema::hasTable('system_settings')) {
            return back()->withErrors([
                'settings' => 'Tabel system_settings belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        $prefix = $this->settingsPrefix();
        foreach ($validated as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $prefix . $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        return back()->with('success', 'Pengaturan admin akademik berhasil disimpan.');
    }

    public function dashboardData(): array
    {
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
    }

    private function validateUserPayload(Request $request, ?int $ignoreId = null, bool $isUpdate = false): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')->ignore($ignoreId)],
            'username' => ['required', 'string', 'max:60', Rule::unique('users', 'username')->ignore($ignoreId)],
            'role' => ['required', 'in:admin,finance,teacher,student'],
            'code' => ['required', 'string', 'max:40', Rule::unique('users', 'code')->ignore($ignoreId)],
            'password' => [$isUpdate ? 'nullable' : 'required', 'string', 'min:6', 'max:72'],
        ]);
    }

    private function validateCoursePayload(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'code' => ['required', 'string', 'max:40', Rule::unique('courses', 'code')->ignore($ignoreId)],
            'description' => ['nullable', 'string', 'max:2000'],
            'jurusan_id' => ['nullable', 'integer', 'exists:jurusans,id'],
            'lecturer_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'teacher'))],
            'level' => ['required', 'in:dasar,menengah,lanjutan'],
            'semester' => ['nullable', 'integer', 'min:1', 'max:14'],
            'credit_hours' => ['required', 'integer', 'min:1', 'max:8'],
            'status' => ['required', 'in:draft,active,archived'],
        ]);
    }

    private function getAdminSettingsMap(): array
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

        $prefix = $this->settingsPrefix();
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

    private function settingsPrefix(): string
    {
        return 'admin_' . auth()->id() . '_';
    }
}
