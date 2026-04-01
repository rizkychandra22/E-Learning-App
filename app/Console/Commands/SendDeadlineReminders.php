<?php

namespace App\Console\Commands;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Invoice;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class SendDeadlineReminders extends Command
{
    protected $signature = 'notifications:send-reminders {--dry-run : Show targets without writing notifications}';

    protected $description = 'Send assignment and invoice deadline reminders via in-app notification and queued email.';

    public function __construct(
        private readonly NotificationService $notificationService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $assignmentCount = $this->sendAssignmentReminders((bool) $this->option('dry-run'));
        $invoiceCount = $this->sendInvoiceReminders((bool) $this->option('dry-run'));

        $this->info("Reminder processed. assignments={$assignmentCount}, invoices={$invoiceCount}");

        return self::SUCCESS;
    }

    private function sendAssignmentReminders(bool $dryRun): int
    {
        if (!Schema::hasTable('assignments') || !Schema::hasTable('course_student')) {
            return 0;
        }

        $now = now();
        $deadline = $now->copy()->addDay();
        $sent = 0;

        $assignments = Assignment::query()
            ->where('status', 'active')
            ->whereNotNull('due_at')
            ->whereBetween('due_at', [$now, $deadline])
            ->with(['course.students:id,name,email,email_verified_at', 'lecturer:id'])
            ->get();

        foreach ($assignments as $assignment) {
            if (!$assignment->course) {
                continue;
            }

            foreach ($assignment->course->students as $student) {
                $alreadySubmitted = Schema::hasTable('assignment_submissions')
                    ? AssignmentSubmission::query()
                        ->where('assignment_id', $assignment->id)
                        ->where('student_id', $student->id)
                        ->whereIn('status', ['submitted', 'graded'])
                        ->exists()
                    : false;

                if ($alreadySubmitted) {
                    continue;
                }

                $reminderKey = 'assignment:' . $assignment->id . ':' . $student->id . ':' . $assignment->due_at?->format('YmdHi');
                if ($this->notificationService->hasReminderBeenSent((int) $student->id, $reminderKey)) {
                    continue;
                }

                $title = 'Pengingat Deadline Tugas';
                $message = "Tugas '{$assignment->title}' akan berakhir pada {$assignment->due_at?->format('d M Y H:i')}.";

                if (!$dryRun) {
                    $this->notificationService->notify(
                        (int) $student->id,
                        'reminder',
                        $title,
                        $message,
                        '/assignments/' . $assignment->id,
                        [
                            'reminder_key' => $reminderKey,
                            'target' => 'assignment',
                            'assignment_id' => $assignment->id,
                            'course_id' => $assignment->course_id,
                        ],
                        $assignment->lecturer_id
                    );

                    $this->notificationService->sendSimpleEmail(
                        $student->email,
                        $title . ': ' . $assignment->title,
                        "Halo {$student->name},\n\n{$message}\nSilakan login untuk mengumpulkan tugas.\n"
                    );
                }

                $sent++;
            }
        }

        return $sent;
    }

    private function sendInvoiceReminders(bool $dryRun): int
    {
        if (!Schema::hasTable('invoices')) {
            return 0;
        }

        $today = now()->startOfDay();
        $nearDue = $today->copy()->addDays(3);
        $sent = 0;

        $invoices = Invoice::query()
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->whereDate('due_date', '<=', $nearDue->toDateString())
            ->with('student:id,name,email,email_verified_at')
            ->get();

        foreach ($invoices as $invoice) {
            $student = $invoice->student;
            if (!$student instanceof User) {
                continue;
            }

            $reminderKey = 'invoice:' . $invoice->id . ':' . $invoice->due_date;
            if ($this->notificationService->hasReminderBeenSent((int) $student->id, $reminderKey)) {
                continue;
            }

            $isOverdue = $invoice->due_date && now()->toDateString() > $invoice->due_date;
            $title = $isOverdue ? 'Pengingat Tagihan Terlambat' : 'Pengingat Deadline Tagihan';
            $message = $isOverdue
                ? "Tagihan '{$invoice->title}' telah melewati jatuh tempo ({$invoice->due_date})."
                : "Tagihan '{$invoice->title}' jatuh tempo pada {$invoice->due_date}.";

            if (!$dryRun) {
                $this->notificationService->notify(
                    (int) $student->id,
                    'reminder',
                    $title,
                    $message,
                    '/notifications',
                    [
                        'reminder_key' => $reminderKey,
                        'target' => 'invoice',
                        'invoice_id' => $invoice->id,
                        'invoice_no' => $invoice->invoice_no,
                    ],
                    $invoice->created_by
                );

                $this->notificationService->sendSimpleEmail(
                    $student->email,
                    $title . ': ' . $invoice->invoice_no,
                    "Halo {$student->name},\n\n{$message}\nSegera lakukan pembayaran untuk menghindari keterlambatan.\n"
                );
            }

            $sent++;
        }

        return $sent;
    }
}
