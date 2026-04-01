<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('in_app_notifications', function (Blueprint $table) {
            $table->enum('status', ['unread', 'read'])->default('unread')->after('data');
        });

        DB::table('in_app_notifications')
            ->whereNotNull('read_at')
            ->update(['status' => 'read']);
    }

    public function down(): void
    {
        Schema::table('in_app_notifications', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
