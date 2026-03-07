<?php

namespace App\Http\Requests\AdminAcademic;

use App\Models\Jurusan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJurusanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Jurusan|null $jurusan */
        $jurusan = $this->route('jurusan');
        $ignoreId = $jurusan?->id;

        return [
            'fakultas_id' => ['required', 'integer', 'exists:fakultas,id'],
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:20', Rule::unique('jurusans', 'code')->ignore($ignoreId)],
        ];
    }
}
