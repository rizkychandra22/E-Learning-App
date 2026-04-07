<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_materials', function (Blueprint $table) {
            if (!Schema::hasColumn('course_materials', 'meeting_number')) {
                $table->unsignedSmallInteger('meeting_number')->nullable()->after('title');
            }
        });
    }

    public function down(): void
    {
        Schema::table('course_materials', function (Blueprint $table) {
            if (Schema::hasColumn('course_materials', 'meeting_number')) {
                $table->dropColumn('meeting_number');
            }
        });
    }
};

