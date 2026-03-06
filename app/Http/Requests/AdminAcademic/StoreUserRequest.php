<?php

namespace App\Http\Requests\AdminAcademic;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')],
            'username' => ['required', 'string', 'max:60', Rule::unique('users', 'username')],
            'role' => ['required', 'in:admin,finance,teacher,student'],
            'code' => ['required', 'string', 'max:40', Rule::unique('users', 'code')],
            'password' => ['required', 'string', 'min:6', 'max:72'],
        ];
    }
}
