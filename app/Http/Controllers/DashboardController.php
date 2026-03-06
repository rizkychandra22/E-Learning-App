<?php

namespace App\Http\Controllers;

use App\Services\AdminAcademicService;
use App\Services\SuperAdminService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AdminAcademicService $adminAcademicService,
        private readonly SuperAdminService $superAdminService
    ) {
    }

    public function index(): Response
    {
        $authUser = auth()->user();
        $superAdminData = null;
        $adminAcademicData = null;

        if ($authUser?->role === 'root') {
            $superAdminData = $this->superAdminService->getDashboardData();
        }

        if ($authUser?->role === 'admin') {
            $adminAcademicData = $this->adminAcademicService->getDashboardData();
        }

        return Inertia::render('Dashboard', [
            'superAdmin' => $superAdminData,
            'adminAcademic' => $adminAcademicData,
        ]);
    }
}
