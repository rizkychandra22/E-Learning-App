<?php

namespace App\Http\Requests\AdminAcademic;

use App\Models\Fakultas;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFakultasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Fakultas|null $fakultas */
        $fakultas = $this->route('fakultas');
        $ignoreId = $fakultas?->id;

        return [
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:20', Rule::unique('fakultas', 'code')->ignore($ignoreId)],
        ];
    }
}
