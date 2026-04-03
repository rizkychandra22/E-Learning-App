<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Jurusan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class LecturerCourseSeeder extends Seeder
{
    public function run(): void
    {
        if (!Schema::hasTable('courses') || !Schema::hasTable('users')) {
            return;
        }

        $jurusanId = null;
        if (Schema::hasTable('jurusans')) {
            $jurusanId = Jurusan::query()->where('name', 'Teknik Informatika')->value('id')
                ?? Jurusan::query()->value('id');
        }

        $hasCategory = Schema::hasColumn('courses', 'category');
        $hasTags = Schema::hasColumn('courses', 'tags');

        $lecturerCourses = [
            [
                'username' => 'setyonugroho',
                'title' => 'Pemrograman Web Lanjut',
                'code' => 'LCT-WEB-401',
                'description' => 'Implementasi arsitektur fullstack modern untuk aplikasi web.',
                'level' => 'lanjutan',
                'semester' => 6,
                'credit_hours' => 3,
                'status' => 'active',
                'category' => 'Teknologi',
                'tags' => ['laravel', 'react', 'fullstack'],
            ],
            [
                'username' => 'rinasusanti',
                'title' => 'Analisis Data Akademik',
                'code' => 'LCT-DAT-302',
                'description' => 'Pengolahan data akademik dan visualisasi insight berbasis dashboard.',
                'level' => 'menengah',
                'semester' => 5,
                'credit_hours' => 2,
                'status' => 'active',
                'category' => 'Data',
                'tags' => ['sql', 'analytics', 'bi'],
            ],
            [
                'username' => 'ahmadfauzi',
                'title' => 'Interaksi Manusia dan Komputer',
                'code' => 'LCT-UX-203',
                'description' => 'Prinsip UI/UX, riset pengguna, dan evaluasi usability.',
                'level' => 'dasar',
                'semester' => 3,
                'credit_hours' => 2,
                'status' => 'active',
                'category' => 'Desain',
                'tags' => ['ux', 'ui', 'usability'],
            ],
        ];

        foreach ($lecturerCourses as $item) {
            $lecturerId = User::query()
                ->where('username', $item['username'])
                ->where('role', 'teacher')
                ->value('id');

            if (!$lecturerId) {
                continue;
            }

            $payload = [
                'title' => $item['title'],
                'description' => $item['description'],
                'jurusan_id' => $jurusanId,
                'lecturer_id' => $lecturerId,
                'level' => $item['level'],
                'semester' => $item['semester'],
                'credit_hours' => $item['credit_hours'],
                'status' => $item['status'],
            ];

            if ($hasCategory) {
                $payload['category'] = $item['category'];
            }

            if ($hasTags) {
                $payload['tags'] = $item['tags'];
            }

            Course::updateOrCreate(
                ['code' => $item['code']],
                $payload
            );
        }
    }
}
