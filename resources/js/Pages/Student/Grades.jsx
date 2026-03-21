import { useMemo } from 'react';
import { Award, BarChart3, CalendarDays, TrendingUp } from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'rounded-2xl border border-border bg-card p-4 shadow-card',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

function ScoreCard({ label, value, helper }) {
    return (
        <div className={cn(UI.panel, 'space-y-1')}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
            {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
        </div>
    );
}

export default function StudentGrades() {
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

    const records = props?.records ?? [];
    const summary = props?.summary ?? { average: 0, graded_count: 0, assignment_avg: 0, quiz_avg: 0 };
    const migrationRequired = props?.migrationRequired;

    return (
        <ProtectedLayout>
            <Head title="Nilai" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Nilai"
                    description="Pantau hasil penilaian quiz dan assignment dari semua kursus yang Anda ikuti."
                />

                {migrationRequired && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Tabel penilaian belum tersedia. Jalankan <code className="font-mono">php artisan migrate</code>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <Award className="w-3.5 h-3.5" />
                            {summary.graded_count} penilaian selesai
                        </span>
                        <span className={UI.chip}>
                            <TrendingUp className="w-3.5 h-3.5" />
                            Rata-rata {summary.average}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ScoreCard label="Rata-rata total" value={summary.average} helper="Gabungan assignment + quiz" />
                    <ScoreCard label="Rata-rata assignment" value={summary.assignment_avg} helper="Skor dari tugas yang sudah dinilai" />
                    <ScoreCard label="Rata-rata quiz" value={summary.quiz_avg} helper="Skor dari kuis yang sudah dinilai" />
                </div>

                <div className={UI.panel}>
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Riwayat Penilaian
                        </h3>
                    </div>
                    <div className="mt-4 space-y-3">
                        {records.length === 0 && (
                            <div className="rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">
                                Belum ada nilai yang dipublikasikan.
                            </div>
                        )}
                        {records.map((item, index) => (
                            <div key={`${item.type}-${item.title}-${index}`} className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-sm">
                                <div>
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">{item?.course?.title ?? 'Tanpa kursus'} - {item.type}</p>
                                    <p className="text-xs text-muted-foreground">Dinilai: {item.graded_at ? new Date(item.graded_at).toLocaleString('id-ID') : '-'}</p>
                                    {item.feedback && <p className="text-xs text-muted-foreground">Feedback: {item.feedback}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{item.score} / {item.max_score}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
