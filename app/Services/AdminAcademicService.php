<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseMaterial;
use App\Models\FeeComponent;
use App\Models\Fakultas;
use App\Models\Invoice;
use App\Models\Jurusan;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminAcademicService
{
    public function getManageCoursesData(string $search, string $status, string $category = 'all'): array
    {
        $normalizedStatus = in_array($status, ['all', 'draft', 'active', 'archived'], true) ? $status : 'all';
        $normalizedCategory = trim($category) === '' ? 'all' : trim($category);
        $migrationRequired = !Schema::hasTable('courses');
        $materialsMigrationRequired = !Schema::hasTable('course_materials');

        $courses = collect();
        $availableCategories = collect();
        if (!$migrationRequired) {
            $relations = [
                'jurusan:id,name,fakultas_id',
                'jurusan.fakultas:id,name',
                'lecturer:id,name',
            ];

            if (!$materialsMigrationRequired) {
                $relations[] = 'materials:id,course_id,title,file_name,file_path,mime_type,file_size,uploaded_by,created_at';
            }

            $courses = Course::query()
                ->with($relations)
                ->when($normalizedStatus !== 'all', fn ($query) => $query->where('status', $normalizedStatus))
                ->when($normalizedCategory !== 'all', fn ($query) => $query->where('category', $normalizedCategory))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('title', 'like', '%' . $search . '%')
                            ->orWhere('code', 'like', '%' . $search . '%');
                    });
                })
                ->latest('id')
                ->get();

            $availableCategories = Course::query()
                ->whereNotNull('category')
                ->where('category', '!=', '')
                ->select('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->values();
        }

        $jurusans = Jurusan::query()
            ->with('fakultas:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'fakultas_id']);

        $lecturers = User::query()
            ->where('role', 'teacher')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $mocked = false;

        return [
            'courses' => $courses,
            'jurusans' => $jurusans,
            'lecturers' => $lecturers,
            'migrationRequired' => $migrationRequired,
            'materialsMigrationRequired' => $materialsMigrationRequired,
            'categories' => $availableCategories,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
                'status' => $normalizedStatus,
                'category' => $normalizedCategory,
            ],
        ];
    }

    public function canManageCourses(): bool
    {
        return Schema::hasTable('courses');
    }

    public function createCourse(array $payload): void
    {
        Course::create($this->normalizeCoursePayload($payload));
    }

    public function updateCourse(Course $course, array $payload): void
    {
        $course->update($this->normalizeCoursePayload($payload));
    }

    public function deleteCourse(Course $course): void
    {
        if (Schema::hasTable('course_materials')) {
            foreach ($course->materials as $material) {
                if (!empty($material->file_path)) {
                    Storage::disk('public')->delete($material->file_path);
                }
            }
        }

        $course->delete();
    }

    public function canManageCourseMaterials(): bool
    {
        return $this->canManageCourses() && Schema::hasTable('course_materials');
    }

    public function storeCourseMaterial(Course $course, array $payload, int $uploaderId): void
    {
        $file = $payload['file'];
        $storedPath = $file->store('course-materials/' . $course->id, 'public');

        $course->materials()->create([
            'uploaded_by' => $uploaderId,
            'title' => trim((string) $payload['title']),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $storedPath,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize() ?? 0,
        ]);
    }

    public function deleteCourseMaterial(Course $course, CourseMaterial $material): void
    {
        abort_if($material->course_id !== $course->id, 404);

        if (!empty($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }

        $material->delete();
    }

    public function downloadCourseMaterial(Course $course, CourseMaterial $material): StreamedResponse
    {
        abort_if($material->course_id !== $course->id, 404);

        return Storage::disk('public')->download($material->file_path, $material->file_name);
    }

    public function getManageUsersData(string $search, string $role, bool $showPendingFirst = true): array
    {
        $allowedRoles = ['teacher', 'student', 'finance', 'admin'];
        $selectedRole = in_array($role, $allowedRoles, true) ? $role : 'all';

        $users = User::query()
            ->with([
                'jurusan:id,name,fakultas_id',
                'jurusan.fakultas:id,name,code',
            ])
            ->where('role', '!=', 'root')
            ->when($selectedRole !== 'all', fn ($query) => $query->where('role', $selectedRole))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%')
                        ->orWhere('username', 'like', '%' . $search . '%')
                        ->orWhere('code', 'like', '%' . $search . '%');
                });
            })
            ->when($showPendingFirst, function ($query) {
                $query->orderByRaw('CASE WHEN email_verified_at IS NULL THEN 0 ELSE 1 END');
            })
            ->latest('id')
            ->get(['id', 'name', 'email', 'username', 'role', 'type', 'code', 'jurusan_id', 'email_verified_at', 'created_at']);

        $jurusans = Jurusan::query()
            ->with('fakultas:id,name,code')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'fakultas_id']);

        $mocked = false;

        return [
            'users' => $users,
            'jurusans' => $jurusans,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
                'role' => $selectedRole,
            ],
        ];
    }

    public function createUser(array $payload, ?int $adminId = null): void
    {
        $user = User::create([
            ...$payload,
            'type' => $payload['role'] === 'student' ? 'nim' : 'nidn',
            'jurusan_id' => $this->resolveUserJurusanId($payload),
        ]);

        if (app(SystemSettingService::class)->shouldNotifyOnNewUser()) {
            Log::info('New user created by admin academic.', [
                'email' => $user->email,
                'role' => $user->role,
                'source' => 'admin-academic',
            ]);
        }

        if ($this->shouldSendAdminUserEmailNotification($adminId)) {
            app(NotificationService::class)->sendSimpleEmail(
                $user->email,
                'Akun Baru Dibuat',
                "Halo {$user->name},\n\nAkun Anda telah dibuat oleh admin universitas. Silakan menunggu proses verifikasi akun.\n"
            );
        }
    }

    public function updateUser(User $user, array $payload): void
    {
        $basePayload = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'username' => $payload['username'],
            'role' => $payload['role'],
            'type' => $payload['role'] === 'student' ? 'nim' : 'nidn',
            'code' => $payload['code'],
            'jurusan_id' => $this->resolveUserJurusanId($payload),
        ];

        if (!empty($payload['password'])) {
            $basePayload['password'] = $payload['password'];
        }

        $user->update($basePayload);
    }

    public function deleteUser(User $user): void
    {
        $user->delete();
    }

    public function generateJurusanAccounts(int $studentsPerJurusan = 10, int $lecturersPerJurusan = 3, ?int $adminId = null): array
    {
        if (!Schema::hasTable('jurusans') || !Schema::hasTable('users')) {
            return [
                'ok' => false,
                'message' => 'Tabel jurusans/users belum tersedia. Jalankan migrasi terlebih dahulu.',
            ];
        }

        if (!Schema::hasTable('courses')) {
            return [
                'ok' => false,
                'message' => 'Tabel courses belum tersedia. Jalankan migrasi terlebih dahulu.',
            ];
        }

        $jurusans = Jurusan::query()
            ->with('fakultas:id,name,code')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'fakultas_id']);

        if ($jurusans->isEmpty()) {
            return [
                'ok' => false,
                'message' => 'Belum ada jurusan. Tambahkan jurusan terlebih dahulu di menu Kategori.',
            ];
        }

        $lecturerCount = 0;
        $studentCount = 0;
        $courseCount = 0;
        $createdUserIds = [];
        $now = now();
        $courseStudentTableExists = Schema::hasTable('course_student');

        DB::transaction(function () use ($jurusans, $studentsPerJurusan, $lecturersPerJurusan, $courseStudentTableExists, $now, &$lecturerCount, &$studentCount, &$courseCount, &$createdUserIds): void {
            foreach ($jurusans as $jurusan) {
                $jurusanCode = $this->normalizeNumericCode((string) ($jurusan->code ?? ''), (int) $jurusan->id, 2);
                $fakultasCode = $this->normalizeNumericCode((string) ($jurusan->fakultas?->code ?? ''), (int) ($jurusan->fakultas_id ?? 0), 2);
                $category = (string) ($jurusan->fakultas?->name ?? $jurusan->name);
                $teacherPrefix = '04' . $this->seederCampusCode() . $fakultasCode . $jurusanCode;
                $studentPrefix = '07' . $this->seederYearCode() . $fakultasCode . $jurusanCode;
                $teacherSeq = $this->nextSequenceFromPrefix($teacherPrefix);
                $studentSeq = $this->nextSequenceFromPrefix($studentPrefix);

                $courses = [];
                for ($i = 1; $i <= $lecturersPerJurusan; $i++) {
                    $lecturerName = $this->generateRandomIndonesianName('teacher');
                    $lecturerIdentity = $this->buildUniqueIdentityFromName($lecturerName, 'teacher');
                    $lecturerCode = $teacherPrefix . str_pad((string) $teacherSeq, 3, '0', STR_PAD_LEFT);
                    $teacherSeq++;

                    $lecturer = User::create([
                        'name' => $lecturerName,
                        'email' => $lecturerIdentity['email'],
                        'username' => $lecturerIdentity['username'],
                        'role' => 'teacher',
                        'type' => 'nidn',
                        'code' => $lecturerCode,
                        'jurusan_id' => (int) $jurusan->id,
                        'password' => 'Kampus12345',
                    ]);
                    $createdUserIds[] = (int) $lecturer->id;

                    $course = Course::create([
                        'title' => $this->buildJurusanCourseTitle((string) $jurusan->name, $i),
                        'code' => $this->generateUniqueCourseCode($jurusanCode, $i),
                        'description' => "Kursus otomatis untuk jurusan {$jurusan->name}.",
                        'category' => $category,
                        'tags' => ['otomatis', Str::lower((string) $jurusanCode)],
                        'jurusan_id' => (int) $jurusan->id,
                        'lecturer_id' => (int) $lecturer->id,
                        'level' => $i === 1 ? 'dasar' : ($i === 2 ? 'menengah' : 'lanjutan'),
                        'semester' => $i,
                        'credit_hours' => 2,
                        'status' => 'active',
                        'allow_self_enrollment' => false,
                        'enrollment_key' => null,
                    ]);

                    $courses[] = $course;
                    $lecturerCount++;
                    $courseCount++;
                }

                $studentIds = [];
                for ($i = 1; $i <= $studentsPerJurusan; $i++) {
                    $studentName = $this->generateRandomIndonesianName('student');
                    $studentIdentity = $this->buildUniqueIdentityFromName($studentName, 'student');
                    $studentCode = $studentPrefix . str_pad((string) $studentSeq, 3, '0', STR_PAD_LEFT);
                    $studentSeq++;

                    $student = User::create([
                        'name' => $studentName,
                        'email' => $studentIdentity['email'],
                        'username' => $studentIdentity['username'],
                        'role' => 'student',
                        'type' => 'nim',
                        'code' => $studentCode,
                        'jurusan_id' => (int) $jurusan->id,
                        'password' => $studentCode,
                    ]);
                    $createdUserIds[] = (int) $student->id;

                    $studentIds[] = (int) $student->id;
                    $studentCount++;
                }

                if ($courseStudentTableExists && $studentIds !== [] && $courses !== []) {
                    $rows = [];
                    foreach ($studentIds as $studentId) {
                        foreach ($courses as $course) {
                            $rows[] = [
                                'course_id' => (int) $course->id,
                                'student_id' => $studentId,
                                'enrolled_at' => $now,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }
                    }

                    if ($rows !== []) {
                        DB::table('course_student')->insertOrIgnore($rows);
                    }
                }
            }
        });

        if ($this->shouldSendAdminUserEmailNotification($adminId) && $createdUserIds !== []) {
            User::query()
                ->whereIn('id', array_values(array_unique($createdUserIds)))
                ->get(['id', 'name', 'email'])
                ->each(function (User $user): void {
                    app(NotificationService::class)->sendSimpleEmail(
                        $user->email,
                        'Akun Baru Dibuat',
                        "Halo {$user->name},\n\nAkun Anda telah dibuat oleh admin universitas. Silakan menunggu proses verifikasi akun.\n"
                    );
                });
        }

        return [
            'ok' => true,
            'jurusan_count' => $jurusans->count(),
            'lecturer_count' => $lecturerCount,
            'student_count' => $studentCount,
            'course_count' => $courseCount,
        ];
    }

    public function importUsersFromFile(UploadedFile $file, string $defaultPassword = 'Kampus12345', ?int $adminId = null): array
    {
        if (!Schema::hasTable('users')) {
            return [
                'ok' => false,
                'message' => 'Tabel users belum tersedia. Jalankan migrasi terlebih dahulu.',
            ];
        }

        $rows = $this->parseUserImportRows($file);
        if ($rows === []) {
            return [
                'ok' => false,
                'message' => 'File tidak berisi data user. Pastikan ada header dan minimal 1 baris data.',
            ];
        }

        $jurusanById = Jurusan::query()->pluck('id', 'id')->map(fn ($id) => (int) $id)->all();
        $jurusanByCode = Jurusan::query()
            ->get(['id', 'code'])
            ->mapWithKeys(fn (Jurusan $item): array => [strtoupper((string) $item->code) => (int) $item->id])
            ->all();

        $users = User::query()
            ->where('role', '!=', 'root')
            ->get(['id', 'code', 'email', 'username'])
            ->map(fn (User $user): array => [
                'id' => (int) $user->id,
                'code' => strtoupper((string) $user->code),
                'email' => Str::lower((string) $user->email),
                'username' => Str::lower((string) $user->username),
            ]);

        $idByCode = [];
        $idByEmail = [];
        $idByUsername = [];
        foreach ($users as $item) {
            $idByCode[$item['code']] = $item['id'];
            $idByEmail[$item['email']] = $item['id'];
            $idByUsername[$item['username']] = $item['id'];
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $newUserIds = [];
        $errors = [];

        DB::transaction(function () use (
            $rows,
            $defaultPassword,
            $jurusanById,
            $jurusanByCode,
            &$idByCode,
            &$idByEmail,
            &$idByUsername,
            &$created,
            &$updated,
            &$skipped,
            &$newUserIds,
            &$errors
        ): void {
            foreach ($rows as $index => $row) {
                $lineNumber = $index + 2;
                if ($this->isImportRowEmpty($row)) {
                    $skipped++;
                    continue;
                }

                $role = $this->normalizeImportRole((string) ($row['role'] ?? ''));
                if ($role === null || $role === 'root') {
                    $errors[] = "Baris {$lineNumber}: role harus salah satu dari admin, finance, teacher, student.";
                    continue;
                }

                $name = trim((string) ($row['name'] ?? ''));
                $email = Str::lower(trim((string) ($row['email'] ?? '')));
                $username = Str::lower(trim((string) ($row['username'] ?? '')));
                $code = strtoupper(trim((string) ($row['code'] ?? '')));
                $password = trim((string) ($row['password'] ?? ''));
                if ($password === '') {
                    $password = $role === 'student' ? $code : $defaultPassword;
                }

                if ($name === '' || $email === '' || $username === '' || $code === '') {
                    $errors[] = "Baris {$lineNumber}: kolom wajib (`name`, `email`, `username`, `code`) belum lengkap.";
                    continue;
                }

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = "Baris {$lineNumber}: format email tidak valid ({$email}).";
                    continue;
                }

                if (strlen($password) < 6) {
                    $errors[] = "Baris {$lineNumber}: password minimal 6 karakter.";
                    continue;
                }

                $matchedId = $idByCode[$code] ?? null;
                if ($matchedId === null && isset($idByEmail[$email])) {
                    $matchedId = $idByEmail[$email];
                }
                if ($matchedId === null && isset($idByUsername[$username])) {
                    $matchedId = $idByUsername[$username];
                }

                if (isset($idByCode[$code]) && $idByCode[$code] !== $matchedId) {
                    $errors[] = "Baris {$lineNumber}: kode {$code} bentrok dengan user lain.";
                    continue;
                }
                if (isset($idByEmail[$email]) && $idByEmail[$email] !== $matchedId) {
                    $errors[] = "Baris {$lineNumber}: email {$email} sudah dipakai user lain.";
                    continue;
                }
                if (isset($idByUsername[$username]) && $idByUsername[$username] !== $matchedId) {
                    $errors[] = "Baris {$lineNumber}: username {$username} sudah dipakai user lain.";
                    continue;
                }

                $jurusanId = null;
                if (in_array($role, ['teacher', 'student'], true)) {
                    $rawJurusanId = trim((string) ($row['jurusan_id'] ?? ''));
                    $rawJurusanCode = strtoupper(trim((string) ($row['jurusan_code'] ?? '')));
                    $rawJurusanCode = $rawJurusanCode !== '' ? $rawJurusanCode : strtoupper(trim((string) ($row['jurusan'] ?? '')));

                    if ($rawJurusanId !== '' && ctype_digit($rawJurusanId)) {
                        $candidate = (int) $rawJurusanId;
                        $jurusanId = $jurusanById[$candidate] ?? null;
                    }
                    if ($jurusanId === null && $rawJurusanCode !== '') {
                        $jurusanId = $jurusanByCode[$rawJurusanCode] ?? null;
                    }

                    if ($jurusanId === null) {
                        $errors[] = "Baris {$lineNumber}: jurusan wajib untuk role {$role} (isi `jurusan_id` atau `jurusan_code`).";
                        continue;
                    }
                }

                $typeRaw = Str::lower(trim((string) ($row['type'] ?? '')));
                $type = in_array($typeRaw, ['nidn', 'nim'], true)
                    ? $typeRaw
                    : ($role === 'student' ? 'nim' : 'nidn');

                $verifiedRaw = trim((string) ($row['email_verified_at'] ?? ''));
                $emailVerifiedAt = null;
                if ($verifiedRaw !== '') {
                    if (in_array(Str::lower($verifiedRaw), ['1', 'true', 'yes', 'ya'], true)) {
                        $emailVerifiedAt = now();
                    } else {
                        try {
                            $emailVerifiedAt = Carbon::parse($verifiedRaw);
                        } catch (\Throwable) {
                            $emailVerifiedAt = null;
                        }
                    }
                }

                $payload = [
                    'name' => $name,
                    'email' => $email,
                    'username' => $username,
                    'role' => $role,
                    'type' => $type,
                    'code' => $code,
                    'jurusan_id' => $jurusanId,
                    'password' => $password,
                    'email_verified_at' => $emailVerifiedAt,
                ];

                if ($matchedId !== null) {
                    $user = User::query()->where('id', $matchedId)->where('role', '!=', 'root')->first();
                    if (!$user) {
                        $errors[] = "Baris {$lineNumber}: user target tidak ditemukan.";
                        continue;
                    }

                    if ($payload['email_verified_at'] === null) {
                        unset($payload['email_verified_at']);
                    }

                    $user->update($payload);
                    $updated++;
                } else {
                    // Akun baru hasil import selalu pending dan harus melalui persetujuan admin.
                    $payload['email_verified_at'] = null;

                    $user = User::create($payload);
                    $matchedId = (int) $user->id;
                    $newUserIds[] = $matchedId;
                    $created++;
                }

                $idByCode[$code] = $matchedId;
                $idByEmail[$email] = $matchedId;
                $idByUsername[$username] = $matchedId;
            }
        });

        if ($created === 0 && $updated === 0) {
            return [
                'ok' => false,
                'message' => 'Import gagal. Tidak ada baris yang valid untuk diproses.',
                'errors' => array_slice($errors, 0, 20),
            ];
        }

        if ($this->shouldSendAdminUserEmailNotification($adminId) && $newUserIds !== []) {
            User::query()
                ->whereIn('id', array_values(array_unique($newUserIds)))
                ->get(['id', 'name', 'email'])
                ->each(function (User $user): void {
                    app(NotificationService::class)->sendSimpleEmail(
                        $user->email,
                        'Akun Baru Dibuat',
                        "Halo {$user->name},\n\nAkun Anda telah dibuat oleh admin universitas. Silakan menunggu proses verifikasi akun.\n"
                    );
                });
        }

        return [
            'ok' => true,
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 20),
        ];
    }

    public function previewUsersImportFile(UploadedFile $file, string $defaultPassword = 'Kampus12345'): array
    {
        $rows = $this->parseUserImportRows($file);
        if ($rows === []) {
            return [
                'ok' => false,
                'message' => 'File tidak berisi data user. Pastikan ada header dan minimal 1 baris data.',
            ];
        }

        $jurusanById = Jurusan::query()->pluck('id', 'id')->map(fn ($id) => (int) $id)->all();
        $jurusanByCode = Jurusan::query()
            ->get(['id', 'code'])
            ->mapWithKeys(fn (Jurusan $item): array => [strtoupper((string) $item->code) => (int) $item->id])
            ->all();

        $users = User::query()
            ->where('role', '!=', 'root')
            ->get(['id', 'code', 'email', 'username'])
            ->map(fn (User $user): array => [
                'id' => (int) $user->id,
                'code' => strtoupper((string) $user->code),
                'email' => Str::lower((string) $user->email),
                'username' => Str::lower((string) $user->username),
            ]);

        $idByCode = [];
        $idByEmail = [];
        $idByUsername = [];
        foreach ($users as $item) {
            $idByCode[$item['code']] = $item['id'];
            $idByEmail[$item['email']] = $item['id'];
            $idByUsername[$item['username']] = $item['id'];
        }

        $headers = collect($rows)
            ->take(10)
            ->flatMap(fn (array $row): array => array_keys($row))
            ->unique()
            ->values()
            ->all();

        $nonEmptyRows = 0;
        $validRows = 0;
        $createCandidates = 0;
        $updateCandidates = 0;
        $errors = [];
        $seenCodes = [];
        $seenEmails = [];
        $seenUsernames = [];

        foreach ($rows as $index => $row) {
            $lineNumber = $index + 2;
            if ($this->isImportRowEmpty($row)) {
                continue;
            }
            $nonEmptyRows++;

            $role = $this->normalizeImportRole((string) ($row['role'] ?? ''));
            $name = trim((string) ($row['name'] ?? ''));
            $email = Str::lower(trim((string) ($row['email'] ?? '')));
            $username = Str::lower(trim((string) ($row['username'] ?? '')));
            $code = strtoupper(trim((string) ($row['code'] ?? '')));
            $password = trim((string) ($row['password'] ?? ''));
            if ($password === '') {
                $password = $role === 'student' ? $code : $defaultPassword;
            }

            $lineHasError = false;
            if ($role === null || $role === 'root') {
                $errors[] = "Baris {$lineNumber}: role tidak valid.";
                $lineHasError = true;
            }
            if ($name === '' || $email === '' || $username === '' || $code === '') {
                $errors[] = "Baris {$lineNumber}: kolom wajib belum lengkap.";
                $lineHasError = true;
            }
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Baris {$lineNumber}: format email tidak valid.";
                $lineHasError = true;
            }
            if (strlen($password) < 6) {
                $errors[] = "Baris {$lineNumber}: password minimal 6 karakter.";
                $lineHasError = true;
            }

            if ($code !== '') {
                if (isset($seenCodes[$code])) {
                    $errors[] = "Baris {$lineNumber}: kode duplikat dalam file ({$code}).";
                    $lineHasError = true;
                }
                $seenCodes[$code] = true;
            }
            if ($email !== '') {
                if (isset($seenEmails[$email])) {
                    $errors[] = "Baris {$lineNumber}: email duplikat dalam file ({$email}).";
                    $lineHasError = true;
                }
                $seenEmails[$email] = true;
            }
            if ($username !== '') {
                if (isset($seenUsernames[$username])) {
                    $errors[] = "Baris {$lineNumber}: username duplikat dalam file ({$username}).";
                    $lineHasError = true;
                }
                $seenUsernames[$username] = true;
            }

            if (in_array($role, ['teacher', 'student'], true)) {
                $rawJurusanId = trim((string) ($row['jurusan_id'] ?? ''));
                $rawJurusanCode = strtoupper(trim((string) ($row['jurusan_code'] ?? '')));
                $rawJurusanCode = $rawJurusanCode !== '' ? $rawJurusanCode : strtoupper(trim((string) ($row['jurusan'] ?? '')));
                $jurusanId = null;
                if ($rawJurusanId !== '' && ctype_digit($rawJurusanId)) {
                    $candidate = (int) $rawJurusanId;
                    $jurusanId = $jurusanById[$candidate] ?? null;
                }
                if ($jurusanId === null && $rawJurusanCode !== '') {
                    $jurusanId = $jurusanByCode[$rawJurusanCode] ?? null;
                }
                if ($jurusanId === null) {
                    $errors[] = "Baris {$lineNumber}: jurusan wajib untuk role {$role}.";
                    $lineHasError = true;
                }
            }

            if ($lineHasError) {
                continue;
            }

            $validRows++;
            $matchedId = $idByCode[$code] ?? $idByEmail[$email] ?? $idByUsername[$username] ?? null;
            if ($matchedId !== null) {
                $updateCandidates++;
            } else {
                $createCandidates++;
            }
        }

        $previewRows = collect($rows)
            ->take(10)
            ->values()
            ->map(function (array $row, int $index): array {
                return [
                    'line' => $index + 2,
                    ...$row,
                ];
            })
            ->all();

        return [
            'ok' => true,
            'headers' => $headers,
            'rows' => $previewRows,
            'summary' => [
                'total_rows' => count($rows),
                'non_empty_rows' => $nonEmptyRows,
                'valid_rows' => $validRows,
                'create_candidates' => $createCandidates,
                'update_candidates' => $updateCandidates,
                'error_count' => count($errors),
            ],
            'errors' => array_slice($errors, 0, 20),
        ];
    }

    public function getApprovalsData(string $search, string $role): array
    {
        $allowedRoles = ['admin', 'finance', 'teacher', 'student'];
        $selectedRole = in_array($role, $allowedRoles, true) ? $role : 'all';

        $pendingUsers = User::query()
            ->where('role', '!=', 'root')
            ->whereNull('email_verified_at')
            ->when($selectedRole !== 'all', fn ($query) => $query->where('role', $selectedRole))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%')
                        ->orWhere('username', 'like', '%' . $search . '%');
                });
            })
            ->latest('id')
            ->get(['id', 'name', 'email', 'username', 'role', 'code', 'created_at']);

        $roleSummary = [
            'all' => User::query()->where('role', '!=', 'root')->whereNull('email_verified_at')->count(),
            'admin' => User::query()->where('role', 'admin')->whereNull('email_verified_at')->count(),
            'finance' => User::query()->where('role', 'finance')->whereNull('email_verified_at')->count(),
            'teacher' => User::query()->where('role', 'teacher')->whereNull('email_verified_at')->count(),
            'student' => User::query()->where('role', 'student')->whereNull('email_verified_at')->count(),
        ];

        $mocked = false;

        return [
            'pendingUsers' => $pendingUsers,
            'roleSummary' => $roleSummary,
            'mocked' => $mocked,
            'filters' => [
                'search' => $search,
                'role' => $selectedRole,
            ],
        ];
    }

    public function approveUser(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $wasPending = $user->email_verified_at === null;
            $user->update(['email_verified_at' => now()]);

            if ($wasPending) {
                $this->createAutoInvoiceForApprovedStudent($user);
            }
        });
    }

    public function rejectUser(User $user): void
    {
        $user->delete();
    }

    public function approveAllPendingByRole(string $role = 'all'): int
    {
        $allowedRoles = ['admin', 'finance', 'teacher', 'student'];
        $selectedRole = in_array($role, $allowedRoles, true) ? $role : 'all';

        $pendingQuery = User::query()
            ->where('role', '!=', 'root')
            ->whereNull('email_verified_at')
            ->when($selectedRole !== 'all', fn ($query) => $query->where('role', $selectedRole));

        $pendingUsers = $pendingQuery
            ->get(['id', 'role']);

        if ($pendingUsers->isEmpty()) {
            return 0;
        }

        $pendingIds = $pendingUsers->pluck('id')->values();

        User::query()
            ->whereIn('id', $pendingIds)
            ->update(['email_verified_at' => now()]);

        $studentIds = $pendingUsers
            ->where('role', 'student')
            ->pluck('id')
            ->values();

        if ($studentIds->isNotEmpty()) {
            User::query()
                ->whereIn('id', $studentIds)
                ->get(['id', 'name', 'role', 'code'])
                ->each(function (User $student): void {
                    $this->createAutoInvoiceForApprovedStudent($student);
                });
        }

        return $pendingIds->count();
    }

    public function backfillApprovedStudentInvoices(bool $dryRun = false): array
    {
        if (!Schema::hasTable('users') || !Schema::hasTable('invoices')) {
            return [
                'ok' => false,
                'message' => 'Tabel users/invoices belum tersedia.',
                'total' => 0,
                'created' => 0,
                'skipped' => 0,
            ];
        }

        $students = User::query()
            ->where('role', 'student')
            ->whereNotNull('email_verified_at')
            ->orderBy('id')
            ->get(['id', 'name', 'role', 'code']);

        $created = 0;
        $skipped = 0;
        foreach ($students as $student) {
            if ($dryRun) {
                $wouldCreate = $this->wouldCreateAutoInvoiceForStudent($student);
                if ($wouldCreate) {
                    $created++;
                } else {
                    $skipped++;
                }

                continue;
            }

            $didCreate = $this->createAutoInvoiceForApprovedStudent($student);
            if ($didCreate) {
                $created++;
            } else {
                $skipped++;
            }
        }

        return [
            'ok' => true,
            'message' => 'Backfill tagihan mahasiswa selesai diproses.',
            'total' => $students->count(),
            'created' => $created,
            'skipped' => $skipped,
        ];
    }

    public function getCategoriesData(): array
    {
        $fakultas = Fakultas::query()
            ->with(['jurusans' => fn ($query) => $query->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'slug']);

        $mocked = false;

        return [
            'fakultas' => $fakultas,
            'mocked' => $mocked,
        ];
    }

    public function createFakultas(array $payload): void
    {
        Fakultas::create([
            'name' => $payload['name'],
            'code' => $payload['code'],
            'slug' => Str::slug($payload['name']),
        ]);
    }

    public function updateFakultas(Fakultas $fakultas, array $payload): void
    {
        $fakultas->update([
            'name' => $payload['name'],
            'code' => $payload['code'],
            'slug' => Str::slug($payload['name']),
        ]);
    }

    public function deleteFakultas(Fakultas $fakultas): void
    {
        $fakultas->delete();
    }

    public function createJurusan(array $payload): void
    {
        Jurusan::create([
            'fakultas_id' => $payload['fakultas_id'],
            'name' => $payload['name'],
            'code' => $payload['code'],
            'slug' => Str::slug($payload['name']),
        ]);
    }

    public function updateJurusan(Jurusan $jurusan, array $payload): void
    {
        $jurusan->update([
            'fakultas_id' => $payload['fakultas_id'],
            'name' => $payload['name'],
            'code' => $payload['code'],
            'slug' => Str::slug($payload['name']),
        ]);
    }

    public function deleteJurusan(Jurusan $jurusan): void
    {
        $jurusan->delete();
    }

    public function getSettings(int $adminId): array
    {
        $defaults = [
            'university_name' => 'Universitas Nusantara',
            'university_code' => 'UNNUS',
            'university_website' => 'https://unnus.ac.id',
            'university_phone' => '+62 21-1234-5678',
            'university_address' => 'Jl. Pendidikan No. 1, Jakarta',
            'dashboard_refresh_seconds' => 60,
            'show_pending_first' => true,
            'enable_user_email_notification' => false,
            'default_user_role_filter' => 'all',
        ];

        if (!Schema::hasTable('system_settings')) {
            return $defaults;
        }

        $prefix = $this->settingsPrefix($adminId);
        $stored = SystemSetting::query()
            ->where('key', 'like', $prefix . '%')
            ->pluck('value', 'key');

        return [
            'university_name' => (string) ($stored[$prefix . 'university_name'] ?? $defaults['university_name']),
            'university_code' => (string) ($stored[$prefix . 'university_code'] ?? $defaults['university_code']),
            'university_website' => (string) ($stored[$prefix . 'university_website'] ?? $defaults['university_website']),
            'university_phone' => (string) ($stored[$prefix . 'university_phone'] ?? $defaults['university_phone']),
            'university_address' => (string) ($stored[$prefix . 'university_address'] ?? $defaults['university_address']),
            'dashboard_refresh_seconds' => (int) ($stored[$prefix . 'dashboard_refresh_seconds'] ?? $defaults['dashboard_refresh_seconds']),
            'show_pending_first' => ($stored[$prefix . 'show_pending_first'] ?? ($defaults['show_pending_first'] ? '1' : '0')) === '1',
            'enable_user_email_notification' => ($stored[$prefix . 'enable_user_email_notification'] ?? ($defaults['enable_user_email_notification'] ? '1' : '0')) === '1',
            'default_user_role_filter' => (string) ($stored[$prefix . 'default_user_role_filter'] ?? $defaults['default_user_role_filter']),
        ];
    }

    public function updateSettings(int $adminId, array $payload): bool
    {
        if (!Schema::hasTable('system_settings')) {
            return false;
        }

        $prefix = $this->settingsPrefix($adminId);
        foreach ($payload as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $prefix . $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }

        Cache::forget('dashboard:admin-academic');
        app(SystemSettingService::class)->clearCache();

        return true;
    }

    public function getDashboardData(): array
    {
        return Cache::remember('dashboard:admin-academic', now()->addSeconds(30), function () {
            $thisMonth = now()->startOfMonth();

            $pendingApprovals = User::where('role', '!=', 'root')->whereNull('email_verified_at')->count();
            $newUsersMonth = User::where('role', '!=', 'root')->where('created_at', '>=', $thisMonth)->count();

            $usersByRole = [
                'admin' => User::where('role', 'admin')->count(),
                'teacher' => User::where('role', 'teacher')->count(),
                'student' => User::where('role', 'student')->count(),
                'finance' => User::where('role', 'finance')->count(),
            ];

            $recentActivities = User::query()
                ->where('role', '!=', 'root')
                ->latest('updated_at')
                ->limit(8)
                ->get(['id', 'name', 'role', 'created_at', 'updated_at'])
                ->map(function (User $user) {
                    $created = Carbon::parse($user->created_at);
                    $updated = Carbon::parse($user->updated_at);
                    $isCreate = $created->equalTo($updated);

                    return [
                        'id' => $user->id,
                        'action' => $isCreate ? 'create' : 'update',
                        'text' => $isCreate
                            ? 'Akun baru ditambahkan: ' . $user->name . ' (' . $user->role . ')'
                            : 'Data pengguna diperbarui: ' . $user->name . ' (' . $user->role . ')',
                        'time' => $updated->toISOString(),
                    ];
                })
                ->values();

            $coursesCount = 0;
            $activeCoursesCount = 0;
            $enrollmentTrend = collect();
            $categoryDistribution = collect();
            $latestCourses = collect();
            if (Schema::hasTable('courses')) {
                $coursesCount = Course::count();
                $activeCoursesCount = Course::where('status', 'active')->count();

                $enrollmentTrend = collect(range(0, 5))
                    ->map(function (int $offset): array {
                        $date = now()->subMonths(5 - $offset);
                        $start = $date->copy()->startOfMonth();
                        $end = $date->copy()->endOfMonth();

                        $value = Schema::hasTable('course_student')
                            ? DB::table('course_student')
                                ->whereBetween(DB::raw('COALESCE(enrolled_at, created_at)'), [$start, $end])
                                ->count()
                            : 0;

                        return [
                            'label' => $date->translatedFormat('M Y'),
                            'value' => (int) $value,
                        ];
                    })
                    ->values();

                $categoryDistribution = Course::query()
                    ->selectRaw("COALESCE(NULLIF(TRIM(category), ''), 'Tanpa Kategori') as label")
                    ->selectRaw('COUNT(*) as value')
                    ->groupBy('label')
                    ->orderByDesc('value')
                    ->limit(6)
                    ->get()
                    ->map(fn ($row): array => [
                        'label' => (string) $row->label,
                        'value' => (int) $row->value,
                    ])
                    ->values();

                $latestCourses = Course::query()
                    ->with(['lecturer:id,name'])
                    ->withCount('students')
                    ->latest('id')
                    ->limit(8)
                    ->get(['id', 'title', 'lecturer_id', 'status'])
                    ->map(fn (Course $course): array => [
                        'id' => (int) $course->id,
                        'title' => (string) $course->title,
                        'instructor' => (string) ($course->lecturer?->name ?? '-'),
                        'students' => (int) ($course->students_count ?? 0),
                        'status' => (string) ($course->status ?? 'draft'),
                    ])
                    ->values();
            }

            return [
                'summary' => [
                    'total_users' => array_sum($usersByRole),
                    'pending_approvals' => $pendingApprovals,
                    'new_users_month' => $newUsersMonth,
                    'fakultas_count' => Fakultas::count(),
                    'jurusan_count' => Jurusan::count(),
                    'courses_count' => $coursesCount,
                    'active_courses_count' => $activeCoursesCount,
                ],
                'role_stats' => $usersByRole,
                'recent_activities' => $recentActivities,
                'enrollment_trend' => $enrollmentTrend,
                'category_distribution' => $categoryDistribution,
                'latest_courses' => $latestCourses,
            ];
        });
    }

    public function getAcademicReportData(string $period = 'monthly', ?int $courseId = null): array
    {
        $selectedPeriod = $this->normalizePeriod($period);
        $dashboard = $this->getDashboardData();
        $analytics = $this->getLearningAnalyticsData($selectedPeriod, $courseId);

        $enrollmentTrend = $this->buildEnrollmentTrend($selectedPeriod, $courseId);
        $completionTrend = $analytics['completion_trend'] ?? [];
        $scoreTrend = $analytics['score_trend'] ?? [];
        $topCourses = $this->buildTopCourses($courseId);
        $latestEnrollment = $this->extractLatestTrendValue($enrollmentTrend);
        $previousEnrollment = $this->extractPreviousTrendValue($enrollmentTrend);
        $latestCompletionRate = $this->extractLatestTrendValue($completionTrend);
        $previousCompletionRate = $this->extractPreviousTrendValue($completionTrend);
        $latestScore = (float) ($analytics['summary']['average_score'] ?? 0);
        $previousScore = $this->extractPreviousTrendValue($scoreTrend);

        $completedEnrollments = (int) round(($latestEnrollment * max(0, $latestCompletionRate)) / 100);
        $previousCompletedEnrollments = (int) round(($previousEnrollment * max(0, $previousCompletionRate)) / 100);

        $activeCourses = (int) ($dashboard['summary']['active_courses_count'] ?? 0);
        $periodBuckets = $this->buildPeriodBuckets($selectedPeriod);
        $previousBucket = $periodBuckets->count() >= 2 ? $periodBuckets[$periodBuckets->count() - 2] : null;
        $previousActiveCourses = $previousBucket !== null
            ? $this->resolveActiveCoursesCount($courseId !== null && $courseId > 0 ? $courseId : null, $previousBucket['end'] ?? null)
            : 0;

        return [
            'filters' => [
                'period' => $selectedPeriod,
                'course_id' => $analytics['filters']['course_id'] ?? null,
            ],
            'summary' => [
                'total_enrollment' => $latestEnrollment,
                'completed_courses' => $completedEnrollments,
                'active_courses' => $activeCourses,
                'average_score' => $latestScore,
            ],
            'summary_changes' => [
                'total_enrollment' => $this->formatMetricChange($latestEnrollment, $previousEnrollment, '%'),
                'completed_courses' => $this->formatMetricChange($completedEnrollments, $previousCompletedEnrollments, '%'),
                'active_courses' => $this->formatMetricChange($activeCourses, $previousActiveCourses, '%'),
                'average_score' => $this->formatMetricChange($latestScore, $previousScore, 'point'),
            ],
            'enrollment_trend' => $enrollmentTrend,
            'completion_trend' => $completionTrend,
            'progress_distribution' => $analytics['progress_distribution'] ?? [],
            'top_courses' => $topCourses,
            'available_courses' => $analytics['available_courses'] ?? [],
            'analytics' => $analytics,
        ];
    }

    public function getLearningAnalyticsData(string $period = 'monthly', ?int $courseId = null): array
    {
        $selectedPeriod = $this->normalizePeriod($period);
        $selectedCourseId = $courseId !== null && $courseId > 0 ? $courseId : null;
        $buckets = $this->buildPeriodBuckets($selectedPeriod);
        $availableCourses = $this->buildCourseOptions();
        $courseIds = $this->resolveScopedCourseIds($selectedCourseId);

        if ($courseIds === []) {
            return [
                'filters' => [
                    'period' => $selectedPeriod,
                    'course_id' => null,
                ],
                'summary' => [
                    'total_students' => 0,
                    'total_lessons' => 0,
                    'completion_rate' => 0.0,
                    'engagement_rate' => 0.0,
                    'average_score' => 0.0,
                ],
                'completion_trend' => $this->emptyTrend($buckets),
                'engagement_trend' => $this->emptyTrend($buckets),
                'score_trend' => $this->emptyTrend($buckets),
                'progress_distribution' => [
                    ['label' => '0-25%', 'value' => 0],
                    ['label' => '26-50%', 'value' => 0],
                    ['label' => '51-75%', 'value' => 0],
                    ['label' => '76-100%', 'value' => 0],
                ],
                'available_courses' => $availableCourses,
            ];
        }

        $studentIds = $this->resolveScopedStudentIds($courseIds);
        $lessonIds = $this->resolveScopedLessonIds($courseIds);
        $totalStudents = count($studentIds);
        $totalLessons = count($lessonIds);

        $totalCompletedEntries = empty($lessonIds)
            ? 0
            : (int) DB::table('lesson_progress')
                ->whereIn('lesson_id', $lessonIds)
                ->where('is_completed', true)
                ->count();
        $completionDenominator = max(1, $totalLessons * max(1, $totalStudents));
        $completionRate = round(($totalCompletedEntries / $completionDenominator) * 100, 1);

        $activeStudents = empty($studentIds)
            ? 0
            : (int) DB::table('lesson_progress')
                ->when(!empty($lessonIds), fn ($query) => $query->whereIn('lesson_id', $lessonIds))
                ->whereIn('student_id', $studentIds)
                ->whereNotNull('last_accessed_at')
                ->where('last_accessed_at', '>=', now()->subDays($this->engagementWindowDays($selectedPeriod)))
                ->distinct('student_id')
                ->count('student_id');
        $engagementRate = $totalStudents > 0 ? round(($activeStudents / $totalStudents) * 100, 1) : 0.0;

        $scores = $this->collectScores($courseIds);
        $averageScore = count($scores) > 0 ? round(collect($scores)->avg(), 1) : 0.0;

        return [
            'filters' => [
                'period' => $selectedPeriod,
                'course_id' => $selectedCourseId,
            ],
            'summary' => [
                'total_students' => $totalStudents,
                'total_lessons' => $totalLessons,
                'completion_rate' => $completionRate,
                'engagement_rate' => $engagementRate,
                'average_score' => $averageScore,
            ],
            'completion_trend' => $this->buildCompletionTrend($buckets, $lessonIds, $studentIds),
            'engagement_trend' => $this->buildEngagementTrend($buckets, $lessonIds, $studentIds),
            'score_trend' => $this->buildScoreTrend($buckets, $courseIds),
            'progress_distribution' => $this->buildProgressDistribution($lessonIds, $studentIds),
            'available_courses' => $availableCourses,
        ];
    }

    public function exportAcademicReport(string $period = 'monthly', string $format = 'csv', ?int $courseId = null): SymfonyResponse|StreamedResponse
    {
        $selectedFormat = in_array(Str::lower($format), ['csv', 'pdf'], true) ? Str::lower($format) : 'csv';

        return $selectedFormat === 'pdf'
            ? $this->exportAcademicReportPdf($period, $courseId)
            : $this->exportAcademicReportCsv($period, $courseId);
    }

    public function exportAcademicReportCsv(string $period = 'monthly', ?int $courseId = null): StreamedResponse
    {
        $data = $this->getAcademicReportData($period, $courseId);
        $analytics = $data['analytics'] ?? [];
        $fileName = 'laporan-akademik-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($data, $analytics): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Metric', 'Value']);
            fputcsv($handle, ['Period', $data['filters']['period'] ?? 'monthly']);
            fputcsv($handle, ['Course ID', $data['filters']['course_id'] ?? 'all']);
            fputcsv($handle, ['Total Enrollment', $data['summary']['total_enrollment'] ?? 0]);
            fputcsv($handle, ['Completed Courses', $data['summary']['completed_courses'] ?? 0]);
            fputcsv($handle, ['Active Courses', $data['summary']['active_courses'] ?? 0]);
            fputcsv($handle, ['Average Score', $data['summary']['average_score'] ?? 0]);
            fputcsv($handle, ['Completion Rate', ($analytics['summary']['completion_rate'] ?? 0) . '%']);
            fputcsv($handle, ['Engagement Rate', ($analytics['summary']['engagement_rate'] ?? 0) . '%']);
            fputcsv($handle, []);

            fputcsv($handle, ['Top Courses']);
            fputcsv($handle, ['Rank', 'Course', 'Enrollment', 'Completion %']);
            foreach ($data['top_courses'] ?? [] as $course) {
                fputcsv($handle, [
                    $course['rank'] ?? '',
                    $course['name'] ?? '',
                    $course['enrollment'] ?? 0,
                    ($course['completion'] ?? 0) . '%',
                ]);
            }

            fputcsv($handle, []);
            fputcsv($handle, ['Learning Analytics Trend']);
            fputcsv($handle, ['Label', 'Completion %', 'Engagement %', 'Score']);
            $completionTrend = $analytics['completion_trend'] ?? [];
            $engagementTrend = $analytics['engagement_trend'] ?? [];
            $scoreTrend = $analytics['score_trend'] ?? [];
            foreach ($completionTrend as $index => $item) {
                fputcsv($handle, [
                    $item['label'] ?? '',
                    $item['value'] ?? 0,
                    $engagementTrend[$index]['value'] ?? 0,
                    $scoreTrend[$index]['value'] ?? 0,
                ]);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function exportAcademicReportPdf(string $period = 'monthly', ?int $courseId = null): SymfonyResponse
    {
        $data = $this->getAcademicReportData($period, $courseId);
        $analytics = $data['analytics'] ?? [];
        $pdfContent = $this->buildBasicPdf([
            'Laporan Akademik',
            'Periode: ' . ($data['filters']['period'] ?? 'monthly'),
            'Filter Course ID: ' . (($data['filters']['course_id'] ?? null) ?: 'all'),
            'Total Enrollment: ' . (string) ($data['summary']['total_enrollment'] ?? 0),
            'Completed Courses: ' . (string) ($data['summary']['completed_courses'] ?? 0),
            'Active Courses: ' . (string) ($data['summary']['active_courses'] ?? 0),
            'Average Score: ' . (string) ($data['summary']['average_score'] ?? 0),
            'Completion Rate: ' . (string) (($analytics['summary']['completion_rate'] ?? 0) . '%'),
            'Engagement Rate: ' . (string) (($analytics['summary']['engagement_rate'] ?? 0) . '%'),
        ]);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="laporan-akademik-' . now()->format('Ymd-His') . '.pdf"',
        ]);
    }

    private function settingsPrefix(int $adminId): string
    {
        return 'admin_' . $adminId . '_';
    }

    private function buildEnrollmentTrend(string $period, ?int $courseId = null): array
    {
        $buckets = $this->buildPeriodBuckets($period);
        $courseIds = $this->resolveScopedCourseIds($courseId !== null && $courseId > 0 ? $courseId : null);

        return $buckets->map(function (array $bucket) use ($courseIds): array {
            if ($courseIds === [] || !Schema::hasTable('course_student')) {
                return ['label' => $bucket['label'], 'value' => 0];
            }

            $value = DB::table('course_student')
                ->whereIn('course_id', $courseIds)
                ->whereBetween(DB::raw('COALESCE(enrolled_at, created_at)'), [$bucket['start'], $bucket['end']])
                ->count();

            return [
                'label' => $bucket['label'],
                'value' => (int) $value,
            ];
        })->all();
    }

    private function buildTopCourses(?int $courseId = null): array
    {
        if (!Schema::hasTable('courses')) {
            return [];
        }

        $query = Course::query()->with('lecturer:id,name');
        if ($courseId !== null && $courseId > 0) {
            $query->where('id', $courseId);
        }

        if (Schema::hasTable('course_student')) {
            $query->withCount('students')->orderByDesc('students_count');
        } else {
            $query->orderBy('title');
        }

        $courses = $query->limit(5)->get();
        if ($courses->isEmpty()) {
            return [];
        }

        $courseIds = $courses->pluck('id')->map(fn ($id): int => (int) $id)->all();
        $completionStats = $this->buildTopCourseCompletionStats($courseIds);

        return $courses
            ->values()
            ->map(function (Course $course, int $index) use ($completionStats): array {
                $courseKey = (int) $course->id;
                $enrollment = (int) ($course->students_count ?? 0);
                $completion = (float) ($completionStats[$courseKey]['completion'] ?? 0);
                $completed = (int) ($completionStats[$courseKey]['completed'] ?? 0);

                return [
                    'rank' => $index + 1,
                    'name' => $course->title,
                    'instructor' => $course->lecturer?->name ?? '-',
                    'enrollment' => $enrollment,
                    'completion' => $completion,
                    'completed' => $completed,
                ];
            })
            ->all();
    }

    private function buildTopCourseCompletionStats(array $courseIds): array
    {
        $baseline = collect($courseIds)->mapWithKeys(fn (int $id): array => [$id => ['completion' => 0.0, 'completed' => 0]])->all();
        if (
            $courseIds === [] ||
            !Schema::hasTable('course_student') ||
            !Schema::hasTable('course_modules') ||
            !Schema::hasTable('course_lessons') ||
            !Schema::hasTable('lesson_progress')
        ) {
            return $baseline;
        }

        $enrollmentRows = DB::table('course_student')
            ->whereIn('course_id', $courseIds)
            ->select('course_id', DB::raw('COUNT(DISTINCT student_id) as total_students'))
            ->groupBy('course_id')
            ->get();
        $enrollmentByCourse = $enrollmentRows
            ->mapWithKeys(fn ($row): array => [(int) $row->course_id => (int) $row->total_students])
            ->all();

        $lessonRows = DB::table('course_lessons')
            ->join('course_modules', 'course_modules.id', '=', 'course_lessons.course_module_id')
            ->whereIn('course_modules.course_id', $courseIds)
            ->select('course_modules.course_id', DB::raw('COUNT(course_lessons.id) as total_lessons'))
            ->groupBy('course_modules.course_id')
            ->get();
        $lessonByCourse = $lessonRows
            ->mapWithKeys(fn ($row): array => [(int) $row->course_id => (int) $row->total_lessons])
            ->all();

        $completedRows = DB::table('lesson_progress')
            ->join('course_lessons', 'course_lessons.id', '=', 'lesson_progress.lesson_id')
            ->join('course_modules', 'course_modules.id', '=', 'course_lessons.course_module_id')
            ->join('course_student', function ($join): void {
                $join->on('course_student.course_id', '=', 'course_modules.course_id')
                    ->on('course_student.student_id', '=', 'lesson_progress.student_id');
            })
            ->whereIn('course_modules.course_id', $courseIds)
            ->where('lesson_progress.is_completed', true)
            ->select('course_modules.course_id', DB::raw('COUNT(*) as completed_entries'))
            ->groupBy('course_modules.course_id')
            ->get();
        $completedEntriesByCourse = $completedRows
            ->mapWithKeys(fn ($row): array => [(int) $row->course_id => (int) $row->completed_entries])
            ->all();

        return collect($courseIds)->mapWithKeys(function (int $id) use ($enrollmentByCourse, $lessonByCourse, $completedEntriesByCourse): array {
            $totalStudents = (int) ($enrollmentByCourse[$id] ?? 0);
            $totalLessons = (int) ($lessonByCourse[$id] ?? 0);
            $completedEntries = (int) ($completedEntriesByCourse[$id] ?? 0);
            $denominator = max(1, $totalStudents * $totalLessons);
            $completion = ($totalStudents > 0 && $totalLessons > 0)
                ? round(($completedEntries / $denominator) * 100, 1)
                : 0.0;
            $completed = (int) round(($completion / 100) * $totalStudents);

            return [
                $id => [
                    'completion' => max(0, min(100, $completion)),
                    'completed' => max(0, $completed),
                ],
            ];
        })->all();
    }

    private function estimateAverageScore(array $topCourses): float
    {
        if ($topCourses === []) {
            return 0.0;
        }

        $weighted = collect($topCourses)->reduce(function (float $carry, array $item): float {
            $completion = (float) ($item['completion'] ?? 0);
            $enrollment = max((int) ($item['enrollment'] ?? 1), 1);
            return $carry + (($completion / 100) * 100 * min($enrollment, 500));
        }, 0.0);

        $weights = collect($topCourses)->sum(fn (array $item): int => max((int) ($item['enrollment'] ?? 1), 1));
        if ($weights === 0) {
            return 0.0;
        }

        return round($weighted / $weights, 1);
    }

    private function normalizePeriod(string $period): string
    {
        return in_array($period, ['monthly', 'quarterly', 'yearly'], true) ? $period : 'monthly';
    }

    private function extractLatestTrendValue(array $trend): float
    {
        if ($trend === []) {
            return 0.0;
        }

        $last = $trend[array_key_last($trend)] ?? ['value' => 0];
        return (float) ($last['value'] ?? 0);
    }

    private function extractPreviousTrendValue(array $trend): float
    {
        if (count($trend) < 2) {
            return 0.0;
        }

        $previous = $trend[count($trend) - 2] ?? ['value' => 0];
        return (float) ($previous['value'] ?? 0);
    }

    private function formatMetricChange(float|int $current, float|int $previous, string $mode = '%'): string
    {
        if ($previous <= 0) {
            if ($current <= 0) {
                return '0% dari periode sebelumnya';
            }

            return 'Data pembanding belum cukup';
        }

        if ($mode === 'point') {
            $delta = round($current - $previous, 1);
            $sign = $delta > 0 ? '+' : '';
            return $sign . number_format($delta, 1) . ' poin dari periode sebelumnya';
        }

        $deltaPercent = round((($current - $previous) / $previous) * 100, 1);
        $sign = $deltaPercent > 0 ? '+' : '';
        return $sign . number_format($deltaPercent, 1) . '% dari periode sebelumnya';
    }

    private function resolveActiveCoursesCount(?int $courseId = null, mixed $createdAtLte = null): int
    {
        if (!Schema::hasTable('courses')) {
            return 0;
        }

        $query = Course::query()->where('status', 'active');
        if ($courseId !== null && $courseId > 0) {
            $query->where('id', $courseId);
        }
        if ($createdAtLte !== null) {
            $query->where('created_at', '<=', $createdAtLte);
        }

        return (int) $query->count();
    }

    private function buildPeriodBuckets(string $period): Collection
    {
        $now = now();

        if ($period === 'quarterly') {
            return collect(range(3, 0))
                ->map(function (int $offset) use ($now): array {
                    $date = $now->copy()->subQuarters($offset - 1)->startOfQuarter();

                    return [
                        'label' => 'Q' . $date->quarter . ' ' . $date->year,
                        'start' => $date->copy()->startOfQuarter(),
                        'end' => $date->copy()->endOfQuarter(),
                    ];
                })
                ->values();
        }

        if ($period === 'yearly') {
            return collect(range(4, 0))
                ->map(function (int $offset) use ($now): array {
                    $date = $now->copy()->subYears($offset - 1)->startOfYear();

                    return [
                        'label' => (string) $date->year,
                        'start' => $date->copy()->startOfYear(),
                        'end' => $date->copy()->endOfYear(),
                    ];
                })
                ->values();
        }

        return collect(range(5, 0))
            ->map(function (int $offset) use ($now): array {
                $date = $now->copy()->subMonths($offset - 1)->startOfMonth();

                return [
                    'label' => $date->format('M Y'),
                    'start' => $date->copy()->startOfMonth(),
                    'end' => $date->copy()->endOfMonth(),
                ];
            })
            ->values();
    }

    private function buildCourseOptions(): array
    {
        if (!Schema::hasTable('courses')) {
            return [];
        }

        return Course::query()
            ->orderBy('title')
            ->get(['id', 'title'])
            ->map(fn (Course $course): array => ['id' => $course->id, 'title' => $course->title])
            ->all();
    }

    private function resolveScopedCourseIds(?int $courseId): array
    {
        if (!Schema::hasTable('courses')) {
            return [];
        }

        return Course::query()
            ->when($courseId !== null && $courseId > 0, fn ($query) => $query->where('id', $courseId))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function resolveScopedStudentIds(array $courseIds): array
    {
        if ($courseIds === [] || !Schema::hasTable('course_student')) {
            return [];
        }

        return DB::table('course_student')
            ->whereIn('course_id', $courseIds)
            ->distinct()
            ->pluck('student_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function resolveScopedLessonIds(array $courseIds): array
    {
        if ($courseIds === [] || !Schema::hasTable('course_modules') || !Schema::hasTable('course_lessons')) {
            return [];
        }

        return DB::table('course_lessons')
            ->join('course_modules', 'course_modules.id', '=', 'course_lessons.course_module_id')
            ->whereIn('course_modules.course_id', $courseIds)
            ->pluck('course_lessons.id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function collectScores(array $courseIds): array
    {
        if ($courseIds === []) {
            return [];
        }

        $assignmentScores = Schema::hasTable('assignment_submissions') && Schema::hasTable('assignments')
            ? DB::table('assignment_submissions')
                ->join('assignments', 'assignments.id', '=', 'assignment_submissions.assignment_id')
                ->whereIn('assignments.course_id', $courseIds)
                ->whereNotNull('assignment_submissions.score')
                ->pluck('assignment_submissions.score')
                ->map(fn ($value) => (float) $value)
                ->all()
            : [];

        $quizScores = Schema::hasTable('quiz_attempts') && Schema::hasTable('quizzes')
            ? DB::table('quiz_attempts')
                ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quiz_id')
                ->whereIn('quizzes.course_id', $courseIds)
                ->whereNotNull('quiz_attempts.score')
                ->pluck('quiz_attempts.score')
                ->map(fn ($value) => (float) $value)
                ->all()
            : [];

        return [...$assignmentScores, ...$quizScores];
    }

    private function buildCompletionTrend(Collection $buckets, array $lessonIds, array $studentIds): array
    {
        return $buckets->map(function (array $bucket) use ($lessonIds, $studentIds): array {
            if ($lessonIds === [] || $studentIds === [] || !Schema::hasTable('lesson_progress')) {
                return ['label' => $bucket['label'], 'value' => 0];
            }

            $query = DB::table('lesson_progress')
                ->whereIn('lesson_id', $lessonIds)
                ->whereIn('student_id', $studentIds)
                ->whereBetween('updated_at', [$bucket['start'], $bucket['end']]);

            $total = (clone $query)->count();
            $completed = (clone $query)->where('is_completed', true)->count();
            $value = $total > 0 ? round(($completed / $total) * 100, 1) : 0;

            return ['label' => $bucket['label'], 'value' => $value];
        })->all();
    }

    private function buildEngagementTrend(Collection $buckets, array $lessonIds, array $studentIds): array
    {
        return $buckets->map(function (array $bucket) use ($lessonIds, $studentIds): array {
            if ($lessonIds === [] || $studentIds === [] || !Schema::hasTable('lesson_progress')) {
                return ['label' => $bucket['label'], 'value' => 0];
            }

            $active = DB::table('lesson_progress')
                ->whereIn('lesson_id', $lessonIds)
                ->whereIn('student_id', $studentIds)
                ->whereBetween('last_accessed_at', [$bucket['start'], $bucket['end']])
                ->distinct('student_id')
                ->count('student_id');
            $value = count($studentIds) > 0 ? round(($active / count($studentIds)) * 100, 1) : 0;

            return ['label' => $bucket['label'], 'value' => $value];
        })->all();
    }

    private function buildScoreTrend(Collection $buckets, array $courseIds): array
    {
        return $buckets->map(function (array $bucket) use ($courseIds): array {
            if ($courseIds === []) {
                return ['label' => $bucket['label'], 'value' => 0];
            }

            $assignmentScores = [];
            if (Schema::hasTable('assignment_submissions') && Schema::hasTable('assignments')) {
                $assignmentScores = DB::table('assignment_submissions')
                    ->join('assignments', 'assignments.id', '=', 'assignment_submissions.assignment_id')
                    ->whereIn('assignments.course_id', $courseIds)
                    ->whereNotNull('assignment_submissions.score')
                    ->whereBetween(DB::raw('COALESCE(assignment_submissions.graded_at, assignment_submissions.updated_at)'), [$bucket['start'], $bucket['end']])
                    ->pluck('assignment_submissions.score')
                    ->map(fn ($score) => (float) $score)
                    ->all();
            }

            $quizScores = [];
            if (Schema::hasTable('quiz_attempts') && Schema::hasTable('quizzes')) {
                $quizScores = DB::table('quiz_attempts')
                    ->join('quizzes', 'quizzes.id', '=', 'quiz_attempts.quiz_id')
                    ->whereIn('quizzes.course_id', $courseIds)
                    ->whereNotNull('quiz_attempts.score')
                    ->whereBetween(DB::raw('COALESCE(quiz_attempts.graded_at, quiz_attempts.updated_at)'), [$bucket['start'], $bucket['end']])
                    ->pluck('quiz_attempts.score')
                    ->map(fn ($score) => (float) $score)
                    ->all();
            }

            $scores = [...$assignmentScores, ...$quizScores];
            $value = count($scores) > 0 ? round(collect($scores)->avg(), 1) : 0;

            return ['label' => $bucket['label'], 'value' => $value];
        })->all();
    }

    private function buildProgressDistribution(array $lessonIds, array $studentIds): array
    {
        if ($lessonIds === [] || $studentIds === [] || !Schema::hasTable('lesson_progress')) {
            return [
                ['label' => '0-25%', 'value' => 0],
                ['label' => '26-50%', 'value' => 0],
                ['label' => '51-75%', 'value' => 0],
                ['label' => '76-100%', 'value' => 0],
            ];
        }

        $rows = DB::table('lesson_progress')
            ->whereIn('lesson_id', $lessonIds)
            ->whereIn('student_id', $studentIds)
            ->pluck('progress_percent')
            ->map(fn ($value) => (int) $value);

        $total = max(1, $rows->count());
        $bands = [
            '0-25%' => $rows->filter(fn ($value) => $value <= 25)->count(),
            '26-50%' => $rows->filter(fn ($value) => $value >= 26 && $value <= 50)->count(),
            '51-75%' => $rows->filter(fn ($value) => $value >= 51 && $value <= 75)->count(),
            '76-100%' => $rows->filter(fn ($value) => $value >= 76)->count(),
        ];

        return collect($bands)
            ->map(fn (int $count, string $label): array => [
                'label' => $label,
                'value' => (int) round(($count / $total) * 100),
            ])
            ->values()
            ->all();
    }

    private function emptyTrend(Collection $buckets): array
    {
        return $buckets
            ->map(fn (array $bucket): array => ['label' => $bucket['label'], 'value' => 0])
            ->all();
    }

    private function engagementWindowDays(string $period): int
    {
        return match ($period) {
            'quarterly' => 90,
            'yearly' => 365,
            default => 30,
        };
    }

    private function buildBasicPdf(array $lines): string
    {
        $escape = static fn (string $text): string => str_replace(
            ['\\', '(', ')'],
            ['\\\\', '\\(', '\\)'],
            $text
        );

        $streamLines = [];
        $initialY = 780;
        foreach ($lines as $index => $line) {
            $y = $initialY - ($index * 18);
            $streamLines[] = 'BT /F1 12 Tf 40 ' . $y . ' Td (' . $escape($line) . ') Tj ET';
        }
        $stream = implode("\n", $streamLines);

        $objects = [];
        $objects[] = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj";
        $objects[] = "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj";
        $objects[] = "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj";
        $objects[] = "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj";
        $objects[] = "5 0 obj << /Length " . strlen($stream) . " >> stream\n" . $stream . "\nendstream endobj";

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object . "\n";
        }

        $xrefPosition = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        $pdf .= "trailer << /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n" . $xrefPosition . "\n%%EOF";

        return $pdf;
    }

    private function normalizeCoursePayload(array $payload): array
    {
        $normalizedTags = collect($payload['tags'] ?? [])
            ->map(fn ($tag) => Str::squish((string) $tag))
            ->filter(fn ($tag) => $tag !== '')
            ->unique(fn ($tag) => Str::lower($tag))
            ->take(10)
            ->values()
            ->all();

        $payload['category'] = isset($payload['category']) && trim((string) $payload['category']) !== ''
            ? trim((string) $payload['category'])
            : null;
        $payload['tags'] = $normalizedTags === [] ? null : $normalizedTags;

        return $payload;
    }

    private function resolveUserJurusanId(array $payload): ?int
    {
        $role = (string) ($payload['role'] ?? '');
        if (!in_array($role, ['teacher', 'student'], true)) {
            return null;
        }

        if (!isset($payload['jurusan_id']) || $payload['jurusan_id'] === null || $payload['jurusan_id'] === '') {
            return null;
        }

        return (int) $payload['jurusan_id'];
    }

    private function buildJurusanCourseTitle(string $jurusanName, int $index): string
    {
        $prefix = match ($index) {
            1 => 'Pengantar',
            2 => 'Praktikum',
            default => 'Proyek',
        };

        return $prefix . ' ' . $jurusanName;
    }

    private function normalizeJurusanCode(string $code, int $jurusanId): string
    {
        $clean = strtoupper((string) preg_replace('/[^A-Z0-9]/', '', $code));
        if ($clean === '') {
            return 'JR' . str_pad((string) $jurusanId, 2, '0', STR_PAD_LEFT);
        }

        return substr($clean, 0, 4);
    }

    private function normalizeNumericCode(string $rawCode, int $fallbackId, int $length = 2): string
    {
        $digits = (string) preg_replace('/\D+/', '', $rawCode);
        if ($digits === '') {
            $digits = (string) $fallbackId;
        }

        return str_pad(substr($digits, -$length), $length, '0', STR_PAD_LEFT);
    }

    private function seederCampusCode(): string
    {
        return '5173';
    }

    private function seederYearCode(): string
    {
        $year = now()->format('Y');
        return substr($year, -2) . substr($year, 0, 2);
    }

    private function nextSequenceFromPrefix(string $prefix): int
    {
        $maxSeq = User::query()
            ->where('code', 'like', $prefix . '%')
            ->pluck('code')
            ->map(function ($code): int {
                $code = (string) $code;
                return (int) substr($code, -3);
            })
            ->max();

        return max(1, ((int) $maxSeq) + 1);
    }

    private function generateRandomIndonesianName(string $role): string
    {
        $firstNames = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gilang', 'Hana', 'Intan', 'Joko', 'Karina', 'Lukman', 'Maya', 'Nadia', 'Putra', 'Rani', 'Satria', 'Tari', 'Vina', 'Yusuf'];
        $lastNames = ['Herlambang', 'Santoso', 'Lestari', 'Pratama', 'Saputra', 'Nugroho', 'Permata', 'Ramadhan', 'Wijaya', 'Maulana', 'Kusuma', 'Aulia', 'Pranata', 'Susanti', 'Purnomo', 'Hidayat', 'Rahmawati'];

        $first = $firstNames[array_rand($firstNames)];
        $last = $lastNames[array_rand($lastNames)];

        if ($role === 'teacher') {
            $titles = ['Dr.', 'Prof.', ''];
            $title = $titles[array_rand($titles)];
            $name = trim($title . ' ' . $first . ' ' . $last);

            return preg_replace('/\s+/', ' ', $name) ?? ($first . ' ' . $last);
        }

        return $first . ' ' . $last;
    }

    private function buildUniqueIdentityFromName(string $name, string $role): array
    {
        $baseUsername = $this->buildSeederStyleUsername($name, $role);
        $username = $this->generateUniqueValue('users', 'username', $baseUsername, 60);
        $domain = $role === 'teacher' ? 'lecturer.ac.id' : 'univ.ac.id';
        $email = $this->generateUniqueEmailFromUsername($username, $domain);

        return [
            'username' => $username,
            'email' => $email,
        ];
    }

    private function buildSeederStyleUsername(string $name, string $role): string
    {
        $plain = Str::lower(Str::ascii($name));
        $plain = (string) preg_replace('/[^a-z\s]/', ' ', $plain);
        $parts = collect(explode(' ', $plain))
            ->map(fn ($item) => trim($item))
            ->filter()
            ->values();

        if ($parts->isEmpty()) {
            return $role === 'teacher' ? 'dosen' : 'mahasiswa';
        }

        if ($role === 'student' && $parts->count() >= 2) {
            $first = (string) $parts->first();
            $last = (string) $parts->last();
            $lastInitial = substr($last, 0, 1);

            return substr($first . '_' . $lastInitial, 0, 60);
        }

        return substr($parts->implode(''), 0, 60);
    }

    private function generateUniqueValue(string $table, string $column, string $base, int $maxLength): string
    {
        $candidateBase = trim($base) !== '' ? trim($base) : 'user';
        $candidate = substr($candidateBase, 0, $maxLength);
        $counter = 1;

        while (DB::table($table)->where($column, $candidate)->exists()) {
            $counter++;
            $suffix = (string) $counter;
            $candidate = substr($candidateBase, 0, max(1, $maxLength - strlen($suffix))) . $suffix;
        }

        return $candidate;
    }

    private function generateUniqueEmailFromUsername(string $username, string $domain): string
    {
        $localBase = substr(Str::lower($username), 0, 64);
        $candidate = $localBase . '@' . $domain;
        $counter = 1;

        while (DB::table('users')->where('email', $candidate)->exists()) {
            $counter++;
            $suffix = (string) $counter;
            $local = substr($localBase, 0, max(1, 64 - strlen($suffix))) . $suffix;
            $candidate = $local . '@' . $domain;
        }

        return $candidate;
    }

    private function generateUniqueString(string $table, string $column, string $base): string
    {
        $normalized = Str::lower(trim($base));
        $normalized = (string) preg_replace('/[^a-z0-9._-]/', '-', $normalized);
        $normalized = trim($normalized, '-._');
        if ($normalized === '') {
            $normalized = 'user';
        }

        $suffix = Str::lower(Str::random(6));

        return substr($normalized . '-' . $suffix, 0, 60);
    }

    private function generateUniqueEmail(string $localPart): string
    {
        $normalized = Str::lower(trim($localPart));
        $normalized = (string) preg_replace('/[^a-z0-9._-]/', '.', $normalized);
        $normalized = trim($normalized, '.');
        if ($normalized === '') {
            $normalized = 'user';
        }

        $domain = 'kampus.local';
        $suffix = Str::lower(Str::random(6));
        $local = substr($normalized . '.' . $suffix, 0, 64);

        return "{$local}@{$domain}";
    }

    private function generateUniqueCode(string $prefix, string $jurusanCode): string
    {
        $base = strtoupper($prefix) . now()->format('ym') . str_pad(substr(strtoupper($jurusanCode), 0, 4), 4, 'X');
        $suffix = strtoupper(Str::random(6));
        $candidate = substr($base . $suffix, 0, 40);

        return $candidate;
    }

    private function generateUniqueCourseCode(string $jurusanCode, int $sequence): string
    {
        $base = str_pad(substr(strtoupper($jurusanCode), 0, 4), 4, 'X');
        $seq = str_pad((string) max(1, $sequence), 2, '0', STR_PAD_LEFT);
        $candidate = "{$base}-" . now()->format('ym') . "-{$seq}-" . strtoupper(Str::random(4));

        return $candidate;
    }

    private function parseUserImportRows(UploadedFile $file): array
    {
        $extension = Str::lower((string) $file->getClientOriginalExtension());
        if (in_array($extension, ['xlsx'], true)) {
            return $this->parseXlsxRows($file);
        }

        return $this->parseCsvRows($file);
    }

    private function parseCsvRows(UploadedFile $file): array
    {
        $rows = [];
        $path = $file->getRealPath();
        if (!$path) {
            return [];
        }

        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return [];
        }

        $headers = [];
        $line = 0;
        while (($data = fgetcsv($handle, 0, ',')) !== false) {
            if ($line === 0) {
                $headers = array_map(fn ($value) => $this->normalizeImportHeader((string) $value), $data);
                $line++;
                continue;
            }

            if ($headers === []) {
                continue;
            }

            $assoc = [];
            foreach ($headers as $idx => $header) {
                if ($header === '') {
                    continue;
                }
                $assoc[$header] = isset($data[$idx]) ? trim((string) $data[$idx]) : '';
            }
            $rows[] = $assoc;
            $line++;
        }

        fclose($handle);

        return $rows;
    }

    private function parseXlsxRows(UploadedFile $file): array
    {
        if (!class_exists(\ZipArchive::class)) {
            return [];
        }

        $path = $file->getRealPath();
        if (!$path) {
            return [];
        }

        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return [];
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            $zip->close();
            return [];
        }

        $sharedStrings = [];
        $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXml !== false) {
            $shared = @simplexml_load_string($sharedXml);
            if ($shared && isset($shared->si)) {
                foreach ($shared->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                        continue;
                    }

                    $parts = [];
                    if (isset($si->r)) {
                        foreach ($si->r as $run) {
                            $parts[] = (string) ($run->t ?? '');
                        }
                    }
                    $sharedStrings[] = implode('', $parts);
                }
            }
        }

        $sheet = @simplexml_load_string($sheetXml);
        $zip->close();
        if (!$sheet || !isset($sheet->sheetData->row)) {
            return [];
        }

        $grid = [];
        foreach ($sheet->sheetData->row as $row) {
            $rowIndex = (int) ($row['r'] ?? 0);
            foreach ($row->c as $cell) {
                $cellRef = (string) ($cell['r'] ?? '');
                if ($cellRef === '') {
                    continue;
                }
                $colLetters = preg_replace('/\d+/', '', $cellRef);
                $colIndex = $this->columnLettersToIndex((string) $colLetters);
                $type = (string) ($cell['t'] ?? '');
                $value = '';

                if ($type === 's') {
                    $sharedIndex = (int) ($cell->v ?? -1);
                    $value = $sharedStrings[$sharedIndex] ?? '';
                } elseif ($type === 'inlineStr') {
                    $value = (string) ($cell->is->t ?? '');
                } else {
                    $value = (string) ($cell->v ?? '');
                }

                $grid[$rowIndex][$colIndex] = trim($value);
            }
        }

        if (!isset($grid[1])) {
            return [];
        }

        $headerRow = $grid[1];
        ksort($headerRow);
        $headers = [];
        foreach ($headerRow as $col => $headerValue) {
            $headers[$col] = $this->normalizeImportHeader((string) $headerValue);
        }

        $rows = [];
        foreach ($grid as $rowNumber => $cells) {
            if ($rowNumber === 1) {
                continue;
            }

            $assoc = [];
            foreach ($headers as $col => $headerName) {
                if ($headerName === '') {
                    continue;
                }
                $assoc[$headerName] = isset($cells[$col]) ? trim((string) $cells[$col]) : '';
            }
            $rows[] = $assoc;
        }

        return $rows;
    }

    private function columnLettersToIndex(string $letters): int
    {
        $letters = strtoupper($letters);
        $length = strlen($letters);
        $index = 0;
        for ($i = 0; $i < $length; $i++) {
            $index = ($index * 26) + (ord($letters[$i]) - 64);
        }

        return max(1, $index);
    }

    private function normalizeImportHeader(string $header): string
    {
        $normalized = Str::of($header)->lower()->replace([' ', '-', '.'], '_')->value();
        $normalized = preg_replace('/[^a-z0-9_]/', '', $normalized) ?? '';

        return match ($normalized) {
            'program_studi', 'prodi' => 'jurusan_code',
            'jurusanid' => 'jurusan_id',
            default => $normalized,
        };
    }

    private function normalizeImportRole(string $role): ?string
    {
        $normalized = Str::lower(trim($role));

        return match ($normalized) {
            'admin', 'finance', 'teacher', 'student' => $normalized,
            'dosen' => 'teacher',
            'mahasiswa' => 'student',
            default => null,
        };
    }

    private function isImportRowEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function createAutoInvoiceForApprovedStudent(User $user): bool
    {
        if ($user->role !== 'student' || !Schema::hasTable('invoices')) {
            return false;
        }

        if (!$this->isFinanceAutoInvoiceEnabled()) {
            return false;
        }

        $periodLabel = $this->currentAcademicPeriodLabel();
        $title = 'Tagihan UKT Semester ' . $periodLabel;

        $alreadyExists = Invoice::query()
            ->where('student_id', $user->id)
            ->where('title', $title)
            ->exists();

        if ($alreadyExists) {
            return false;
        }

        $amount = $this->resolveAutoSemesterAmount();
        $dueDays = $this->resolveFinanceDefaultDueDays();
        $financeUserId = (int) (User::query()->where('role', 'finance')->orderBy('id')->value('id') ?? 0);
        $feeComponentId = $this->resolveAutoFeeComponentId($amount);

        Invoice::create([
            'invoice_no' => $this->generateAutoInvoiceNumber(),
            'student_id' => $user->id,
            'fee_component_id' => $feeComponentId,
            'title' => $title,
            'description' => 'Tagihan dibuat otomatis setelah akun mahasiswa disetujui admin universitas.',
            'amount' => $amount,
            'due_date' => now()->addDays($dueDays)->toDateString(),
            'status' => 'unpaid',
            'created_by' => $financeUserId > 0 ? $financeUserId : null,
        ]);

        if ($this->shouldNotifyFinanceOnNewRegistration() && $financeUserId > 0) {
            app(NotificationService::class)->notify(
                $financeUserId,
                'finance',
                'Mahasiswa Baru Disetujui',
                "Mahasiswa {$user->name} telah disetujui dan tagihan otomatis dibuat.",
                '/finance-invoices',
                [
                    'student_id' => $user->id,
                    'student_code' => $user->code,
                ],
                $financeUserId
            );
        }

        Cache::forget('dashboard:finance');

        return true;
    }

    private function wouldCreateAutoInvoiceForStudent(User $user): bool
    {
        if ($user->role !== 'student' || !Schema::hasTable('invoices')) {
            return false;
        }

        if (!$this->isFinanceAutoInvoiceEnabled()) {
            return false;
        }

        $title = 'Tagihan UKT Semester ' . $this->currentAcademicPeriodLabel();

        return !Invoice::query()
            ->where('student_id', $user->id)
            ->where('title', $title)
            ->exists();
    }

    private function isFinanceAutoInvoiceEnabled(): bool
    {
        return $this->resolveFinanceSettingValue('auto_invoice_enabled', '1') === '1';
    }

    private function resolveAutoSemesterAmount(): int
    {
        $value = (int) $this->resolveFinanceSettingValue('nominal_spp', '3600000');
        return $value > 0 ? $value : 3600000;
    }

    private function resolveFinanceDefaultDueDays(): int
    {
        $value = (int) $this->resolveFinanceSettingValue('default_due_days', '14');
        return $value > 0 ? $value : 14;
    }

    private function resolveFinanceSettingValue(string $key, string $default): string
    {
        if (!Schema::hasTable('system_settings')) {
            return $default;
        }

        $financeId = (int) (User::query()->where('role', 'finance')->orderBy('id')->value('id') ?? 0);
        if ($financeId <= 0) {
            return $default;
        }

        $value = SystemSetting::query()
            ->where('key', 'finance_' . $financeId . '_' . $key)
            ->value('value');

        return $value !== null ? (string) $value : $default;
    }

    private function shouldNotifyFinanceOnNewRegistration(): bool
    {
        return $this->resolveFinanceSettingValue('notify_on_new_registration', '1') === '1';
    }

    private function resolveAutoFeeComponentId(int $amount): ?int
    {
        if (!Schema::hasTable('fee_components')) {
            return null;
        }

        $component = FeeComponent::query()
            ->where('is_active', true)
            ->where('type', 'recurring')
            ->whereIn('code', ['UKT-SEM', 'SPP-SEM', 'SPP'])
            ->orderBy('id')
            ->first();

        if ($component) {
            return (int) $component->id;
        }

        $component = FeeComponent::firstOrCreate(
            ['code' => 'UKT-SEM'],
            [
                'name' => 'UKT Semester',
                'amount' => $amount,
                'type' => 'recurring',
                'is_active' => true,
            ]
        );

        return (int) $component->id;
    }

    private function generateAutoInvoiceNumber(): string
    {
        do {
            $number = 'INV-AUTO-' . now()->format('YmdHis') . '-' . strtoupper(Str::random(4));
        } while (Invoice::query()->where('invoice_no', $number)->exists());

        return $number;
    }

    private function currentAcademicPeriodLabel(): string
    {
        $month = (int) now()->format('n');
        $year = (int) now()->format('Y');
        $isOddSemester = $month >= 8 || $month <= 1;
        $period = $isOddSemester ? 'Ganjil' : 'Genap';

        if ($month >= 8) {
            $startYear = $year;
            $endYear = $year + 1;
        } else {
            $startYear = $year - 1;
            $endYear = $year;
        }

        return $period . ' ' . $startYear . '/' . $endYear;
    }

    private function shouldSendAdminUserEmailNotification(?int $adminId): bool
    {
        if (!$adminId || $adminId <= 0) {
            return false;
        }

        $settings = $this->getSettings($adminId);
        return (bool) ($settings['enable_user_email_notification'] ?? false);
    }

    private function mockLecturers(): array
    {
        return [
            ['id' => 8001, 'name' => 'Dr. Maya Dewi', 'code' => 'NIDN202405', 'is_mock' => true],
            ['id' => 8002, 'name' => 'Prof. Eko Prasetyo', 'code' => 'NIDN202406', 'is_mock' => true],
        ];
    }

    private function mockJurusans(): array
    {
        return [
            [
                'id' => 7001,
                'name' => 'Informatika',
                'fakultas_id' => 6001,
                'fakultas' => ['id' => 6001, 'name' => 'Teknik', 'code' => 'FT'],
                'is_mock' => true,
            ],
            [
                'id' => 7002,
                'name' => 'Sistem Informasi',
                'fakultas_id' => 6001,
                'fakultas' => ['id' => 6001, 'name' => 'Teknik', 'code' => 'FT'],
                'is_mock' => true,
            ],
        ];
    }

    private function mockCourses(array $lecturers, array $jurusans): array
    {
        $lecturer = $lecturers[0] ?? ['id' => 8001, 'name' => 'Dr. Maya Dewi', 'code' => 'NIDN202405'];
        $jurusan = $jurusans[0] ?? ['id' => 7001, 'name' => 'Informatika', 'fakultas_id' => 6001, 'fakultas' => ['name' => 'Teknik']];

        return [
            [
                'id' => 9001,
                'title' => 'Pemrograman Web Modern',
                'code' => 'WEB-301',
                'description' => 'Stack modern dan praktik deployment.',
                'category' => 'Teknologi',
                'tags' => ['react', 'laravel', 'api'],
                'jurusan_id' => $jurusan['id'],
                'jurusan' => $jurusan,
                'lecturer_id' => $lecturer['id'],
                'lecturer' => $lecturer,
                'level' => 'menengah',
                'semester' => 4,
                'credit_hours' => 3,
                'status' => 'active',
                'materials' => [
                    ['id' => 9901, 'title' => 'Silabus', 'file_name' => 'silabus.pdf', 'file_size' => 420000, 'created_at' => now()->subDays(4)->toISOString(), 'is_mock' => true],
                    ['id' => 9902, 'title' => 'Starter Kit', 'file_name' => 'starter.zip', 'file_size' => 840000, 'created_at' => now()->subDays(2)->toISOString(), 'is_mock' => true],
                ],
                'is_mock' => true,
            ],
            [
                'id' => 9002,
                'title' => 'Analitik Data Bisnis',
                'code' => 'DATA-210',
                'description' => 'Dashboarding dan insight bisnis.',
                'category' => 'Data',
                'tags' => ['sql', 'analytics'],
                'jurusan_id' => $jurusan['id'],
                'jurusan' => $jurusan,
                'lecturer_id' => $lecturer['id'],
                'lecturer' => $lecturer,
                'level' => 'dasar',
                'semester' => 2,
                'credit_hours' => 2,
                'status' => 'draft',
                'materials' => [],
                'is_mock' => true,
            ],
        ];
    }

    private function mockUsers(): array
    {
        return [
            [
                'id' => 5101,
                'name' => 'Nanda Pratama',
                'email' => 'nanda.pratama@mail.id',
                'username' => 'nanda.pratama',
                'role' => 'admin',
                'type' => 'nidn',
                'code' => 'NIDN202450',
                'email_verified_at' => now()->subDays(10)->toISOString(),
                'created_at' => now()->subDays(12)->toISOString(),
                'is_mock' => true,
            ],
            [
                'id' => 5102,
                'name' => 'Lia Kartika',
                'email' => 'lia.kartika@mail.id',
                'username' => 'lia.kartika',
                'role' => 'student',
                'type' => 'nim',
                'code' => 'NIM2024501',
                'email_verified_at' => null,
                'created_at' => now()->subDays(2)->toISOString(),
                'is_mock' => true,
            ],
        ];
    }

    private function mockPendingUsers(): array
    {
        return [
            [
                'id' => 5201,
                'name' => 'Dito Arjuna',
                'email' => 'dito.arjuna@mail.id',
                'username' => 'dito.arjuna',
                'role' => 'student',
                'code' => 'NIM2024021',
                'created_at' => now()->subDays(1)->toISOString(),
                'is_mock' => true,
            ],
        ];
    }

    private function mockFakultas(): array
    {
        return [
            [
                'id' => 6001,
                'name' => 'Teknik',
                'code' => 'FT',
                'slug' => 'teknik',
                'jurusans' => [
                    ['id' => 7001, 'fakultas_id' => 6001, 'name' => 'Informatika', 'code' => 'IF', 'slug' => 'informatika', 'is_mock' => true],
                    ['id' => 7002, 'fakultas_id' => 6001, 'name' => 'Sistem Informasi', 'code' => 'SI', 'slug' => 'sistem-informasi', 'is_mock' => true],
                ],
                'is_mock' => true,
            ],
            [
                'id' => 6002,
                'name' => 'Ekonomi',
                'code' => 'FE',
                'slug' => 'ekonomi',
                'jurusans' => [
                    ['id' => 7003, 'fakultas_id' => 6002, 'name' => 'Manajemen', 'code' => 'MNJ', 'slug' => 'manajemen', 'is_mock' => true],
                ],
                'is_mock' => true,
            ],
        ];
    }
}
