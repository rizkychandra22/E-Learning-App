<?php

namespace App\Http\Requests\AdminAcademic;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var User|null $user */
        $user = $this->route('user');
        $ignoreId = $user?->id;

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')->ignore($ignoreId)],
            'username' => ['required', 'string', 'max:60', Rule::unique('users', 'username')->ignore($ignoreId)],
            'role' => ['required', 'in:admin,finance,teacher,student'],
            'code' => ['required', 'string', 'max:40', Rule::unique('users', 'code')->ignore($ignoreId)],
            'password' => ['nullable', 'string', 'min:6', 'max:72'],
        ];
    }
}
