<?php

namespace App\Http\Controllers;

use App\Services\AdminAcademicService;
use App\Services\FinanceService;
use App\Services\LecturerService;
use App\Services\SuperAdminService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AdminAcademicService $adminAcademicService,
        private readonly SuperAdminService $superAdminService,
        private readonly FinanceService $financeService,
        private readonly LecturerService $lecturerService
    ) {
    }

    public function index(): Response
    {
        $authUser = auth()->user();
        $superAdminData = null;
        $adminAcademicData = null;
        $adminAcademicSettings = null;
        $financeData = null;
        $lecturerData = null;

        if ($authUser?->role === 'student') {
            return Inertia::render('Student/Home', $this->lecturerService->getStudentHomeData((int) $authUser->id));
        }

        if ($authUser?->role === 'root') {
            $superAdminData = $this->superAdminService->getDashboardData();
        }

        if ($authUser?->role === 'admin') {
            $adminAcademicData = $this->adminAcademicService->getDashboardData();
            $adminAcademicSettings = $this->adminAcademicService->getSettings((int) $authUser->id);
        }

        if ($authUser?->role === 'finance') {
            $financeData = $this->financeService->getDashboardData();
        }

        if ($authUser?->role === 'teacher') {
            $lecturerData = $this->lecturerService->getDashboardData((int) $authUser->id);
        }

        return Inertia::render('Dashboard', [
            'superAdmin' => $superAdminData,
            'adminAcademic' => $adminAcademicData,
            'adminAcademicSettings' => $adminAcademicSettings,
            'financeData' => $financeData,
            'lecturerData' => $lecturerData,
        ]);
    }
}
