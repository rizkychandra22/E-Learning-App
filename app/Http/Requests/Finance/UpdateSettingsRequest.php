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
            'default_due_days' => ['nullable', 'integer', 'min:1', 'max:90'],
            'auto_verify_payment' => ['nullable', 'boolean'],
            'overdue_reminder_days' => ['nullable', 'integer', 'min:1', 'max:30'],
            'nominal_spp' => ['nullable', 'integer', 'min:0', 'max:1000000000'],
            'late_fee_per_day' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'grace_period_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'auto_invoice_enabled' => ['nullable', 'boolean'],
            'auto_reminder_enabled' => ['nullable', 'boolean'],
            'bank_name' => ['nullable', 'string', 'max:120'],
            'bank_account_name' => ['nullable', 'string', 'max:120'],
            'bank_account_number' => ['nullable', 'string', 'max:50'],
            'finance_contact_email' => ['nullable', 'email', 'max:120'],
            'finance_contact_phone' => ['nullable', 'string', 'max:30'],
            'notify_on_new_registration' => ['nullable', 'boolean'],
            'notify_on_invoice_created' => ['nullable', 'boolean'],
            'notify_on_payment_verified' => ['nullable', 'boolean'],
            'security_require_note_on_reject' => ['nullable', 'boolean'],
            'security_allow_manual_invoice_status' => ['nullable', 'boolean'],
        ];
    }
}
