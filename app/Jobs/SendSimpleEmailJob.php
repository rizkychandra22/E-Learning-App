<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendSimpleEmailJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $toEmail,
        public string $subject,
        public string $body
    ) {
    }

    public function handle(): void
    {
        try {
            Mail::raw($this->body, function ($message): void {
                $message->to($this->toEmail)->subject($this->subject);
            });
        } catch (\Throwable $exception) {
            Log::warning('Email notification failed', [
                'to' => $this->toEmail,
                'subject' => $this->subject,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
