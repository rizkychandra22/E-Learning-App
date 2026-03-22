<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('assignments')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->text('submission_text')->nullable();
            $table->string('attachment_url')->nullable();
            $table->enum('status', ['draft', 'submitted', 'graded'])->default('draft');
            $table->unsignedSmallInteger('score')->nullable();
            $table->text('feedback')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->dateTime('graded_at')->nullable();
            $table->timestamps();

            $table->unique(['assignment_id', 'student_id']);
        });

        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->text('answers')->nullable();
            $table->enum('status', ['in_progress', 'submitted', 'graded'])->default('in_progress');
            $table->unsignedSmallInteger('score')->nullable();
            $table->text('feedback')->nullable();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->dateTime('graded_at')->nullable();
            $table->timestamps();

            $table->unique(['quiz_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('assignment_submissions');
    }
};
