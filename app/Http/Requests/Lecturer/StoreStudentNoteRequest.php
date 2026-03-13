<?php

namespace App\Http\Requests\Lecturer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'student'))],
            'title' => ['required', 'string', 'max:180'],
            'note' => ['required', 'string', 'max:4000'],
            'status' => ['required', 'in:active,resolved'],
        ];
    }
}
