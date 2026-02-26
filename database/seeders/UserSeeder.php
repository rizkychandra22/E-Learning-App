<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $codeUniv     = '5173'; // Kode Kampus
        $codeFakultas = '31';   // Kode Fakultas Teknik
        $codeJurusan  = '44';   // Kode Jurusan Teknik Informatika
        $yearFull     = '2026'; // Tahun masuk mahasiswa

        // Generate YearCode student (2026 → 2620)
        $yearCode = substr($yearFull, -2) . substr($yearFull, 0, 2);

        // 1. Super Admin (01)
        User::create([
            'name'     => 'Super Admin',
            'email'    => 'super@univ.ac.id',
            'username' => 'superadmin',
            'role'     => 'root',
            'type'     => 'nidn',
            'code'     => '0120' . $codeUniv . '20' . '000',
            'password' => Hash::make('password'),
        ]);

        // 2. Admin (02)
        User::create([
            'name'     => 'Admin Akademik',
            'email'    => 'admin@univ.ac.id',
            'username' => 'adminuniv',
            'role'     => 'admin',
            'type'     => 'nidn',
            'code'     => '0220' . $codeUniv . '20' . '001',
            'password' => Hash::make('password'),
        ]);

        // 3. Finance (03)
        User::create([
            'name'     => 'Admin Keuangan',
            'email'    => 'finance@univ.ac.id',
            'username' => 'adminfinance',
            'role'     => 'finance',
            'type'     => 'nidn',
            'code'     => '0320' . $codeUniv . '20' . '002',
            'password' => Hash::make('password'),
        ]);

        // 4. Teacher (04) - Teknik Informatika
        User::create([
            'name'     => 'Dr. Setyo Nugroho',
            'email'    => 'setyo@lecturer.ac.id',
            'username' => 'setyonugroho',
            'role'     => 'teacher',
            'type'     => 'nidn',
            'code'     => '04' . $codeUniv . $codeFakultas . $codeJurusan . '001',
            'password' => Hash::make('password'),
        ]);

        // 5. Students (07) - Teknik Informatika
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
                'type'     => 'nim',
                'code'     => '07' . $yearCode . $codeFakultas . $codeJurusan . $s['seq'],
                'password' => Hash::make('password'),
            ]);
        }
    }
}
