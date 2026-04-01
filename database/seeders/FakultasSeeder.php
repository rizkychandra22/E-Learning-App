<?php

namespace Database\Seeders;

use App\Models\Fakultas;
use Illuminate\Database\Seeder;

class FakultasSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['name' => 'Fakultas Ilmu Sosial', 'slug' => 'FIS', 'code' => '21'],
            ['name' => 'Fakultas Sains Dan Teknologi', 'slug' => 'SAINTEK', 'code' => '31'],
            ['name' => 'Fakultas Kesehatan', 'slug' => 'FKES', 'code' => '41'],
            ['name' => 'Fakultas Ekonomi', 'slug' => 'FE', 'code' => '51'],
            ['name' => 'Fakultas Keguruan dan Ilmu Pendidikan', 'slug' => 'FKIP', 'code' => '61'],
        ];

        foreach ($rows as $row) {
            Fakultas::updateOrCreate(
                ['code' => $row['code']],
                ['name' => $row['name'], 'slug' => $row['slug']]
            );
        }
    }
}
