<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseModule;
use App\Models\LessonProgress;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAcademicAnalyticsReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_get_learning_analytics_with_expected_metrics(): void
    {
        $admin = $this->createUser('admin', 'ADM-601');
        $lecturer = $this->createUser('teacher', 'TCH-601');
        $studentA = $this->createUser('student', 'STD-601');
        $studentB = $this->createUser('student', 'STD-602');

        $course = Course::create([
            'title' => 'Analytics Course',
            'code' => 'ANL-601',
            'description' => 'Course untuk validasi analytics.',
            'lecturer_id' => $lecturer->id,
            'level' => 'menengah',
            'semester' => 6,
            'credit_hours' => 3,
            'status' => 'active',
        ]);

        $course->students()->attach($studentA->id, ['enrolled_at' => now()]);
        $course->students()->attach($studentB->id, ['enrolled_at' => now()]);

        $module = CourseModule::create([
            'course_id' => $course->id,
            'title' => 'Module Analytics',
            'sort_order' => 1,
        ]);

        $lessonOne = CourseLesson::create([
            'course_module_id' => $module->id,
            'title' => 'Lesson 1',
            'content_type' => 'text',
            'content' => 'Materi 1',
            'duration_minutes' => 10,
            'sort_order' => 1,
        ]);
        $lessonTwo = CourseLesson::create([
            'course_module_id' => $module->id,
            'title' => 'Lesson 2',
            'content_type' => 'text',
            'content' => 'Materi 2',
            'duration_minutes' => 12,
            'sort_order' => 2,
        ]);

        LessonProgress::create([
            'lesson_id' => $lessonOne->id,
            'student_id' => $studentA->id,
            'progress_percent' => 100,
            'is_completed' => true,
            'completed_at' => now()->subDay(),
            'last_accessed_at' => now()->subDay(),
        ]);
        LessonProgress::create([
            'lesson_id' => $lessonTwo->id,
            'student_id' => $studentA->id,
            'progress_percent' => 50,
            'is_completed' => false,
            'last_accessed_at' => now()->subDay(),
        ]);
        LessonProgress::create([
            'lesson_id' => $lessonOne->id,
            'student_id' => $studentB->id,
            'progress_percent' => 100,
            'is_completed' => true,
            'completed_at' => now()->subHours(10),
            'last_accessed_at' => now()->subHours(10),
        ]);
        LessonProgress::create([
            'lesson_id' => $lessonTwo->id,
            'student_id' => $studentB->id,
            'progress_percent' => 100,
            'is_completed' => true,
            'completed_at' => now()->subHours(8),
            'last_accessed_at' => now()->subHours(8),
        ]);

        $assignment = Assignment::create([
            'course_id' => $course->id,
            'lecturer_id' => $lecturer->id,
            'title' => 'Tugas Analytics',
            'description' => 'Kumpulkan ringkasan.',
            'due_at' => now()->addDays(2),
            'max_score' => 100,
            'status' => 'active',
        ]);
        AssignmentSubmission::create([
            'assignment_id' => $assignment->id,
            'student_id' => $studentA->id,
            'status' => 'graded',
            'score' => 80,
            'graded_at' => now()->subHours(6),
        ]);

        $quiz = Quiz::create([
            'course_id' => $course->id,
            'lecturer_id' => $lecturer->id,
            'title' => 'Quiz Analytics',
            'description' => 'Kuis ringkas.',
            'duration_minutes' => 20,
            'total_questions' => 10,
            'scheduled_at' => now()->subHours(12),
            'status' => 'active',
        ]);
        QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'student_id' => $studentB->id,
            'status' => 'graded',
            'score' => 90,
            'graded_at' => now()->subHours(4),
        ]);

        $response = $this->actingAs($admin)->getJson("/academic-reports/analytics?period=monthly&course_id={$course->id}");

        $response->assertOk();
        $response->assertJsonPath('summary.total_students', 2);
        $response->assertJsonPath('summary.total_lessons', 2);
        $payload = $response->json();
        $this->assertEquals(75.0, (float) data_get($payload, 'summary.completion_rate'));
        $this->assertEquals(100.0, (float) data_get($payload, 'summary.engagement_rate'));
        $this->assertEquals(85.0, (float) data_get($payload, 'summary.average_score'));
    }

    public function test_admin_can_export_academic_report_as_csv_and_pdf_with_filters(): void
    {
        $admin = $this->createUser('admin', 'ADM-602');
        $lecturer = $this->createUser('teacher', 'TCH-602');

        $course = Course::create([
            'title' => 'Export Analytics Course',
            'code' => 'ANL-602',
            'description' => 'Course untuk uji export report.',
            'lecturer_id' => $lecturer->id,
            'level' => 'dasar',
            'semester' => 2,
            'credit_hours' => 2,
            'status' => 'active',
        ]);

        $csvResponse = $this->actingAs($admin)->get("/academic-reports/export?period=monthly&format=csv&course_id={$course->id}");
        $csvResponse->assertOk();
        $csvResponse->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $pdfResponse = $this->actingAs($admin)->get("/academic-reports/export?period=monthly&format=pdf&course_id={$course->id}");
        $pdfResponse->assertOk();
        $pdfResponse->assertHeader('content-type', 'application/pdf');
    }

    private function createUser(string $role, string $code): User
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
}
