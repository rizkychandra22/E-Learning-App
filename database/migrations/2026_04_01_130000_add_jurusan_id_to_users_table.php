<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('jurusan_id')
                ->nullable()
                ->after('code')
                ->constrained('jurusans')
                ->nullOnDelete();
        });

        if (!Schema::hasTable('jurusans')) {
            return;
        }

        $jurusanIds = DB::table('jurusans')
            ->pluck('id', 'code')
            ->mapWithKeys(fn ($id, $code) => [(string) $code => (int) $id])
            ->all();

        DB::table('users')
            ->select(['id', 'role', 'code'])
            ->whereIn('role', ['teacher', 'student'])
            ->orderBy('id')
            ->chunkById(200, function ($rows) use ($jurusanIds): void {
                foreach ($rows as $row) {
                    $code = (string) ($row->code ?? '');
                    if (strlen($code) < 10) {
                        continue;
                    }

                    $jurusanCode = substr($code, 8, 2);
                    $jurusanId = $jurusanIds[$jurusanCode] ?? null;
                    if (!$jurusanId) {
                        continue;
                    }

                    DB::table('users')
                        ->where('id', (int) $row->id)
                        ->update(['jurusan_id' => $jurusanId]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('jurusan_id');
        });
    }
};
