<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Jurusan;
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
        $defaultJurusanId = Jurusan::query()->where('code', (int) $codeJurusan)->value('id');

        $seedUser = function (array $payload): void {
            User::updateOrCreate(
                ['code' => $payload['code']],
                [
                    'name' => $payload['name'],
                    'email' => $payload['email'],
                    'username' => $payload['username'],
                    'role' => $payload['role'],
                    'type' => $payload['type'],
                    'jurusan_id' => $payload['jurusan_id'] ?? null,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );
        };

        // 1. Super Admin (01)
        $seedUser([
            'name'     => 'Super Admin',
            'email'    => 'super@univ.ac.id',
            'username' => 'superadmin',
            'role'     => 'root',
            'type'     => 'nidn',
            'code'     => '0120' . $codeUniv . '20' . '000',
        ]);

        // 2. Admin (02)
        $seedUser([
            'name'     => 'Admin Akademik',
            'email'    => 'admin@univ.ac.id',
            'username' => 'adminuniv',
            'role'     => 'admin',
            'type'     => 'nidn',
            'code'     => '0220' . $codeUniv . '20' . '001',
        ]);

        // 3. Finance (03)
        $seedUser([
            'name'     => 'Admin Keuangan',
            'email'    => 'finance@univ.ac.id',
            'username' => 'adminfinance',
            'role'     => 'finance',
            'type'     => 'nidn',
            'code'     => '0320' . $codeUniv . '20' . '002',
        ]);

        // 4. Teachers (04) - Teknik Informatika
        $teachers = [
            ['name' => 'Dr. Setyo Nugroho', 'email' => 'setyo@lecturer.ac.id', 'username' => 'setyonugroho', 'seq' => '001'],
            ['name' => 'Prof. Rina Susanti', 'email' => 'rina@lecturer.ac.id', 'username' => 'rinasusanti', 'seq' => '002'],
            ['name' => 'Dr. Ahmad Fauzi', 'email' => 'ahmad@lecturer.ac.id', 'username' => 'ahmadfauzi', 'seq' => '003'],
        ];

        foreach ($teachers as $teacher) {
            $seedUser([
                'name' => $teacher['name'],
                'email' => $teacher['email'],
                'username' => $teacher['username'],
                'role' => 'teacher',
                'type' => 'nidn',
                'code' => '04' . $codeUniv . $codeFakultas . $codeJurusan . $teacher['seq'],
                'jurusan_id' => $defaultJurusanId,
            ]);
        }

        // 5. Students (07) - Teknik Informatika
        $students = [
            ['name' => 'Andi Herlambang', 'user' => 'andi_h', 'seq' => '001'],
            ['name' => 'Budi Santoso', 'user' => 'budi_s', 'seq' => '002'],
            ['name' => 'Citra Lestari', 'user' => 'citra_l', 'seq' => '003'],
            ['name' => 'Dewa Pranata', 'user' => 'dewa_p', 'seq' => '004'],
            ['name' => 'Eka Ramadhan', 'user' => 'eka_r', 'seq' => '005'],
            ['name' => 'Fajar Maulana', 'user' => 'fajar_m', 'seq' => '006'],
            ['name' => 'Gilang Pratama', 'user' => 'gilang_p', 'seq' => '007'],
            ['name' => 'Hani Nuraini', 'user' => 'hani_n', 'seq' => '008'],
            ['name' => 'Intan Permata', 'user' => 'intan_p', 'seq' => '009'],
            ['name' => 'Joko Saputra', 'user' => 'joko_s', 'seq' => '010'],
        ];

        foreach ($students as $s) {
            $seedUser([
                'name'     => $s['name'],
                'email'    => $s['user'] . '@univ.ac.id',
                'username' => $s['user'],
                'role'     => 'student',
                'type'     => 'nim',
                'code'     => '07' . $yearCode . $codeFakultas . $codeJurusan . $s['seq'],
                'jurusan_id' => $defaultJurusanId,
            ]);
        }
    }
}
