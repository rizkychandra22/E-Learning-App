<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssessmentFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_submit_assignment_and_lecturer_can_grade_it(): void
    {
        [$lecturer, $student, $course] = $this->prepareCourseFlow();
        $assignment = Assignment::create([
            'course_id' => $course->id,
            'lecturer_id' => $lecturer->id,
            'title' => 'Tugas Sprint 4',
            'description' => 'Kumpulkan hasil implementasi.',
            'due_at' => now()->addDays(2),
            'max_score' => 100,
            'status' => 'active',
        ]);

        $submitResponse = $this->actingAs($student)->post("/assignments/{$assignment->id}/submit", [
            'submission_text' => 'Berikut link dan ringkasan hasil tugas saya.',
            'attachment_url' => 'https://example.test/assignment-1',
        ]);

        $submitResponse->assertRedirect();
        $this->assertDatabaseHas('assignment_submissions', [
            'assignment_id' => $assignment->id,
            'student_id' => $student->id,
            'status' => 'submitted',
        ]);

        $submissionId = (int) \App\Models\AssignmentSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->where('student_id', $student->id)
            ->value('id');

        $gradeResponse = $this->actingAs($lecturer)->put("/grades/assignments/{$submissionId}", [
            'score' => 92,
            'feedback' => 'Analisis bagus, lanjutkan perapian dokumentasi.',
        ]);

        $gradeResponse->assertRedirect();
        $this->assertDatabaseHas('assignment_submissions', [
            'id' => $submissionId,
            'status' => 'graded',
            'score' => 92,
        ]);

        $studentGradesResponse = $this->actingAs($student)->get('/grades');
        $studentGradesResponse->assertOk();
        $studentGradesResponse->assertSee('92');
    }

    public function test_student_can_submit_quiz_and_lecturer_can_grade_it(): void
    {
        [$lecturer, $student, $course] = $this->prepareCourseFlow();
        $quiz = Quiz::create([
            'course_id' => $course->id,
            'lecturer_id' => $lecturer->id,
            'title' => 'Kuis Sprint 4',
            'description' => 'Jawab seluruh pertanyaan.',
            'duration_minutes' => 30,
            'total_questions' => 10,
            'scheduled_at' => now()->addHour(),
            'status' => 'active',
        ]);

        $submitResponse = $this->actingAs($student)->post("/quizzes/{$quiz->id}/submit", [
            'answers' => 'Jawaban kuis mahasiswa untuk seluruh pertanyaan.',
        ]);

        $submitResponse->assertRedirect();
        $this->assertDatabaseHas('quiz_attempts', [
            'quiz_id' => $quiz->id,
            'student_id' => $student->id,
            'status' => 'submitted',
        ]);

        $attemptId = (int) \App\Models\QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('student_id', $student->id)
            ->value('id');

        $gradeResponse = $this->actingAs($lecturer)->put("/grades/quizzes/{$attemptId}", [
            'score' => 88,
            'feedback' => 'Jawaban sudah benar, tingkatkan ketelitian.',
        ]);

        $gradeResponse->assertRedirect();
        $this->assertDatabaseHas('quiz_attempts', [
            'id' => $attemptId,
            'status' => 'graded',
            'score' => 88,
        ]);

        $studentGradesResponse = $this->actingAs($student)->get('/grades');
        $studentGradesResponse->assertOk();
        $studentGradesResponse->assertSee('88');
    }

    private function prepareCourseFlow(): array
    {
        $lecturer = $this->createUser('teacher', 'TCH-401');
        $student = $this->createUser('student', 'STD-401');

        $course = Course::create([
            'title' => 'Assessment Course',
            'code' => 'ASM-401',
            'description' => 'Course untuk test assessment flow.',
            'lecturer_id' => $lecturer->id,
            'level' => 'menengah',
            'semester' => 4,
            'credit_hours' => 3,
            'status' => 'active',
        ]);

        $course->students()->attach($student->id, ['enrolled_at' => now()]);

        return [$lecturer, $student, $course];
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
