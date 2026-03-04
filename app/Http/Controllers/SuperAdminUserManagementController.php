<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminUserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $target = (string) $request->route('target');
        $config = $this->resolveConfig($target);
        $search = trim((string) $request->query('search', ''));

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

        return Inertia::render('SuperAdmin/UserCrud', [
            'title' => $config['title'],
            'description' => $config['description'],
            'target' => $target,
            'endpoint' => $config['endpoint'],
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $target = (string) $request->route('target');
        $config = $this->resolveConfig($target);
        $validated = $this->validatePayload($request);

        User::create([
            ...$validated,
            'role' => $config['role'],
            'type' => $config['type'],
        ]);

        return back()->with('success', $config['singleLabel'] . ' berhasil ditambahkan.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $target = (string) $request->route('target');
        $config = $this->resolveConfig($target);
        $this->ensureUserMatchesTarget($user, $config['role']);

        $validated = $this->validatePayload($request, $user->id, true);

        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'],
            'code' => $validated['code'],
            'role' => $config['role'],
            'type' => $config['type'],
        ];

        if (!empty($validated['password'])) {
            $payload['password'] = $validated['password'];
        }

        $user->update($payload);

        return back()->with('success', $config['singleLabel'] . ' berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $target = (string) $request->route('target');
        $config = $this->resolveConfig($target);
        $this->ensureUserMatchesTarget($user, $config['role']);

        $user->delete();

        return back()->with('success', $config['singleLabel'] . ' berhasil dihapus.');
    }

    private function validatePayload(Request $request, ?int $ignoreId = null, bool $isUpdate = false): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')->ignore($ignoreId)],
            'username' => ['required', 'string', 'max:60', Rule::unique('users', 'username')->ignore($ignoreId)],
            'code' => ['required', 'string', 'max:40', Rule::unique('users', 'code')->ignore($ignoreId)],
            'password' => [$isUpdate ? 'nullable' : 'required', 'string', 'min:6', 'max:72'],
        ]);
    }

    private function ensureUserMatchesTarget(User $user, string $expectedRole): void
    {
        abort_if($user->role !== $expectedRole, 404);
    }

    private function resolveConfig(string $target): array
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
}
