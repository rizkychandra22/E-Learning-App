<?php

namespace Tests\Feature;

use App\Models\Fakultas;
use App\Models\Jurusan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_academic_can_create_update_and_delete_managed_user(): void
    {
        $adminAcademic = $this->makeUser('admin', 'ADM-100');
        $jurusan = $this->makeJurusan();

        $createResponse = $this->actingAs($adminAcademic)->post('/manage-users', [
            'name' => 'Dosen Baru',
            'email' => 'dosen.baru@example.test',
            'username' => 'dosenbaru',
            'role' => 'teacher',
            'code' => 'TCH-900',
            'jurusan_id' => $jurusan->id,
            'password' => 'secret123',
        ]);

        $createResponse->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'dosen.baru@example.test',
            'role' => 'teacher',
            'type' => 'nidn',
        ]);

        $managed = User::where('email', 'dosen.baru@example.test')->firstOrFail();

        $updateResponse = $this->actingAs($adminAcademic)->put("/manage-users/{$managed->id}", [
            'name' => 'Mahasiswa Migrasi',
            'email' => 'mahasiswa.migrasi@example.test',
            'username' => 'mahasiswamigrasi',
            'role' => 'student',
            'code' => 'STD-901',
            'jurusan_id' => $jurusan->id,
            'password' => '',
        ]);

        $updateResponse->assertRedirect();
        $managed->refresh();
        $this->assertSame('student', $managed->role);
        $this->assertSame('nim', $managed->type);
        $this->assertSame('mahasiswa.migrasi@example.test', $managed->email);

        $deleteResponse = $this->actingAs($adminAcademic)->delete("/manage-users/{$managed->id}");
        $deleteResponse->assertRedirect();

        $this->assertDatabaseMissing('users', [
            'id' => $managed->id,
        ]);
    }

    public function test_admin_academic_cannot_modify_root_user(): void
    {
        $adminAcademic = $this->makeUser('admin', 'ADM-200');
        $root = $this->makeUser('root', 'ROOT-001');

        $response = $this->actingAs($adminAcademic)->put("/manage-users/{$root->id}", [
            'name' => 'Root Renamed',
            'email' => 'root.renamed@example.test',
            'username' => 'rootrenamed',
            'role' => 'admin',
            'code' => 'ADM-201',
            'password' => '',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('users', [
            'id' => $root->id,
            'role' => 'root',
            'email' => $root->email,
        ]);
    }

    public function test_super_admin_endpoint_assigns_role_based_on_target(): void
    {
        $root = $this->makeUser('root', 'ROOT-100');
        $jurusan = $this->makeJurusan();

        $createResponse = $this->actingAs($root)->post('/manage-lecturers', [
            'name' => 'Lecturer One',
            'email' => 'lecturer.one@example.test',
            'username' => 'lecturerone',
            'code' => 'LC-001',
            'jurusan_id' => $jurusan->id,
            'password' => 'secret123',
        ]);

        $createResponse->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'lecturer.one@example.test',
            'role' => 'teacher',
            'type' => 'nidn',
        ]);
    }

    public function test_super_admin_cannot_update_user_with_wrong_target_endpoint(): void
    {
        $root = $this->makeUser('root', 'ROOT-200');
        $student = $this->makeUser('student', 'STD-200');

        $response = $this->actingAs($root)->put("/manage-lecturers/{$student->id}", [
            'name' => 'Not Allowed',
            'email' => 'not.allowed@example.test',
            'username' => 'notallowed',
            'code' => 'LC-404',
            'password' => '',
        ]);

        $response->assertNotFound();
        $this->assertDatabaseHas('users', [
            'id' => $student->id,
            'role' => 'student',
            'email' => $student->email,
        ]);
    }

    private function makeUser(string $role, string $code): User
    {
        return User::create([
            'name' => ucfirst($role) . ' User ' . $code,
            'email' => strtolower($code) . '@example.test',
            'username' => strtolower(str_replace('-', '', $code)),
            'role' => $role,
            'type' => $role === 'student' ? 'nim' : 'nidn',
            'code' => $code,
            'password' => 'password123',
        ]);
    }

    private function makeJurusan(): Jurusan
    {
        $fakultas = Fakultas::create([
            'name' => 'Fakultas Test',
            'code' => '99',
            'slug' => 'fakultas-test',
        ]);

        return Jurusan::create([
            'fakultas_id' => $fakultas->id,
            'name' => 'Jurusan Test',
            'code' => '98',
            'slug' => 'jurusan-test',
        ]);
    }
}
