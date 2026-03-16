<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthenticationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_user_cannot_login_until_approved(): void
    {
        $user = User::create([
            'name' => 'Pending Student',
            'email' => 'pending.student@example.test',
            'username' => 'pendingstudent',
            'role' => 'student',
            'type' => 'nim',
            'code' => 'NIM-PENDING-1',
            'password' => 'Password123',
            'email_verified_at' => null,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ]);

        $response->assertSessionHasErrors([
            'email' => 'Akun Anda masih menunggu persetujuan admin akademik.',
        ]);
        $this->assertGuest();
    }

    public function test_user_can_request_password_reset_link(): void
    {
        Notification::fake();

        $user = User::create([
            'name' => 'Approved Student',
            'email' => 'approved.student@example.test',
            'username' => 'approvedstudent',
            'role' => 'student',
            'type' => 'nim',
            'code' => 'NIM-APPROVED-1',
            'password' => 'Password123',
            'email_verified_at' => now(),
        ]);

        $response = $this->post('/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertSessionHas('success', 'Jika email terdaftar, tautan reset password telah dikirim.');
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::create([
            'name' => 'Reset Student',
            'email' => 'reset.student@example.test',
            'username' => 'resetstudent',
            'role' => 'student',
            'type' => 'nim',
            'code' => 'NIM-RESET-1',
            'password' => 'Password123',
            'email_verified_at' => now(),
        ]);

        $token = Password::broker()->createToken($user);

        $response = $this->post('/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHas('success', 'Password berhasil diperbarui. Silakan login kembali.');

        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123', $user->password));
    }

    public function test_login_is_rate_limited_after_repeated_failed_attempts(): void
    {
        $user = User::create([
            'name' => 'Limited Student',
            'email' => 'limited.student@example.test',
            'username' => 'limitedstudent',
            'role' => 'student',
            'type' => 'nim',
            'code' => 'NIM-LIMIT-1',
            'password' => 'Password123',
            'email_verified_at' => now(),
        ]);

        foreach (range(1, 5) as $attempt) {
            $this->post('/login', [
                'email' => $user->email,
                'password' => 'WrongPassword123',
            ])->assertSessionHasErrors('email');
        }

        $lockedResponse = $this->post('/login', [
            'email' => $user->email,
            'password' => 'WrongPassword123',
        ]);

        $lockedResponse->assertSessionHasErrors('email');
        $this->assertGuest();
    }
}
