<?php

namespace App\Http\Requests\Lecturer;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:2000'],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'duration_minutes' => ['nullable', 'integer', 'min:5', 'max:240'],
            'total_questions' => ['nullable', 'integer', 'min:1', 'max:200'],
            'scheduled_at' => ['nullable', 'date'],
            'due_at' => ['required', 'date', 'after_or_equal:scheduled_at'],
            'status' => ['required', 'in:draft,active,closed'],
            'questions' => ['required', 'array', 'min:1', 'max:200'],
            'questions.*.question_text' => ['required_with:questions', 'string', 'max:2000'],
            'questions.*.question_type' => ['required_with:questions', 'in:objective,essay'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*' => ['nullable', 'string', 'max:500'],
            'questions.*.correct_answer' => ['nullable', 'string', 'max:1000'],
            'questions.*.points' => ['nullable', 'integer', 'min:1', 'max:100'],
            'questions.*.sort_order' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
