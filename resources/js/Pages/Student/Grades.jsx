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

    const grades = [
        { course: 'Algoritma & Struktur Data', average: '88', last: '90', status: 'Naik' },
        { course: 'Basis Data Lanjut', average: '84', last: '82', status: 'Stabil' },
        { course: 'Pemrograman Web', average: '87', last: '89', status: 'Naik' },
        { course: 'Machine Learning', average: '79', last: '76', status: 'Perlu fokus' },
    ];

    return (
        <ProtectedLayout>
            <Head title="Nilai" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Nilai"
                    description="Pantau performa akademik, rata-rata nilai, dan tren belajar semester ini."
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <Award className="w-3.5 h-3.5" />
                            IPK sementara 3.62
                        </span>
                        <span className={UI.chip}>
                            <TrendingUp className="w-3.5 h-3.5" />
                            +0.12 dari semester lalu
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ScoreCard label="Rata-rata nilai" value="85.4" helper="Target semester: 87" />
                    <ScoreCard label="Kuis & tugas" value="88" helper="Konsisten 4 minggu" />
                    <ScoreCard label="Ujian tengah" value="82" helper="Butuh latihan 2 topik" />
                </div>

                <div className={UI.panel}>
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Rangkuman per Kursus
                        </h3>
                    </div>
                    <div className="mt-4 space-y-3">
                        {grades.map((item) => (
                            <div key={item.course} className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-sm">
                                <div>
                                    <p className="font-medium">{item.course}</p>
                                    <p className="text-xs text-muted-foreground">Nilai terakhir: {item.last}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{item.average}</p>
                                    <p className="text-xs text-muted-foreground">{item.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
