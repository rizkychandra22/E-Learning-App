<?php

namespace App\Http\Requests\Finance;

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
            'default_due_days' => ['required', 'integer', 'min:1', 'max:90'],
            'auto_verify_payment' => ['required', 'boolean'],
            'overdue_reminder_days' => ['required', 'integer', 'min:1', 'max:30'],
        ];
    }
}
