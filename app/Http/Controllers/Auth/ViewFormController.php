<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Services\ValidateAuthService;
use Illuminate\Support\Facades\Auth;

class ViewFormController extends Controller
{
    protected $authService;

    public function __construct(ValidateAuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login()
    {
        return inertia('Auth/Login');
    }

    // public function register()
    // {
    //     return inertia('Auth/Register');
    // }

    public function authenticate(Request $request)
    {
        $request->validate([
            'account' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // Check credentials account dengan service
        $credentials = $this->authService->buildCredentials(
            $request->account,
            $request->password
        );

        if ($this->authService->authenticate($credentials, $request->boolean('remember'))) {
            $user = Auth::user();

            // Redirect sesuai role 
            switch ($user->role) {
                case 'root':
                    return redirect()->intended(route('root.dashboard'));
                case 'admin':
                    return redirect()->intended(route('admin.dashboard'));
                case 'finance':
                    return redirect()->intended(route('finance.dashboard'));
                case 'teacher':
                    return redirect()->intended(route('teacher.dashboard'))     ;
                case 'student':
                    return redirect()->intended(route('student.home'));
                default:
                    return redirect()->route('login');
            }
        }

        throw ValidationException::withMessages([
            'loginError' => 'Credentials login tidak sesuai.',
        ]);
    }

    public function logout()
    {
        $this->authService->logout();
        return redirect('/login');
    }
}
