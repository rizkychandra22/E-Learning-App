<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningModulesFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_lecturer_can_create_module_and_lesson(): void
    {
        $lecturer = $this->makeUser('teacher', 'TCH-301');
        $course = $this->makeCourse($lecturer->id);

        $moduleResponse = $this->actingAs($lecturer)->post('/learning-modules/modules', [
            'course_id' => $course->id,
            'title' => 'Module 1',
            'description' => 'Dasar pembelajaran',
            'sort_order' => 1,
        ]);

        $moduleResponse->assertRedirect();
        $this->assertDatabaseHas('course_modules', [
            'course_id' => $course->id,
            'title' => 'Module 1',
        ]);

        $module = CourseModule::firstOrFail();

        $lessonResponse = $this->actingAs($lecturer)->post('/learning-modules/lessons', [
            'course_module_id' => $module->id,
            'title' => 'Lesson Video',
            'summary' => 'Pengenalan materi',
            'content_type' => 'video',
            'video_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            'content' => 'Catatan lesson',
            'duration_minutes' => 12,
            'sort_order' => 1,
        ]);

        $lessonResponse->assertRedirect();
        $this->assertDatabaseHas('course_lessons', [
            'course_module_id' => $module->id,
            'title' => 'Lesson Video',
            'content_type' => 'video',
        ]);
    }

    public function test_student_can_update_lesson_progress(): void
    {
        $lecturer = $this->makeUser('teacher', 'TCH-302');
        $student = $this->makeUser('student', 'STD-302');
        $course = $this->makeCourse($lecturer->id);
        $course->students()->attach($student->id, ['enrolled_at' => now()]);

        $module = CourseModule::create([
            'course_id' => $course->id,
            'title' => 'Module 1',
            'sort_order' => 1,
        ]);

        $lesson = CourseLesson::create([
            'course_module_id' => $module->id,
            'title' => 'Lesson 1',
            'content_type' => 'text',
            'content' => 'Isi lesson',
            'duration_minutes' => 10,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($student)->post("/learning/lessons/{$lesson->id}/progress", [
            'progress_percent' => 100,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('lesson_progress', [
            'lesson_id' => $lesson->id,
            'student_id' => $student->id,
            'progress_percent' => 100,
            'is_completed' => 1,
        ]);
    }

    private function makeUser(string $role, string $code): User
    {
        return User::create([
            'name' => ucfirst($role) . ' ' . $code,
            'email' => strtolower($code) . '@example.test',
            'username' => strtolower(str_replace('-', '', $code)),
            'role' => $role,
            'type' => $role === 'student' ? 'nim' : 'nidn',
            'code' => $code,
            'password' => 'password123',
            'email_verified_at' => now(),
        ]);
    }

    private function makeCourse(int $lecturerId): Course
    {
        return Course::create([
            'title' => 'Sprint 3 Course',
            'code' => 'SPR-301',
            'description' => 'Course untuk learning module',
            'lecturer_id' => $lecturerId,
            'level' => 'dasar',
            'semester' => 3,
            'credit_hours' => 2,
            'status' => 'active',
        ]);
    }
}
