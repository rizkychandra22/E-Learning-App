<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginRedirectSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_user_can_login_and_redirect_to_dashboard(): void
    {
        User::create([
            'name' => 'Super Admin',
            'email' => 'super@univ.ac.id',
            'username' => 'superadmin',
            'role' => 'root',
            'type' => 'nidn',
            'code' => '0120517320000',
            'password' => 'password',
            'email_verified_at' => now(),
        ]);

        $response = $this->post('/login', [
            'email' => 'super@univ.ac.id',
            'password' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $dashboard = $this->get('/dashboard');
        $dashboard->assertOk();
    }
}
