<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ) {
    }

    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        $authenticated = $this->authService->login(
            $credentials['email'],
            $credentials['password'],
            (bool) ($credentials['remember'] ?? false)
        );

        if (!$authenticated) {
            return back()->withErrors([
                'email' => 'Kredensial tidak valid.',
            ])->onlyInput('email');
        }

        $this->authService->finalizeLoginSession($request);

        return redirect('/dashboard');
    }

    public function logout(Request $request)
    {
        $this->authService->logout($request);

        return Inertia::location('/login');
    }

}
