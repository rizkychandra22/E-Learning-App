<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\Fakultas;
use App\Models\Jurusan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminAcademicCourseManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_course_with_category_and_tags(): void
    {
        $admin = $this->createUser('admin', 'ADM-001');
        $teacher = $this->createUser('teacher', 'TCH-001');

        $fakultas = Fakultas::create([
            'name' => 'Fakultas Teknik',
            'slug' => 'fakultas-teknik',
            'code' => 'FT',
        ]);

        $jurusan = Jurusan::create([
            'fakultas_id' => $fakultas->id,
            'name' => 'Teknik Informatika',
            'slug' => 'teknik-informatika',
            'code' => 'TI',
        ]);

        $response = $this->actingAs($admin)->post('/manage-courses', [
            'title' => 'Pemrograman Web Modern',
            'code' => 'IF-301',
            'description' => 'Belajar fullstack web.',
            'category' => 'Pemrograman Web',
            'tags' => ['react', 'laravel', 'inertia'],
            'jurusan_id' => $jurusan->id,
            'lecturer_id' => $teacher->id,
            'level' => 'menengah',
            'semester' => 3,
            'credit_hours' => 3,
            'status' => 'active',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('courses', [
            'title' => 'Pemrograman Web Modern',
            'code' => 'IF-301',
            'category' => 'Pemrograman Web',
            'status' => 'active',
        ]);

        $course = Course::where('code', 'IF-301')->firstOrFail();
        $this->assertSame(['react', 'laravel', 'inertia'], $course->tags);
    }

    public function test_admin_can_upload_download_and_delete_course_material(): void
    {
        Storage::fake('public');

        $admin = $this->createUser('admin', 'ADM-002');
        $course = Course::create([
            'title' => 'Algoritma Dasar',
            'code' => 'IF-101',
            'description' => 'Fundamental algoritma.',
            'category' => 'Algoritma',
            'tags' => ['algorithm'],
            'level' => 'dasar',
            'semester' => 1,
            'credit_hours' => 2,
            'status' => 'draft',
        ]);

        $uploadResponse = $this->actingAs($admin)->post("/manage-courses/{$course->id}/materials", [
            'title' => 'Pertemuan 1 - Pengenalan',
            'file' => UploadedFile::fake()->create('pertemuan-1.pdf', 120, 'application/pdf'),
        ]);

        $uploadResponse->assertRedirect();
        $this->assertDatabaseHas('course_materials', [
            'course_id' => $course->id,
            'title' => 'Pertemuan 1 - Pengenalan',
        ]);

        $material = CourseMaterial::query()->where('course_id', $course->id)->firstOrFail();
        Storage::disk('public')->assertExists($material->file_path);

        $downloadResponse = $this->actingAs($admin)->get("/manage-courses/{$course->id}/materials/{$material->id}/download");
        $downloadResponse->assertOk();

        $deleteResponse = $this->actingAs($admin)->delete("/manage-courses/{$course->id}/materials/{$material->id}");
        $deleteResponse->assertRedirect();
        $this->assertDatabaseMissing('course_materials', ['id' => $material->id]);
        Storage::disk('public')->assertMissing($material->file_path);
    }

    private function createUser(string $role, string $code): User
    {
        return User::create([
            'name' => ucfirst($role) . ' User',
            'email' => strtolower($code) . '@example.test',
            'username' => strtolower($code),
            'role' => $role,
            'type' => $role === 'student' ? 'nim' : 'nidn',
            'code' => $code,
            'password' => 'password123',
        ]);
    }
}
