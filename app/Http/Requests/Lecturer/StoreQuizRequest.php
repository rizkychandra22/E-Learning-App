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
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'duration_minutes' => ['nullable', 'integer', 'min:5', 'max:240'],
            'total_questions' => ['nullable', 'integer', 'min:1', 'max:200'],
            'scheduled_at' => ['nullable', 'date'],
            'status' => ['required', 'in:draft,active,closed'],
        ];
    }
}
