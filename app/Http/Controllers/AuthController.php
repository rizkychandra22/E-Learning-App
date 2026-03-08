<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use App\Services\SystemSettingService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly SystemSettingService $systemSettings
    ) {
    }

    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function showRegister()
    {
        if (!$this->systemSettings->isRegistrationAllowed()) {
            return redirect('/login')->withErrors([
                'register' => 'Pendaftaran akun saat ini tidak dibuka.',
            ]);
        }

        return Inertia::render('Auth/Register');
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

        if ($this->systemSettings->isMaintenanceMode() && auth()->user()?->role !== 'root') {
            $this->authService->logout($request);
            return redirect()->route('maintenance.notice');
        }

        $this->authService->finalizeLoginSession($request);

        return redirect('/dashboard');
    }

    public function register(Request $request): RedirectResponse
    {
        if (!$this->systemSettings->isRegistrationAllowed()) {
            return redirect('/login')->withErrors([
                'register' => 'Pendaftaran akun saat ini tidak dibuka.',
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'max:60', Rule::unique('users', 'username')],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:6'],
        ]);

        User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'student',
            'type' => 'nim',
            'code' => $this->generateStudentCode(),
        ]);

        if ($this->systemSettings->shouldNotifyOnNewUser()) {
            Log::info('New user registration created.', [
                'email' => $validated['email'],
                'role' => 'student',
                'source' => 'self-register',
            ]);
        }

        return redirect('/login')->with('success', 'Registrasi berhasil. Silakan login.');
    }

    public function logout(Request $request)
    {
        $this->authService->logout($request);

        return Inertia::location('/login');
    }

    private function generateStudentCode(): string
    {
        do {
            $code = 'NIM' . now()->format('ymdHis') . random_int(10, 99);
        } while (User::query()->where('code', $code)->exists());

        return $code;
    }
}
