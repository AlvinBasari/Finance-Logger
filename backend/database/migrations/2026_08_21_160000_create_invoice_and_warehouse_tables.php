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
        // 1. Warehouse Boxes Table
        Schema::create('warehouse_boxes', function (Blueprint $table) {
            $table->id();
            $table->string('box_number', 100)->unique();
            $table->text('description')->nullable();
            $table->string('rack_location', 100)->nullable();
            $table->enum('status', ['open', 'sealed', 'in_transit', 'stored'])->default('open');
            $table->timestamp('sealed_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('box_number');
        });

        // 2. Invoices Table
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_code', 100)->unique();
            $table->string('vendor_name', 255);
            $table->string('sender_division', 255)->nullable();
            $table->unsignedInteger('document_count')->default(1);
            $table->date('received_date')->nullable();

            // Financial & Document Details (Stage 3)
            $table->string('invoice_number', 150)->nullable();
            $table->date('invoice_date')->nullable();
            $table->date('due_date')->nullable();
            $table->string('currency', 10)->default('IDR');
            $table->decimal('subtotal', 15, 2)->default(0.00);
            $table->decimal('tax_ppn', 15, 2)->default(0.00);
            $table->decimal('tax_pph', 15, 2)->default(0.00);
            $table->decimal('total_amount', 15, 2)->default(0.00);

            // 6-Stage Workflow Status
            $table->enum('status', [
                'received',
                'verified',
                'data_inputted',
                'scanned',
                'reconciled',
                'boxed',
                'archived'
            ])->default('received');

            // Verification Details (Stage 2)
            $table->json('verification_checklist')->nullable();
            $table->enum('verification_status', ['complete', 'incomplete', 'rejected'])->nullable();
            $table->text('verification_notes')->nullable();

            // Reconciliation Details (Stage 5)
            $table->text('reconciliation_notes')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reconciled_by')->nullable()->constrained('users')->nullOnDelete();

            // Box / Warehouse Association (Stage 6)
            $table->foreignId('box_id')->nullable()->constrained('warehouse_boxes')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status', 'idx_invoice_status');
            $table->index('vendor_name', 'idx_invoice_vendor');
            $table->index('invoice_number', 'idx_invoice_number');
        });

        // 3. Invoice Attachments (Digital Scans & Supporting Files)
        Schema::create('invoice_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('file_path', 500);
            $table->string('file_name', 255);
            $table->string('file_type', 100);
            $table->unsignedInteger('file_size_kb')->default(0);
            $table->unsignedInteger('page_count')->default(1);
            $table->enum('source', ['scanner_flatbed', 'manual_upload'])->default('scanner_flatbed');
            $table->timestamps();
        });

        // 4. Audit Log Activity
        Schema::create('invoice_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100);
            $table->text('description')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_activity_logs');
        Schema::dropIfExists('invoice_attachments');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('warehouse_boxes');
    }
};
