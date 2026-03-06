<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuperAdmin\StoreManagedUserRequest;
use App\Http\Requests\SuperAdmin\UpdateManagedUserRequest;
use App\Models\User;
use App\Services\SuperAdminService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminUserManagementController extends Controller
{
    public function __construct(
        private readonly SuperAdminService $service
    ) {
    }

    public function index(Request $request): Response
    {
        $target = (string) $request->route('target');
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('SuperAdmin/UserCrud', $this->service->getManagedUsersData($target, $search));
    }

    public function store(StoreManagedUserRequest $request): RedirectResponse
    {
        $target = (string) $request->route('target');
        $label = $this->service->createManagedUser($target, $request->validated());

        return back()->with('success', $label . ' berhasil ditambahkan.');
    }

    public function update(UpdateManagedUserRequest $request, User $user): RedirectResponse
    {
        $target = (string) $request->route('target');
        $label = $this->service->updateManagedUser($target, $user, $request->validated());

        return back()->with('success', $label . ' berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $target = (string) $request->route('target');
        $label = $this->service->deleteManagedUser($target, $user);

        return back()->with('success', $label . ' berhasil dihapus.');
    }
}
