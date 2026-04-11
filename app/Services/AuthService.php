<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthService
{
    public function findByIdentity(string $identity): ?User
    {
        $trimmedIdentity = trim($identity);

        if ($trimmedIdentity === '') {
            return null;
        }

        return User::query()
            ->where('email', $trimmedIdentity)
            ->orWhere('username', $trimmedIdentity)
            ->orWhere('code', $trimmedIdentity)
            ->first();
    }

    public function login(string $identity, string $password, bool $remember = false): bool
    {
        $user = $this->findByIdentity($identity);

        if (!$user) {
            return false;
        }

        return $this->loginWithUser($user, $password, $remember);
    }

    public function loginWithUser(User $user, string $password, bool $remember = false): bool
    {
        return Auth::attempt(
            ['email' => $user->email, 'password' => $password],
            $remember
        );
    }

    public function finalizeLoginSession(Request $request): void
    {
        $request->session()->regenerate();
        $request->session()->forget('url.intended');
    }

    public function logout(Request $request): void
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
