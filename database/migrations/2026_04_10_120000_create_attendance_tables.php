<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('course_material_id')->nullable()->constrained('course_materials')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 180);
            $table->unsignedSmallInteger('meeting_number')->nullable();
            $table->dateTime('opens_at');
            $table->dateTime('closes_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['course_id', 'meeting_number']);
            $table->index(['course_id', 'opens_at']);
        });

        Schema::create('attendance_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained('attendance_sessions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 20)->default('present');
            $table->dateTime('checked_in_at');
            $table->timestamps();

            $table->unique(['attendance_session_id', 'student_id'], 'attendance_unique_session_student');
            $table->index(['student_id', 'checked_in_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('attendance_sessions');
    }
};

