<?php

namespace App\Http\Requests\AdminAcademic;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJurusanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fakultas_id' => ['required', 'integer', 'exists:fakultas,id'],
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:20', Rule::unique('jurusans', 'code')],
        ];
    }
}
