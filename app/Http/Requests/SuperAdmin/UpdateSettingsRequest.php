<?php

namespace App\Http\Requests\SuperAdmin;

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
            'platform_name' => ['required', 'string', 'max:120'],
            'support_email' => ['required', 'email', 'max:120'],
            'default_language' => ['required', 'in:id,en'],
            'maintenance_mode' => ['required', 'boolean'],
            'allow_registration' => ['required', 'boolean'],
            'notify_on_new_user' => ['required', 'boolean'],
            'session_timeout_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'max_upload_mb' => ['required', 'integer', 'min:1', 'max:200'],
        ];
    }
}
