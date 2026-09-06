<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentLoanController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\WarehouseBoxController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes for Finance Invoice Logger & Archiving System
|--------------------------------------------------------------------------
*/

// Public Authentication
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

// Protected Endpoints (Sanctum Token required)
Route::middleware('auth:sanctum')->group(function () {
    // User / Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Dashboard & Duplicate check
    Route::get('/dashboard/stats', [InvoiceController::class, 'dashboardStats']);
    Route::get('/invoices/check-duplicate', [InvoiceController::class, 'checkDuplicate']);

    // Invoices 6-Stage Pipeline
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']); // Stage 1 (Receipt)
    Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
    Route::put('/invoices/{id}/verify', [InvoiceController::class, 'verify']); // Stage 2 (Verification)
    Route::put('/invoices/{id}/financials', [InvoiceController::class, 'updateFinancials']); // Stage 3 (Financials)
    Route::post('/invoices/upload-scan', [InvoiceController::class, 'uploadScan']); // Stage 4 (Scan Upload)
    Route::put('/invoices/{id}/finalize-softfile', [InvoiceController::class, 'finalizeSoftfile']); // Stage 4 (Finalize Soft File)
    Route::put('/invoices/{id}/reconcile', [InvoiceController::class, 'reconcile']); // Stage 5 (Reconciliation)

    // Warehouse & Boxing (Stage 6)
    Route::get('/boxes', [WarehouseBoxController::class, 'index']);
    Route::post('/boxes', [WarehouseBoxController::class, 'store']);
    Route::get('/boxes/{id}', [WarehouseBoxController::class, 'show']);
    Route::post('/boxes/{id}/add-invoice', [WarehouseBoxController::class, 'addInvoice']);
    Route::delete('/boxes/{id}/remove-invoice/{invoiceId}', [WarehouseBoxController::class, 'removeInvoice']);
    Route::put('/boxes/{id}/seal', [WarehouseBoxController::class, 'seal']);
    Route::put('/boxes/{id}/receive', [WarehouseBoxController::class, 'receive']);

    // Document Loans (Peminjaman Dokumen Arsip & Watermarking)
    Route::get('/loans', [DocumentLoanController::class, 'index']);
    Route::post('/loans', [DocumentLoanController::class, 'store']);
    Route::get('/loans/stats', [DocumentLoanController::class, 'stats']);
    Route::get('/loans/{id}', [DocumentLoanController::class, 'show']);
    Route::put('/loans/{id}/return', [DocumentLoanController::class, 'returnItems']);
    Route::post('/loans/{id}/send-reminder', [DocumentLoanController::class, 'sendReminder']);
});
