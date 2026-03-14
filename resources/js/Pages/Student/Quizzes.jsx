import { useMemo } from 'react';
import { Award, CalendarDays, Clock, PlayCircle, Timer, Trophy } from 'lucide-react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'rounded-2xl border border-border bg-card p-4 shadow-card',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

function QuizCard({ title, course, status, time, score }) {
    const statusTone = {
        upcoming: 'bg-warning/10 text-warning',
        active: 'bg-primary/10 text-primary',
        done: 'bg-success/10 text-success',
    };

    return (
        <div className={cn(UI.panel, 'space-y-3')}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-muted-foreground">{course}</p>
                    <h3 className="font-semibold">{title}</h3>
                </div>
                <span className={cn(UI.chip, statusTone[status])}>{status.toUpperCase()}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className={UI.chip}>
                    <Clock className="w-3.5 h-3.5" />
                    {time}
                </span>
                {score && (
                    <span className={UI.chip}>
                        <Trophy className="w-3.5 h-3.5" />
                        Skor {score}
                    </span>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                <Link href="/quizzes" className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                    <PlayCircle className="w-3.5 h-3.5" />
                    Mulai
                </Link>
                <Link href="/materials" className="text-xs font-medium text-muted-foreground hover:text-primary">
                    Materi pendukung
                </Link>
            </div>
        </div>
    );
}

export default function StudentQuizzes() {
    const { user } = useAuth();
    const { props } = usePage();
    if (!user) return null;

    const intlLocale = toIntlLocale(props?.system?.default_language);
    const today = useMemo(
        () =>
            new Intl.DateTimeFormat(intlLocale, {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).format(new Date()),
        [intlLocale]
    );

    const quizzes = [
        { title: 'Kuis Mingguan 4', course: 'Pemrograman Web', status: 'upcoming', time: 'Besok 13:00 - 13:30' },
        { title: 'Kuis Pointer & Array', course: 'Algoritma & Struktur Data', status: 'active', time: 'Hari ini 19:00 - 19:20' },
        { title: 'Kuis Normalisasi', course: 'Basis Data Lanjut', status: 'done', time: '3 hari lalu', score: '86' },
        { title: 'Kuis HTTP Fundamentals', course: 'Pemrograman Web', status: 'done', time: '1 minggu lalu', score: '90' },
    ];

    return (
        <ProtectedLayout>
            <Head title="Kuis" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Kuis"
                    description="Ikuti kuis terjadwal, cek skor, dan siapkan diri sebelum ujian."
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <Award className="w-3.5 h-3.5" />
                            2 kuis aktif
                        </span>
                        <span className={UI.chip}>
                            <Timer className="w-3.5 h-3.5" />
                            1 kuis hari ini
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {quizzes.map((quiz) => (
                        <QuizCard key={`${quiz.title}-${quiz.time}`} {...quiz} />
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}
