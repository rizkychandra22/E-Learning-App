<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Fakultas;
use App\Models\InAppNotification;
use App\Models\Jurusan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentNotificationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_self_enroll_and_receive_notifications(): void
    {
        $jurusan = $this->createJurusan();
        $lecturer = $this->createUser('teacher', 'TCH-501', $jurusan->id);
        $student = $this->createUser('student', 'STD-501', $jurusan->id);
        $course = $this->createCourse($lecturer->id, 'JOIN-501', $jurusan->id);

        $response = $this->actingAs($student)->post('/my-courses/enroll', [
            'course_id' => $course->id,
            'enrollment_key' => 'JOIN-501',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('course_student', [
            'course_id' => $course->id,
            'student_id' => $student->id,
        ]);

        $this->assertDatabaseHas('in_app_notifications', [
            'user_id' => $student->id,
            'type' => 'enrollment',
            'title' => 'Enrollment berhasil',
        ]);

        $this->assertDatabaseHas('in_app_notifications', [
            'user_id' => $lecturer->id,
            'type' => 'enrollment',
        ]);

        $notificationPage = $this->actingAs($student)->get('/notifications');
        $notificationPage->assertOk();
        $notificationPage->assertSee('Enrollment berhasil');
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $student = $this->createUser('student', 'STD-502');

        InAppNotification::create([
            'user_id' => $student->id,
            'type' => 'system',
            'title' => 'Notifikasi test',
            'message' => 'Testing read all.',
        ]);

        $response = $this->actingAs($student)->put('/notifications/read-all');

        $response->assertRedirect();
        $this->assertDatabaseMissing('in_app_notifications', [
            'user_id' => $student->id,
            'read_at' => null,
        ]);
    }

    private function createUser(string $role, string $code, ?int $jurusanId = null): User
    {
        return User::create([
            'name' => ucfirst($role) . ' ' . $code,
            'email' => strtolower($code) . '@example.test',
            'username' => strtolower(str_replace('-', '', $code)),
            'role' => $role,
            'type' => $role === 'student' ? 'nim' : 'nidn',
            'code' => $code,
            'jurusan_id' => $jurusanId,
            'password' => 'password123',
            'email_verified_at' => now(),
        ]);
    }

    private function createCourse(int $lecturerId, string $enrollmentKey, int $jurusanId): Course
    {
        return Course::create([
            'title' => 'Sprint 5 Course',
            'code' => 'SPR-501',
            'description' => 'Course untuk enrollment & notification.',
            'jurusan_id' => $jurusanId,
            'lecturer_id' => $lecturerId,
            'level' => 'dasar',
            'semester' => 5,
            'credit_hours' => 2,
            'status' => 'active',
            'allow_self_enrollment' => true,
            'enrollment_key' => $enrollmentKey,
        ]);
    }

    private function createJurusan(): Jurusan
    {
        $fakultas = Fakultas::create([
            'name' => 'Fakultas Test',
            'code' => '90',
            'slug' => 'fakultas-test',
        ]);

        return Jurusan::create([
            'fakultas_id' => $fakultas->id,
            'name' => 'Teknik Test',
            'code' => '91',
            'slug' => 'teknik-test',
        ]);
    }
}
