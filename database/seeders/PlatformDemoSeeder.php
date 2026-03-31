<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseMaterial;
use App\Models\CourseModule;
use App\Models\Discussion;
use App\Models\FeeComponent;
use App\Models\Fakultas;
use App\Models\InAppNotification;
use App\Models\Invoice;
use App\Models\Jurusan;
use App\Models\LessonProgress;
use App\Models\Payment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\StudentNote;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class PlatformDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        $academicStructure = $this->seedAcademicStructure();
        $users = $this->seedUsers();
        $courses = $this->seedCourses($users, $academicStructure);
        $this->seedEnrollmentsAndLearning($courses, $users);
        $this->seedAssessmentsAndDiscussions($courses, $users);
        $this->seedFinance($users);
        $this->seedNotifications($users, $courses);
        $this->seedSystemSettings($users);
    }

    private function seedAcademicStructure(): array
    {
        if (!Schema::hasTable('fakultas') || !Schema::hasTable('jurusans')) {
            return ['jurusan_id' => null];
        }

        $fakultasMap = [];
        $fakultasRows = [
            ['name' => 'Fakultas Sains dan Teknologi', 'slug' => 'fakultas-sains-dan-teknologi', 'code' => '31'],
            ['name' => 'Fakultas Ekonomi', 'slug' => 'fakultas-ekonomi', 'code' => '51'],
            ['name' => 'Fakultas Ilmu Sosial', 'slug' => 'fakultas-ilmu-sosial', 'code' => '21'],
        ];

        foreach ($fakultasRows as $row) {
            $fakultasMap[$row['code']] = Fakultas::updateOrCreate(
                ['code' => $row['code']],
                [
                    'name' => $row['name'],
                    'slug' => $row['slug'],
                ]
            );
        }

        $jurusanRows = [
            ['fakultas_code' => '31', 'name' => 'Teknik Informatika', 'slug' => 'teknik-informatika', 'code' => '44'],
            ['fakultas_code' => '31', 'name' => 'Sistem Informasi', 'slug' => 'sistem-informasi', 'code' => '45'],
            ['fakultas_code' => '51', 'name' => 'Manajemen Bisnis', 'slug' => 'manajemen-bisnis', 'code' => '62'],
            ['fakultas_code' => '21', 'name' => 'Administrasi Bisnis', 'slug' => 'administrasi-bisnis', 'code' => '31'],
        ];

        $tiJurusanId = null;
        foreach ($jurusanRows as $row) {
            $fakultasId = $fakultasMap[$row['fakultas_code']]?->id ?? null;
            if (!$fakultasId) {
                continue;
            }

            $jurusan = Jurusan::updateOrCreate(
                ['code' => $row['code']],
                [
                    'fakultas_id' => $fakultasId,
                    'name' => $row['name'],
                    'slug' => $row['slug'],
                ]
            );

            if ($row['name'] === 'Teknik Informatika') {
                $tiJurusanId = $jurusan->id;
            }
        }

        return ['jurusan_id' => $tiJurusanId];
    }

    private function seedUsers(): array
    {
        $root = User::firstOrCreate(
            ['email' => 'super@univ.ac.id'],
            [
                'name' => 'Super Admin',
                'username' => 'superadmin',
                'role' => 'root',
                'type' => 'nidn',
                'code' => '0120517320000',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        $admin = User::firstOrCreate(
            ['email' => 'admin@univ.ac.id'],
            [
                'name' => 'Admin Akademik',
                'username' => 'adminuniv',
                'role' => 'admin',
                'type' => 'nidn',
                'code' => '0220517320001',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        $finance = User::firstOrCreate(
            ['email' => 'finance@univ.ac.id'],
            [
                'name' => 'Admin Keuangan',
                'username' => 'adminfinance',
                'role' => 'finance',
                'type' => 'nidn',
                'code' => '0320517320002',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        $teachers = collect([
            ['name' => 'Dr. Setyo Nugroho', 'email' => 'setyo@lecturer.ac.id', 'username' => 'setyonugroho', 'code' => '0451733144001'],
            ['name' => 'Prof. Rina Susanti', 'email' => 'rina@lecturer.ac.id', 'username' => 'rinasusanti', 'code' => '0451733144002'],
            ['name' => 'Dr. Ahmad Fauzi', 'email' => 'ahmad@lecturer.ac.id', 'username' => 'ahmadfauzi', 'code' => '0451733144003'],
        ])->map(function (array $item) {
            return User::firstOrCreate(
                ['email' => $item['email']],
                [
                    'name' => $item['name'],
                    'username' => $item['username'],
                    'role' => 'teacher',
                    'type' => 'nidn',
                    'code' => $item['code'],
                    'password' => 'password',
                    'email_verified_at' => now(),
                ]
            );
        })->values();

        $students = collect([
            ['name' => 'Andi Herlambang', 'email' => 'andi_h@univ.ac.id', 'username' => 'andi_h', 'code' => '0720263131001', 'verified' => true],
            ['name' => 'Budi Santoso', 'email' => 'budi_s@univ.ac.id', 'username' => 'budi_s', 'code' => '0720263131002', 'verified' => true],
            ['name' => 'Citra Lestari', 'email' => 'citra_l@univ.ac.id', 'username' => 'citra_l', 'code' => '0720263131003', 'verified' => true],
            ['name' => 'Dimas Pratama', 'email' => 'dimas_p@univ.ac.id', 'username' => 'dimas_p', 'code' => '0720263131004', 'verified' => true],
            ['name' => 'Eka Ramadhan', 'email' => 'eka_r@univ.ac.id', 'username' => 'eka_r', 'code' => '0720263131005', 'verified' => true],
            ['name' => 'Fani Maharani', 'email' => 'fani_m@univ.ac.id', 'username' => 'fani_m', 'code' => '0720263131006', 'verified' => true],
            ['name' => 'Gilang Prakoso', 'email' => 'gilang_p@univ.ac.id', 'username' => 'gilang_p', 'code' => '0720263131007', 'verified' => true],
            ['name' => 'Hana Permata', 'email' => 'hana_p@univ.ac.id', 'username' => 'hana_p', 'code' => '0720263131008', 'verified' => false],
        ])->map(function (array $item) {
            return User::updateOrCreate(
                ['email' => $item['email']],
                [
                    'name' => $item['name'],
                    'username' => $item['username'],
                    'role' => 'student',
                    'type' => 'nim',
                    'code' => $item['code'],
                    'password' => 'password',
                    'email_verified_at' => $item['verified'] ? now() : null,
                ]
            );
        })->values();

        return [
            'root' => $root,
            'admin' => $admin,
            'finance' => $finance,
            'teachers' => $teachers,
            'students' => $students,
        ];
    }

    private function seedCourses(array $users, array $academicStructure): array
    {
        if (!Schema::hasTable('courses')) {
            return [];
        }

        $jurusanId = $academicStructure['jurusan_id'] ?? null;
        if (!$jurusanId) {
            $jurusanId = Jurusan::query()->where('name', 'Teknik Informatika')->value('id') ?? Jurusan::query()->value('id');
        }
        $teacherA = $users['teachers'][0] ?? null;
        $teacherB = $users['teachers'][1] ?? null;
        $teacherC = $users['teachers'][2] ?? null;
        if (!$teacherA || !$teacherB || !$teacherC) {
            return [];
        }

        $hasCategory = Schema::hasColumn('courses', 'category');
        $hasTags = Schema::hasColumn('courses', 'tags');
        $hasSelfEnrollment = Schema::hasColumn('courses', 'allow_self_enrollment');
        $hasEnrollmentKey = Schema::hasColumn('courses', 'enrollment_key');

        $seedCourses = [
            [
                'title' => 'Pemrograman Web Modern',
                'code' => 'WEB-301',
                'description' => 'Belajar React + Laravel untuk aplikasi modern.',
                'lecturer_id' => $teacherA->id,
                'category' => 'Teknologi',
                'tags' => ['react', 'laravel', 'api'],
                'level' => 'menengah',
                'semester' => 4,
                'credit_hours' => 3,
                'status' => 'active',
                'allow_self_enrollment' => true,
                'enrollment_key' => 'WEB301',
            ],
            [
                'title' => 'Data Analytics untuk Bisnis',
                'code' => 'DATA-210',
                'description' => 'Dasar analitik data, visualisasi, dan insight.',
                'lecturer_id' => $teacherB->id,
                'category' => 'Data',
                'tags' => ['sql', 'analytics', 'dashboard'],
                'level' => 'dasar',
                'semester' => 3,
                'credit_hours' => 2,
                'status' => 'active',
                'allow_self_enrollment' => true,
                'enrollment_key' => null,
            ],
            [
                'title' => 'Desain UI/UX',
                'code' => 'UX-101',
                'description' => 'Prinsip desain antarmuka dan pengalaman pengguna.',
                'lecturer_id' => $teacherC->id,
                'category' => 'Desain',
                'tags' => ['ux', 'figma', 'prototype'],
                'level' => 'dasar',
                'semester' => 2,
                'credit_hours' => 2,
                'status' => 'draft',
                'allow_self_enrollment' => false,
                'enrollment_key' => null,
            ],
        ];

        $courses = [];
        foreach ($seedCourses as $item) {
            $payload = [
                'title' => $item['title'],
                'description' => $item['description'],
                'jurusan_id' => $jurusanId,
                'lecturer_id' => $item['lecturer_id'],
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
            if ($hasSelfEnrollment) {
                $payload['allow_self_enrollment'] = $item['allow_self_enrollment'];
            }
            if ($hasEnrollmentKey) {
                $payload['enrollment_key'] = $item['enrollment_key'];
            }

            $courses[$item['code']] = Course::updateOrCreate(
                ['code' => $item['code']],
                $payload
            );
        }

        return $courses;
    }

    private function seedEnrollmentsAndLearning(array $courses, array $users): void
    {
        if ($courses === [] || !Schema::hasTable('course_student')) {
            return;
        }

        $students = $users['students'];
        $webCourse = $courses['WEB-301'] ?? null;
        $dataCourse = $courses['DATA-210'] ?? null;
        if (!$webCourse || !$dataCourse) {
            return;
        }

        foreach ($students->take(6) as $student) {
            $webCourse->students()->syncWithoutDetaching([$student->id => ['enrolled_at' => now()->subDays(rand(5, 20))]]);
        }
        foreach ($students->slice(2, 5) as $student) {
            $dataCourse->students()->syncWithoutDetaching([$student->id => ['enrolled_at' => now()->subDays(rand(2, 15))]]);
        }

        if (Schema::hasTable('course_materials')) {
            $this->seedCourseMaterial($webCourse, $users['teachers'][0]->id, 'Silabus WEB-301', 'silabus-web-301.pdf');
            $this->seedCourseMaterial($webCourse, $users['teachers'][0]->id, 'Starter Kit Frontend', 'starter-web-301.zip');
            $this->seedCourseMaterial($dataCourse, $users['teachers'][1]->id, 'Template Dashboard', 'dashboard-template.xlsx');
        }

        if (!Schema::hasTable('course_modules') || !Schema::hasTable('course_lessons')) {
            return;
        }

        $webModule = CourseModule::updateOrCreate(
            ['course_id' => $webCourse->id, 'title' => 'Dasar Fullstack'],
            ['description' => 'Pengantar frontend, backend, dan integrasi API.', 'sort_order' => 1]
        );
        $webLessonA = CourseLesson::updateOrCreate(
            ['course_module_id' => $webModule->id, 'title' => 'Pengenalan React'],
            [
                'summary' => 'Komponen, state, dan props.',
                'content_type' => 'video',
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'content' => 'Materi pengantar React.',
                'duration_minutes' => 20,
                'sort_order' => 1,
            ]
        );
        $webLessonB = CourseLesson::updateOrCreate(
            ['course_module_id' => $webModule->id, 'title' => 'Laravel API Dasar'],
            [
                'summary' => 'Routing, controller, dan response JSON.',
                'content_type' => 'text',
                'video_url' => null,
                'content' => 'Materi API Laravel.',
                'duration_minutes' => 25,
                'sort_order' => 2,
            ]
        );

        $dataModule = CourseModule::updateOrCreate(
            ['course_id' => $dataCourse->id, 'title' => 'Dasar Analytics'],
            ['description' => 'Data cleaning dan visualisasi insight.', 'sort_order' => 1]
        );
        $dataLesson = CourseLesson::updateOrCreate(
            ['course_module_id' => $dataModule->id, 'title' => 'SQL untuk Analitik'],
            [
                'summary' => 'Query agregasi dan filtering data.',
                'content_type' => 'document',
                'video_url' => null,
                'content' => 'Materi SQL analitik.',
                'duration_minutes' => 30,
                'sort_order' => 1,
            ]
        );

        if (Schema::hasTable('lesson_progress')) {
            foreach ($students->take(6) as $index => $student) {
                LessonProgress::updateOrCreate(
                    ['lesson_id' => $webLessonA->id, 'student_id' => $student->id],
                    [
                        'progress_percent' => $index < 4 ? 100 : 70,
                        'is_completed' => $index < 4,
                        'completed_at' => $index < 4 ? now()->subDays(1) : null,
                        'last_accessed_at' => now()->subHours(6 + $index),
                    ]
                );
                LessonProgress::updateOrCreate(
                    ['lesson_id' => $webLessonB->id, 'student_id' => $student->id],
                    [
                        'progress_percent' => $index < 3 ? 100 : 45,
                        'is_completed' => $index < 3,
                        'completed_at' => $index < 3 ? now()->subHours(10) : null,
                        'last_accessed_at' => now()->subHours(3 + $index),
                    ]
                );
            }

            foreach ($students->slice(2, 5) as $index => $student) {
                LessonProgress::updateOrCreate(
                    ['lesson_id' => $dataLesson->id, 'student_id' => $student->id],
                    [
                        'progress_percent' => $index < 3 ? 100 : 55,
                        'is_completed' => $index < 3,
                        'completed_at' => $index < 3 ? now()->subDays(2) : null,
                        'last_accessed_at' => now()->subHours(14 + $index),
                    ]
                );
            }
        }
    }

    private function seedAssessmentsAndDiscussions(array $courses, array $users): void
    {
        if ($courses === []) {
            return;
        }

        $webCourse = $courses['WEB-301'] ?? null;
        $dataCourse = $courses['DATA-210'] ?? null;
        $students = $users['students']->filter(fn (User $user) => $user->email_verified_at !== null)->values();
        if (!$webCourse || !$dataCourse || $students->isEmpty()) {
            return;
        }

        if (Schema::hasTable('assignments')) {
            $assignment = Assignment::updateOrCreate(
                ['course_id' => $webCourse->id, 'title' => 'Project Mini Fullstack'],
                [
                    'lecturer_id' => $webCourse->lecturer_id,
                    'description' => 'Bangun mini project fullstack sederhana.',
                    'due_at' => now()->addDays(7),
                    'max_score' => 100,
                    'status' => 'active',
                ]
            );

            if (Schema::hasTable('assignment_submissions')) {
                foreach ($students->take(4) as $index => $student) {
                    AssignmentSubmission::updateOrCreate(
                        ['assignment_id' => $assignment->id, 'student_id' => $student->id],
                        [
                            'submission_text' => 'Submission project oleh ' . $student->name,
                            'attachment_url' => 'https://example.test/submission/' . $student->id,
                            'status' => 'graded',
                            'score' => 78 + ($index * 4),
                            'feedback' => 'Pengerjaan sudah baik, lanjutkan optimasi.',
                            'submitted_at' => now()->subDays(1),
                            'graded_at' => now()->subHours(6),
                        ]
                    );
                }
            }
        }

        if (Schema::hasTable('quizzes')) {
            $quiz = Quiz::updateOrCreate(
                ['course_id' => $dataCourse->id, 'title' => 'Quiz SQL Dasar'],
                [
                    'lecturer_id' => $dataCourse->lecturer_id,
                    'description' => 'Uji pemahaman query analitik dasar.',
                    'duration_minutes' => 25,
                    'total_questions' => 15,
                    'scheduled_at' => now()->subHours(12),
                    'status' => 'active',
                ]
            );

            if (Schema::hasTable('quiz_attempts')) {
                foreach ($students->slice(1, 4) as $index => $student) {
                    QuizAttempt::updateOrCreate(
                        ['quiz_id' => $quiz->id, 'student_id' => $student->id],
                        [
                            'answers' => 'Jawaban quiz oleh ' . $student->name,
                            'status' => 'graded',
                            'score' => 75 + ($index * 5),
                            'feedback' => 'Sudah cukup baik.',
                            'started_at' => now()->subHours(14),
                            'submitted_at' => now()->subHours(13),
                            'graded_at' => now()->subHours(11),
                        ]
                    );
                }
            }
        }

        if (Schema::hasTable('discussions')) {
            Discussion::updateOrCreate(
                ['course_id' => $webCourse->id, 'title' => 'Sharing Kendala API'],
                [
                    'lecturer_id' => $webCourse->lecturer_id,
                    'body' => 'Silakan share kendala integrasi API minggu ini.',
                    'status' => 'open',
                ]
            );
            Discussion::updateOrCreate(
                ['course_id' => $dataCourse->id, 'title' => 'Tips SQL Optimization'],
                [
                    'lecturer_id' => $dataCourse->lecturer_id,
                    'body' => 'Diskusi strategi optimasi query SQL.',
                    'status' => 'closed',
                ]
            );
        }

        if (Schema::hasTable('student_notes')) {
            $lecturer = $users['teachers'][0];
            foreach ($students->take(2) as $index => $student) {
                StudentNote::updateOrCreate(
                    ['lecturer_id' => $lecturer->id, 'student_id' => $student->id, 'title' => 'Catatan Pembinaan #' . ($index + 1)],
                    [
                        'note' => $index === 0
                            ? 'Performa stabil, dorong eksplorasi fitur lanjutan.'
                            : 'Perlu peningkatan konsistensi tugas mingguan.',
                        'status' => $index === 0 ? 'resolved' : 'active',
                    ]
                );
            }
        }
    }

    private function seedFinance(array $users): void
    {
        if (!Schema::hasTable('fee_components') || !Schema::hasTable('invoices') || !Schema::hasTable('payments')) {
            return;
        }

        $finance = $users['finance'];
        $students = $users['students']->filter(fn (User $user) => $user->email_verified_at !== null)->values();
        if ($students->isEmpty()) {
            return;
        }

        $components = [
            'UKT-SEM' => FeeComponent::updateOrCreate(
                ['code' => 'UKT-SEM'],
                ['name' => 'UKT Semester', 'amount' => 3500000, 'type' => 'recurring', 'is_active' => true]
            ),
            'LAB-FEE' => FeeComponent::updateOrCreate(
                ['code' => 'LAB-FEE'],
                ['name' => 'Biaya Praktikum', 'amount' => 900000, 'type' => 'one_time', 'is_active' => true]
            ),
            'UAS-FEE' => FeeComponent::updateOrCreate(
                ['code' => 'UAS-FEE'],
                ['name' => 'Biaya Ujian Akhir', 'amount' => 600000, 'type' => 'one_time', 'is_active' => true]
            ),
        ];

        $invoiceRows = [
            ['no' => 'INV-DEMO-001', 'title' => 'Tagihan UKT Ganjil', 'component' => 'UKT-SEM', 'amount' => 3500000, 'status' => 'overdue', 'due' => now()->subDays(6)],
            ['no' => 'INV-DEMO-002', 'title' => 'Tagihan Praktikum Basis Data', 'component' => 'LAB-FEE', 'amount' => 900000, 'status' => 'unpaid', 'due' => now()->addDays(6)],
            ['no' => 'INV-DEMO-003', 'title' => 'Tagihan Ujian Akhir', 'component' => 'UAS-FEE', 'amount' => 600000, 'status' => 'partial', 'due' => now()->addDays(3)],
            ['no' => 'INV-DEMO-004', 'title' => 'Tagihan UKT Genap', 'component' => 'UKT-SEM', 'amount' => 3500000, 'status' => 'paid', 'due' => now()->subDays(12)],
        ];

        $invoices = [];
        foreach ($invoiceRows as $index => $row) {
            $student = $students[$index % $students->count()];
            $invoices[$row['no']] = Invoice::updateOrCreate(
                ['invoice_no' => $row['no']],
                [
                    'student_id' => $student->id,
                    'fee_component_id' => $components[$row['component']]->id,
                    'title' => $row['title'],
                    'description' => 'Generated by PlatformDemoSeeder',
                    'amount' => $row['amount'],
                    'due_date' => $row['due']->toDateString(),
                    'status' => $row['status'],
                    'created_by' => $finance->id,
                ]
            );
        }

        $paymentRows = [
            ['no' => 'PAY-DEMO-001', 'invoice' => 'INV-DEMO-003', 'amount' => 300000, 'method' => 'bank_transfer', 'status' => 'verified', 'hours' => 20],
            ['no' => 'PAY-DEMO-002', 'invoice' => 'INV-DEMO-004', 'amount' => 3500000, 'method' => 'virtual_account', 'status' => 'verified', 'hours' => 50],
            ['no' => 'PAY-DEMO-003', 'invoice' => 'INV-DEMO-002', 'amount' => 900000, 'method' => 'ewallet', 'status' => 'pending', 'hours' => 5],
        ];

        foreach ($paymentRows as $row) {
            $invoice = $invoices[$row['invoice']] ?? null;
            if (!$invoice) {
                continue;
            }

            Payment::updateOrCreate(
                ['payment_no' => $row['no']],
                [
                    'invoice_id' => $invoice->id,
                    'student_id' => $invoice->student_id,
                    'amount' => $row['amount'],
                    'method' => $row['method'],
                    'paid_at' => now()->subHours($row['hours']),
                    'status' => $row['status'],
                    'notes' => 'Pembayaran seeded untuk demo halaman finance.',
                    'verified_by' => $row['status'] === 'verified' ? $finance->id : null,
                ]
            );
        }
    }

    private function seedNotifications(array $users, array $courses): void
    {
        if (!Schema::hasTable('in_app_notifications')) {
            return;
        }

        $root = $users['root'];
        $admin = $users['admin'];
        $finance = $users['finance'];
        $teacher = $users['teachers'][0] ?? null;
        $student = $users['students'][0] ?? null;
        $course = $courses['WEB-301'] ?? null;
        if (!$teacher || !$student || !$course) {
            return;
        }

        $notifications = [
            [$root->id, $admin->id, 'system', 'Laporan Aktivitas Harian', 'Aktivitas platform hari ini sudah tersedia.', '/statistics'],
            [$admin->id, $root->id, 'approval', 'Akun Menunggu Persetujuan', 'Terdapat akun mahasiswa baru yang perlu diverifikasi.', '/approvals'],
            [$finance->id, $admin->id, 'finance', 'Pembayaran Menunggu Verifikasi', 'Ada pembayaran baru yang menunggu verifikasi.', '/finance-verifications'],
            [$teacher->id, $admin->id, 'course', 'Enrollment Baru', 'Mahasiswa baru mendaftar pada kursus ' . $course->title . '.', '/students'],
            [$student->id, $teacher->id, 'assignment', 'Tugas Dinilai', 'Tugas Anda pada kursus ' . $course->title . ' sudah dinilai.', '/grades'],
        ];

        foreach ($notifications as [$userId, $createdBy, $type, $title, $message, $url]) {
            InAppNotification::firstOrCreate(
                [
                    'user_id' => $userId,
                    'type' => $type,
                    'title' => $title,
                ],
                [
                    'created_by' => $createdBy,
                    'message' => $message,
                    'url' => $url,
                    'data' => ['seeded' => true],
                    'read_at' => null,
                ]
            );
        }
    }

    private function seedCourseMaterial(Course $course, int $uploaderId, string $title, string $fileName): void
    {
        $path = 'course-materials/demo/' . $course->id . '-' . $fileName;
        if (!Storage::disk('public')->exists($path)) {
            Storage::disk('public')->put($path, 'Demo file for ' . $title);
        }

        CourseMaterial::updateOrCreate(
            ['course_id' => $course->id, 'title' => $title],
            [
                'uploaded_by' => $uploaderId,
                'file_name' => $fileName,
                'file_path' => $path,
                'mime_type' => 'application/octet-stream',
                'file_size' => (int) Storage::disk('public')->size($path),
            ]
        );
    }

    private function seedSystemSettings(array $users): void
    {
        if (!Schema::hasTable('system_settings')) {
            return;
        }

        $root = $users['root'] ?? null;
        $admin = $users['admin'] ?? null;
        $finance = $users['finance'] ?? null;

        $global = [
            'platform_name' => 'Smart Learning Campus',
            'support_email' => 'support@univ.ac.id',
            'default_language' => 'id',
            'maintenance_mode' => '0',
            'allow_registration' => '1',
            'notify_on_new_user' => '1',
            'session_timeout_minutes' => '60',
            'max_upload_mb' => '25',
        ];

        foreach ($global as $key => $value) {
            SystemSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        if ($admin) {
            $adminScoped = [
                'dashboard_refresh_seconds' => '60',
                'show_pending_first' => '1',
                'enable_user_email_notification' => '1',
                'default_user_role_filter' => 'all',
            ];
            foreach ($adminScoped as $key => $value) {
                SystemSetting::updateOrCreate(
                    ['key' => 'admin_' . $admin->id . '_' . $key],
                    ['value' => $value]
                );
            }
        }

        if ($finance) {
            $financeScoped = [
                'default_due_days' => '14',
                'auto_verify_payment' => '0',
                'overdue_reminder_days' => '3',
                'nominal_spp' => '3500000',
                'late_fee_per_day' => '50000',
                'grace_period_days' => '7',
                'auto_invoice_enabled' => '1',
                'auto_reminder_enabled' => '1',
            ];
            foreach ($financeScoped as $key => $value) {
                SystemSetting::updateOrCreate(
                    ['key' => 'finance_' . $finance->id . '_' . $key],
                    ['value' => $value]
                );
            }
        }

        if ($root) {
            SystemSetting::updateOrCreate(
                ['key' => 'seeded_by_root_user_id'],
                ['value' => (string) $root->id]
            );
        }
    }
}
