<?php

namespace Database\Seeders;

use App\Models\Jurusan;
use Illuminate\Database\Seeder;

class JurusanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Jurusan dari Fakultas Ilmu Sosial
        Jurusan::create([
            'fakultas_id' => 1,
            'name' => 'Administrasi Bisnis',
            'slug' => 'Adbis',
            'code' => 31
        ]);
        Jurusan::create([
            'fakultas_id' => 1,
            'name' => 'Administrasi Publik',
            'slug' => 'Adpub',
            'code' => 32
        ]);
        Jurusan::create([
            'fakultas_id' => 1,
            'name' => 'Hubungan Masyarakat',
            'slug' => 'Humas',
            'code' => 33
        ]);
        
        // Jurusan dari fakultas Sains dan Teknologi
        Jurusan::create([
            'fakultas_id' => 2,
            'name' => 'Teknik Elektro',
            'slug' => 'TE',
            'code' => 41
        ]);
        Jurusan::create([
            'fakultas_id' => 2,
            'name' => 'Teknik Sipil',
            'slug' => 'TS',
            'code' => 42
        ]);
        Jurusan::create([
            'fakultas_id' => 2,
            'name' => 'Teknik Mesin',
            'slug' => 'TM',
            'code' => 43
        ]);
        Jurusan::create([
            'fakultas_id' => 2,
            'name' => 'Teknik Informatika',
            'slug' => 'TI',
            'code' => 44
        ]);

        // Jurusan dari fakultas Kesehatan
        Jurusan::create([
            'fakultas_id' => 3,
            'name' => 'Kebidanan',
            'slug' => 'Bidan',
            'code' => 51
        ]);
        Jurusan::create([
            'fakultas_id' => 3,
            'name' => 'D3 Perawat',
            'slug' => 'Perawat',
            'code' => 52
        ]);
        Jurusan::create([
            'fakultas_id' => 3,
            'name' => 'S1 Perawat Profesi Ners',
            'slug' => 'Profesi Ners',
            'code' => 53
        ]);
        Jurusan::create([
            'fakultas_id' => 3,
            'name' => 'Farmasi Dan Apoteker',
            'slug' => 'Farmasi',
            'code' => 54
        ]);
        Jurusan::create([
            'fakultas_id' => 3,
            'name' => 'Kedokteran',
            'slug' => 'Dokter',
            'code' => 55
        ]);

        // Jurusan dari fakultas Ekonomi
        Jurusan::create([
            'fakultas_id' => 4,
            'name' => 'Akuntansi',
            'slug' => 'Akuntan',
            'code' => 61
        ]);
        Jurusan::create([
            'fakultas_id' => 4,
            'name' => 'Manajemen Bisnis',
            'slug' => 'MBIS',
            'code' => 62
        ]);
        Jurusan::create([
            'fakultas_id' => 4,
            'name' => 'Manajemen Ritel',
            'slug' => 'MRIL',
            'code' => 63
        ]);
        Jurusan::create([
            'fakultas_id' => 4,
            'name' => 'Perbankan',
            'slug' => 'Bank',
            'code' => 64
        ]);
        Jurusan::create([
            'fakultas_id' => 4,
            'name' => 'Perpajakan',
            'slug' => 'Pajak',
            'code' => 65
        ]);

        // Jurusan dari fakultas Keguruan dan Ilmu Pendidikan
        Jurusan::create([
            'fakultas_id' => 5,
            'name' => 'Pendidikan Matematika',
            'slug' => 'PMTK',
            'code' => 71
        ]);
        Jurusan::create([
            'fakultas_id' => 5,
            'name' => 'Pendidikan Bahasa Indonesia',
            'slug' => 'PBIND',
            'code' => 72
        ]);
        Jurusan::create([
            'fakultas_id' => 5,
            'name' => 'Pendidikan Bahasa Inggris',
            'slug' => 'PBING',
            'code' => 73
        ]);
        Jurusan::create([
            'fakultas_id' => 5,
            'name' => 'Pendidikan Biologi',
            'slug' => 'PBI',
            'code' => 74
        ]);
        Jurusan::create([
            'fakultas_id' => 5,
            'name' => 'Pendidikan Kimia',
            'slug' => 'PKA',
            'code' => 75
        ]);
        Jurusan::create([
            'fakultas_id' => 5,
            'name' => 'Pendidikan Guru Paud',
            'slug' => 'PGPAUD',
            'code' => 76
        ]);
        Jurusan::create([
            'fakultas_id' => 5,
            'name' => 'Pendidikan Guru Sekolah Dasar',
            'slug' => 'PGSD',
            'code' => 77
        ]);
    }
}
