import { useMemo } from 'react';
import { Award, BarChart3, CalendarDays, TrendingUp } from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { InteractiveTrendChart } from '@/components/InteractiveTrendChart';

const UI = {
    panel: 'panel-card p-4',
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

    const gradeTrendData = useMemo(() => {
        if (!records.length) return [];
        return records
            .slice()
            .sort((a, b) => {
                const aTime = a?.graded_at ? new Date(a.graded_at).getTime() : 0;
                const bTime = b?.graded_at ? new Date(b.graded_at).getTime() : 0;
                return aTime - bTime;
            })
            .slice(-8)
            .map((item, index) => {
                const score = Number(item?.score) || 0;
                const maxScore = Number(item?.max_score) || 0;
                const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;
                const labelDate = item?.graded_at
                    ? new Date(item.graded_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                    : `Sesi ${index + 1}`;
                return {
                    label: labelDate,
                    value: Number(percent.toFixed(1)),
                };
            });
    }, [records]);

    const gradeTypeDistribution = useMemo(() => {
        if (!records.length) return [];
        const grouped = records.reduce((acc, item) => {
            const rawType = String(item?.type ?? 'lainnya').toLowerCase();
            const type = rawType === 'assignment' ? 'Assignment' : rawType === 'quiz' ? 'Quiz' : 'Lainnya';
            acc[type] = (acc[type] ?? 0) + 1;
            return acc;
        }, {});
        return Object.entries(grouped).map(([label, value]) => ({ label, value }));
    }, [records]);

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

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <InteractiveTrendChart
                        title="Tren Nilai Terbaru"
                        data={gradeTrendData}
                        tone="primary"
                        chartType="line"
                        valueFormatter={(value) => `${new Intl.NumberFormat(intlLocale).format(value)}%`}
                    />
                    <InteractiveTrendChart
                        title="Komposisi Jenis Penilaian"
                        data={gradeTypeDistribution}
                        tone="accent"
                        chartType="donut"
                        showTrend={false}
                        valueFormatter={(value) => `${new Intl.NumberFormat(intlLocale).format(value)} item`}
                    />
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
                            <div className="panel-subcard p-3 text-sm text-muted-foreground">
                                Belum ada nilai yang dipublikasikan.
                            </div>
                        )}
                        {records.map((item, index) => (
                            <div key={`${item.type}-${item.title}-${index}`} className="flex items-center justify-between panel-subcard p-3 text-sm">
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
