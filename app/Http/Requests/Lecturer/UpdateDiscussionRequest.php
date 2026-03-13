<?php

namespace App\Http\Requests\Lecturer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDiscussionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:180'],
            'body' => ['required', 'string', 'max:4000'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'status' => ['required', 'in:open,closed'],
        ];
    }
}
