<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;

class ValidateAuthService
{
    public function buildCredentials(string $account, string $password): array
    {
        // Check user credential$account code or username
        if (ctype_digit($account)) { 
            $fieldType = 'code'; 
        } else { 
            $fieldType = 'username'; 
        } 

        return [ 
            $fieldType => $account, 
            'password' => $password, 
        ];
    }

    public function authenticate(array $credentials, bool $remember = false): bool
    {
        if (Auth::attempt($credentials, $remember)) {
            session()->regenerate();
            return true;
        }
        return false;
    }

    public function logout(): void
    {
        Auth::logout();
        session()->invalidate();
        session()->regenerateToken();
    }
}
