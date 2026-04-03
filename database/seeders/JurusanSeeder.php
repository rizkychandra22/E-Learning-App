<?php

namespace Database\Seeders;

use App\Models\Fakultas;
use App\Models\Jurusan;
use Illuminate\Database\Seeder;

class JurusanSeeder extends Seeder
{
    public function run(): void
    {
        $fakultasIdsByCode = Fakultas::query()
            ->pluck('id', 'code')
            ->mapWithKeys(fn ($id, $code) => [(string) $code => (int) $id])
            ->all();

        $rows = [
            ['fakultas_code' => '21', 'name' => 'Administrasi Bisnis', 'slug' => 'Adbis', 'code' => '31'],
            ['fakultas_code' => '21', 'name' => 'Administrasi Publik', 'slug' => 'Adpub', 'code' => '32'],
            ['fakultas_code' => '21', 'name' => 'Hubungan Masyarakat', 'slug' => 'Humas', 'code' => '33'],
            ['fakultas_code' => '31', 'name' => 'Teknik Elektro', 'slug' => 'TE', 'code' => '41'],
            ['fakultas_code' => '31', 'name' => 'Teknik Sipil', 'slug' => 'TS', 'code' => '42'],
            ['fakultas_code' => '31', 'name' => 'Teknik Mesin', 'slug' => 'TM', 'code' => '43'],
            ['fakultas_code' => '31', 'name' => 'Teknik Informatika', 'slug' => 'TI', 'code' => '44'],
            ['fakultas_code' => '41', 'name' => 'Kebidanan', 'slug' => 'Bidan', 'code' => '51'],
            ['fakultas_code' => '41', 'name' => 'D3 Perawat', 'slug' => 'Perawat', 'code' => '52'],
            ['fakultas_code' => '41', 'name' => 'S1 Perawat Profesi Ners', 'slug' => 'Profesi Ners', 'code' => '53'],
            ['fakultas_code' => '41', 'name' => 'Farmasi Dan Apoteker', 'slug' => 'Farmasi', 'code' => '54'],
            ['fakultas_code' => '41', 'name' => 'Kedokteran', 'slug' => 'Dokter', 'code' => '55'],
            ['fakultas_code' => '51', 'name' => 'Akuntansi', 'slug' => 'Akuntan', 'code' => '61'],
            ['fakultas_code' => '51', 'name' => 'Manajemen Bisnis', 'slug' => 'MBIS', 'code' => '62'],
            ['fakultas_code' => '51', 'name' => 'Manajemen Ritel', 'slug' => 'MRIL', 'code' => '63'],
            ['fakultas_code' => '51', 'name' => 'Perbankan', 'slug' => 'Bank', 'code' => '64'],
            ['fakultas_code' => '51', 'name' => 'Perpajakan', 'slug' => 'Pajak', 'code' => '65'],
            ['fakultas_code' => '61', 'name' => 'Pendidikan Matematika', 'slug' => 'PMTK', 'code' => '71'],
            ['fakultas_code' => '61', 'name' => 'Pendidikan Bahasa Indonesia', 'slug' => 'PBIND', 'code' => '72'],
            ['fakultas_code' => '61', 'name' => 'Pendidikan Bahasa Inggris', 'slug' => 'PBING', 'code' => '73'],
            ['fakultas_code' => '61', 'name' => 'Pendidikan Biologi', 'slug' => 'PBI', 'code' => '74'],
            ['fakultas_code' => '61', 'name' => 'Pendidikan Kimia', 'slug' => 'PKA', 'code' => '75'],
            ['fakultas_code' => '61', 'name' => 'Pendidikan Guru Paud', 'slug' => 'PGPAUD', 'code' => '76'],
            ['fakultas_code' => '61', 'name' => 'Pendidikan Guru Sekolah Dasar', 'slug' => 'PGSD', 'code' => '77'],
        ];

        foreach ($rows as $row) {
            $fakultasId = $fakultasIdsByCode[$row['fakultas_code']] ?? null;
            if (!$fakultasId) {
                continue;
            }

            Jurusan::updateOrCreate(
                ['code' => $row['code']],
                [
                    'fakultas_id' => $fakultasId,
                    'name' => $row['name'],
                    'slug' => $row['slug'],
                ]
            );
        }
    }
}
