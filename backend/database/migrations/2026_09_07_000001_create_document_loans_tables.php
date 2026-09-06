<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Table for Document Loans Header
        Schema::create('document_loans', function (Blueprint $table) {
            $table->id();
            $table->string('loan_code', 100)->unique(); // e.g. LN-202609-0001
            $table->enum('borrower_type', ['external', 'internal'])->default('external');
            $table->string('borrower_name', 255);       // PIC Name
            $table->string('organization', 255);        // e.g. KAP PwC, KPP Pratama
            $table->string('contact_phone', 50);
            $table->string('contact_email', 150)->nullable();
            $table->text('purpose');                    // Purpose of loan
            $table->string('reference_letter_no', 150)->nullable(); // No. Surat Tugas / Permohonan
            $table->string('reference_doc_path', 500)->nullable();  // Uploaded surat permohonan file
            
            $table->date('loan_date');
            $table->date('expected_return_date');
            $table->date('actual_return_date')->nullable();
            
            $table->enum('loan_type', ['physical', 'digital'])->default('physical');
            $table->enum('status', ['active', 'returned', 'partial_returned', 'overdue'])->default('active');
            
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('last_reminder_sent_at')->nullable();
            $table->timestamps();

            $table->index('status', 'idx_loan_status');
            $table->index('loan_code', 'idx_loan_code');
            $table->index('organization', 'idx_loan_org');
            $table->index('expected_return_date', 'idx_loan_expected_return');
        });

        // 2. Table for Document Loan Items (Invoices)
        Schema::create('document_loan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('document_loans')->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('original_box_id')->nullable()->constrained('warehouse_boxes')->nullOnDelete();
            
            $table->enum('status', ['borrowed', 'returned', 'damaged', 'lost'])->default('borrowed');
            $table->timestamp('returned_at')->nullable();
            $table->text('return_condition_notes')->nullable();
            $table->foreignId('checked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['loan_id', 'invoice_id']);
        });

        // 3. Add active_loan_id column to invoices table
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('active_loan_id')->nullable()->after('box_id')->constrained('document_loans')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['active_loan_id']);
            $table->dropColumn('active_loan_id');
        });

        Schema::dropIfExists('document_loan_items');
        Schema::dropIfExists('document_loans');
    }
};
