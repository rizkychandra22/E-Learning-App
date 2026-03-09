<?php

namespace App\Http\Requests\AdminAcademic;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:180'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt,zip,rar,mp4,mov,mkv,avi,webm,mp3,wav'],
        ];
    }
}

