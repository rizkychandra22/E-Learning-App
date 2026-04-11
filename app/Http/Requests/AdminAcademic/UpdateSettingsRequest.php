<?php

namespace App\Http\Requests\AdminAcademic;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'university_name' => ['required', 'string', 'max:160'],
            'university_code' => ['required', 'string', 'max:32'],
            'university_website' => ['nullable', 'url', 'max:160'],
            'university_phone' => ['nullable', 'string', 'max:40'],
            'university_address' => ['nullable', 'string', 'max:255'],
            'dashboard_refresh_seconds' => ['required', 'integer', 'min:10', 'max:300'],
            'show_pending_first' => ['required', 'boolean'],
            'enable_user_email_notification' => ['required', 'boolean'],
            'default_user_role_filter' => ['required', 'in:all,teacher,student,finance,admin'],
        ];
    }
}
