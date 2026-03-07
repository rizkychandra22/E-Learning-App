<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $hasInvoices = Schema::hasTable('invoices');

        return [
            'invoice_id' => $hasInvoices ? ['nullable', 'integer', 'exists:invoices,id'] : ['nullable', 'integer'],
            'student_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'student'))],
            'amount' => ['required', 'numeric', 'min:0'],
            'method' => ['required', 'in:bank_transfer,virtual_account,cash,ewallet'],
            'paid_at' => ['nullable', 'date'],
            'status' => ['required', 'in:pending,verified,rejected'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
