<?php

namespace App\Mail;

use App\Models\DocumentLoan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoanConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public DocumentLoan $loan)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[BAST Digital] Konfirmasi Peminjaman Dokumen Arsip - {$this->loan->loan_code}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.loan_confirmation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
