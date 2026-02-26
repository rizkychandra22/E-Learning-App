<?php

namespace Database\Seeders;

use App\Models\Fakultas;
use Illuminate\Database\Seeder;

class FakultasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Fakultas::create([
            'name' => 'Fakultas Ilmu Sosial',
            'slug' => 'FIS',
            'code' => 21
        ]);
        Fakultas::create([
            'name' => 'Fakultas Sains Dan Teknologi',
            'slug' => 'SAINTEK',
            'code' => 31
        ]);

        Fakultas::create([
            'name' => 'Fakultas Kesehatan',
            'slug' => 'FKES',
            'code' => 41
        ]);

        Fakultas::create([
            'name' => 'Fakultas Ekonomi',
            'slug' => 'FE',
            'code' => 51
        ]);

        Fakultas::create([
            'name' => 'Fakultas Keguruan dan Ilmu Pendidikan',
            'slug' => 'FKIP',
            'code' => 61
        ]);
    }
}
