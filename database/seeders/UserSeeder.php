<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $year = '26';               // Kode Tahun
        $codeUniv = '5173';         // Kode Kampus
        $codeFakultas = '31';       // Kode Fakultas Teknik
        $codeJurusan = '44';        // Kode Jurusan Teknik Informatika

        // 1. Super Admin (01)
        User::create([
            'name'     => 'Super Admin',
            'email'    => 'super@univ.ac.id',
            'username' => 'superadmin',
            'role'     => 'root',
            'type'     => 'NIDN',
            'code'     => '01' . $year . $codeUniv . '000', 
            'password' => Hash::make('password'),
        ]);

        // 2. Admin (02)
        User::create([
            'name'     => 'Admin Akademik',
            'email'    => 'admin@univ.ac.id',
            'username' => 'adminuniv',
            'role'     => 'admin',
            'type'     => 'NIDN',
            'code'     => '02' . $year . $codeUniv . '001',
            'password' => Hash::make('password'),
        ]);
 
        // Keuangan (03)
        User::create([
            'name'     => 'Admin Keuangan',
            'email'    => 'finance@univ.ac.id',
            'username' => 'adminfinance',
            'role'     => 'finance',
            'type'     => 'NIDN',
            'code'     => '03' . $year . $codeUniv . '002',
            'password' => Hash::make('password'),
        ]);
        
        // 3. Dosen (04) - Teknik Informatika
        User::create([
            'name'     => 'Dr. Setyo Nugroho',
            'email'    => 'setyo@lecturer.ac.id',
            'username' => 'setyonugroho',
            'role'     => 'teacher',
            'type'     => 'NIDN',
            'code'     => '04' . $year . $codeFakultas . $codeJurusan . '001',
            'password' => Hash::make('password'),
        ]);

        // 4. Student (07) - Teknik Informatika
        $students = [
            ['name' => 'Andi Herlambang', 'user' => 'andi_h', 'seq' => '001'],
            ['name' => 'Budi Santoso', 'user' => 'budi_s', 'seq' => '002'],
        ];

        foreach ($students as $s) {
            User::create([
                'name'     => $s['name'],
                'email'    => $s['user'] . '@univ.ac.id',
                'username' => $s['user'],
                'role'     => 'student',
                'type'     => 'NIM',
                'code'     => '07' . $year . $codeFakultas . $codeJurusan . $s['seq'],
                'password' => Hash::make('password'),
            ]);
        }
    }
}