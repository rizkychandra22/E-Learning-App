<?php

namespace App\Http\Requests\AdminAcademic;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Course|null $course */
        $course = $this->route('course');
        $ignoreId = $course?->id;

        return [
            'title' => ['required', 'string', 'max:180'],
            'code' => ['required', 'string', 'max:40', Rule::unique('courses', 'code')->ignore($ignoreId)],
            'description' => ['nullable', 'string', 'max:2000'],
            'jurusan_id' => ['nullable', 'integer', 'exists:jurusans,id'],
            'lecturer_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'teacher'))],
            'level' => ['required', 'in:dasar,menengah,lanjutan'],
            'semester' => ['nullable', 'integer', 'min:1', 'max:14'],
            'credit_hours' => ['required', 'integer', 'min:1', 'max:8'],
            'status' => ['required', 'in:draft,active,archived'],
        ];
    }
}
