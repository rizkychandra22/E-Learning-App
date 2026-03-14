<?php

namespace App\Http\Controllers;

use App\Services\AdminAcademicService;
use App\Services\FinanceService;
use App\Services\SuperAdminService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AdminAcademicService $adminAcademicService,
        private readonly SuperAdminService $superAdminService,
        private readonly FinanceService $financeService
    ) {
    }

    public function index(): Response
    {
        $authUser = auth()->user();
        $superAdminData = null;
        $adminAcademicData = null;
        $financeData = null;

        if ($authUser?->role === 'student') {
            return Inertia::render('Student/Home');
        }

        if ($authUser?->role === 'root') {
            $superAdminData = $this->superAdminService->getDashboardData();
        }

        if ($authUser?->role === 'admin') {
            $adminAcademicData = $this->adminAcademicService->getDashboardData();
        }

        if ($authUser?->role === 'finance') {
            $financeData = $this->financeService->getDashboardData();
        }

        return Inertia::render('Dashboard', [
            'superAdmin' => $superAdminData,
            'adminAcademic' => $adminAcademicData,
            'financeData' => $financeData,
        ]);
    }
}
