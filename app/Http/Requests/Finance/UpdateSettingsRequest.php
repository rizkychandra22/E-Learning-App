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
            'nominal_spp' => ['nullable', 'integer', 'min:0', 'max:1000000000'],
            'late_fee_per_day' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'grace_period_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'auto_invoice_enabled' => ['nullable', 'boolean'],
            'auto_reminder_enabled' => ['nullable', 'boolean'],
        ];
    }
}
