<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Services\AuthService;
use App\Services\SystemSettingService;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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

    public function showForgotPassword(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function showResetPassword(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => (string) $request->query('email', ''),
        ]);
    }

    public function login(LoginRequest $request): RedirectResponse
    {
        $request->ensureIsNotRateLimited();
        $credentials = $request->validated();
        $user = $this->authService->findByIdentity($credentials['email']);

        if (!$user) {
            $request->hitRateLimiter();

            return back()->withErrors([
                'email' => 'Kredensial tidak valid.',
            ])->onlyInput('email');
        }

        if ($user->role !== 'root' && $user->email_verified_at === null) {
            return back()->withErrors([
                'email' => 'Akun Anda masih menunggu persetujuan admin akademik.',
            ])->onlyInput('email');
        }

        $authenticated = $this->authService->login(
            $user->email,
            $credentials['password'],
            (bool) ($credentials['remember'] ?? false)
        );

        if (!$authenticated) {
            $request->hitRateLimiter();

            return back()->withErrors([
                'email' => 'Kredensial tidak valid.',
            ])->onlyInput('email');
        }

        $request->clearRateLimiter();

        if ($this->systemSettings->isMaintenanceMode() && auth()->user()?->role !== 'root') {
            $this->authService->logout($request);
            return redirect()->route('maintenance.notice');
        }

        $this->authService->finalizeLoginSession($request);

        return redirect('/dashboard');
    }

    public function register(RegisterRequest $request): RedirectResponse
    {
        if (!$this->systemSettings->isRegistrationAllowed()) {
            return redirect('/login')->withErrors([
                'register' => 'Pendaftaran akun saat ini tidak dibuka.',
            ]);
        }

        $validated = $request->validated();

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

        return redirect('/login')->with('success', 'Registrasi berhasil. Akun Anda akan aktif setelah disetujui admin akademik.');
    }

    public function sendResetLink(ForgotPasswordRequest $request): RedirectResponse
    {
        Password::sendResetLink($request->validated());

        return back()->with('success', 'Jika email terdaftar, tautan reset password telah dikirim.');
    }

    public function resetPassword(ResetPasswordRequest $request): RedirectResponse
    {
        $status = Password::reset(
            $request->validated(),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return back()->withErrors([
                'email' => __($status),
            ])->onlyInput('email');
        }

        return redirect('/login')->with('success', 'Password berhasil diperbarui. Silakan login kembali.');
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
