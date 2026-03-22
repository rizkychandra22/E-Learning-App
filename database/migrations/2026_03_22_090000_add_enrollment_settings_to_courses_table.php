<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->boolean('allow_self_enrollment')->default(false)->after('status');
            $table->string('enrollment_key')->nullable()->after('allow_self_enrollment');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['allow_self_enrollment', 'enrollment_key']);
        });
    }
};
