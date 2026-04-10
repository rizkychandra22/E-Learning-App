<?php

namespace App\Http\Requests\Lecturer;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:180'],
            'meeting_number' => ['nullable', 'integer', 'min:1', 'max:32'],
            'enable_attendance' => ['nullable', 'boolean'],
            'attendance_open_at' => ['nullable', 'date', 'required_if:enable_attendance,1'],
            'attendance_close_at' => ['nullable', 'date', 'required_if:enable_attendance,1', 'after:attendance_open_at'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt,zip,rar,mp4,mov,mkv,avi,webm,mp3,wav'],
        ];
    }
}
