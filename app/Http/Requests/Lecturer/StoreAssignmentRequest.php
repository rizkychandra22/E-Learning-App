<?php

namespace App\Http\Requests\Lecturer;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssignmentRequest extends FormRequest
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
            'due_at' => ['nullable', 'date'],
            'max_score' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'status' => ['required', 'in:draft,active,closed'],
        ];
    }
}
