<?php

namespace App\Services;

use App\Models\InAppNotification;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class NotificationService
{
    public function canUseNotifications(): bool
    {
        return Schema::hasTable('in_app_notifications');
    }

    public function notify(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $url = null,
        array $data = [],
        ?int $createdBy = null
    ): void {
        if (!$this->canUseNotifications()) {
            return;
        }

        InAppNotification::create([
            'user_id' => $userId,
            'created_by' => $createdBy,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'url' => $url,
            'data' => $data === [] ? null : $data,
            'read_at' => null,
        ]);
    }

    public function notifyMany(
        array $userIds,
        string $type,
        string $title,
        string $message,
        ?string $url = null,
        array $data = [],
        ?int $createdBy = null
    ): void {
        foreach (collect($userIds)->filter()->unique() as $userId) {
            $this->notify((int) $userId, $type, $title, $message, $url, $data, $createdBy);
        }
    }

    public function getUserNotifications(int $userId, int $limit = 10): Collection
    {
        if (!$this->canUseNotifications()) {
            return collect();
        }

        return InAppNotification::query()
            ->where('user_id', $userId)
            ->latest('id')
            ->limit($limit)
            ->get();
    }

    public function getUnreadCount(int $userId): int
    {
        if (!$this->canUseNotifications()) {
            return 0;
        }

        return InAppNotification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    public function sendSimpleEmail(?string $toEmail, string $subject, string $body): void
    {
        if (!$toEmail) {
            return;
        }

        try {
            Mail::raw($body, function ($message) use ($toEmail, $subject) {
                $message->to($toEmail)->subject($subject);
            });
        } catch (\Throwable $exception) {
            Log::warning('Email notification failed', [
                'to' => $toEmail,
                'subject' => $subject,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function notifyEnrollment(User $student, User $lecturer, string $courseTitle, int $actorId, bool $selfEnroll = false): void
    {
        $studentTitle = $selfEnroll ? 'Enrollment berhasil' : 'Anda ditambahkan ke kursus';
        $studentMessage = $selfEnroll
            ? "Anda berhasil mendaftar ke kursus {$courseTitle}."
            : "Anda ditambahkan ke kursus {$courseTitle} oleh dosen.";

        $this->notify(
            (int) $student->id,
            'enrollment',
            $studentTitle,
            $studentMessage,
            '/my-courses',
            ['course_title' => $courseTitle],
            $actorId
        );

        $this->notify(
            (int) $lecturer->id,
            'enrollment',
            'Mahasiswa terdaftar',
            "{$student->name} terdaftar di kursus {$courseTitle}.",
            '/students',
            ['student_id' => $student->id, 'course_title' => $courseTitle],
            $actorId
        );

        $this->sendSimpleEmail(
            $student->email,
            "Enrollment Kursus: {$courseTitle}",
            "Halo {$student->name},\n\nAnda berhasil terdaftar di kursus {$courseTitle}.\nSilakan login untuk mulai belajar."
        );
    }
}
