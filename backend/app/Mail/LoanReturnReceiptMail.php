<?php

namespace App\Mail;

use App\Models\DocumentLoan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoanReturnReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public DocumentLoan $loan)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[BUKTI PENGEMBALIAN] Dokumen Arsip Telah Diterima Kembali - {$this->loan->loan_code}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.loan_return_receipt',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
