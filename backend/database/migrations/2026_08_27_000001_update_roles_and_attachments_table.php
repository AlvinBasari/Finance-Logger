<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Change role column in users table to varchar(50)
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 50)->default('loger')->change();
        });

        // 2. Change source column in invoice_attachments table to varchar(50)
        Schema::table('invoice_attachments', function (Blueprint $table) {
            $table->string('source', 50)->default('scanner_flatbed')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'logger', 'supervisor', 'warehouse'])->default('logger')->change();
        });

        Schema::table('invoice_attachments', function (Blueprint $table) {
            $table->enum('source', ['scanner_flatbed', 'manual_upload'])->default('scanner_flatbed')->change();
        });
    }
};
