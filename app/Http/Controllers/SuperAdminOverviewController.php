<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuperAdmin\UpdateSettingsRequest;
use App\Services\SuperAdminService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminOverviewController extends Controller
{
    public function __construct(
        private readonly SuperAdminService $service
    ) {
    }

    public function statistics(): Response
    {
        return Inertia::render('SuperAdmin/Statistics', $this->service->getStatisticsData());
    }

    public function activityLogs(Request $request): Response
    {
        $query = trim((string) $request->query('q', ''));
        $type = trim((string) $request->query('type', 'all'));

        return Inertia::render('SuperAdmin/ActivityLogs', $this->service->getActivityLogsData($query, $type));
    }

    public function settings(): Response
    {
        return Inertia::render('SuperAdmin/Settings', [
            'settings' => $this->service->getSettings(),
        ]);
    }

    public function updateSettings(UpdateSettingsRequest $request): RedirectResponse
    {
        $updated = $this->service->updateSettings($request->validated());
        if (!$updated) {
            return back()->withErrors([
                'settings' => 'Tabel system_settings belum tersedia. Jalankan migrasi terlebih dahulu.',
            ]);
        }

        return back()->with('success', 'Pengaturan berhasil diperbarui.');
    }
}
