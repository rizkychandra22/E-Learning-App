<?php

namespace App\Http\Requests\AdminAcademic;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:180'],
            'code' => ['required', 'string', 'max:40', Rule::unique('courses', 'code')],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'string', 'max:80'],
            'tags' => ['nullable', 'array', 'max:10'],
            'tags.*' => ['string', 'max:40'],
            'jurusan_id' => ['nullable', 'integer', 'exists:jurusans,id'],
            'lecturer_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'teacher'))],
            'level' => ['required', 'in:dasar,menengah,lanjutan'],
            'semester' => ['nullable', 'integer', 'min:1', 'max:14'],
            'credit_hours' => ['required', 'integer', 'min:1', 'max:8'],
            'status' => ['required', 'in:draft,active,archived'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $tags = $this->input('tags');
        if (is_string($tags)) {
            $this->merge([
                'tags' => array_values(array_filter(array_map('trim', explode(',', $tags)), fn ($tag) => $tag !== '')),
            ]);
        }
    }
}
