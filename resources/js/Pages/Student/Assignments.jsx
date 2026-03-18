import { useMemo } from 'react';
import { CalendarDays, ClipboardList, Clock, FileText, Flag, ListChecks } from 'lucide-react';
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

function AssignmentCard({ id, title, course, due, status, progress }) {
    const statusTone = {
        tinggi: 'text-destructive',
        sedang: 'text-warning',
        rendah: 'text-success',
    };

    return (
        <div className={cn(UI.panel, 'space-y-3')}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-muted-foreground">{course}</p>
                    <h3 className="font-semibold">{title}</h3>
                </div>
                <span className={UI.chip}>{progress}%</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className={UI.chip}>
                    <Clock className="w-3.5 h-3.5" />
                    {due}
                </span>
                <span className={cn(UI.chip, statusTone[status] ?? 'text-muted-foreground')}>
                    <Flag className="w-3.5 h-3.5" />
                    Prioritas {status}
                </span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex flex-wrap gap-2">
                <Link href="/materials" className="text-xs font-medium text-primary hover:opacity-80">
                    Buka Materi Pendukung
                </Link>
                <Link href={`/assignments/${id}`} className="text-xs font-medium text-muted-foreground hover:text-primary">
                    Lihat Detail
                </Link>
            </div>
        </div>
    );
}

export default function StudentAssignments() {
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

    const assignments = [
        { id: 1, title: 'Tugas 3: Normalisasi', course: 'Basis Data Lanjut', due: '2 hari lagi', status: 'tinggi', progress: 30 },
        { id: 2, title: 'Analisis Kompleksitas', course: 'Algoritma & Struktur Data', due: '4 hari lagi', status: 'sedang', progress: 55 },
        { id: 3, title: 'Landing Page Responsif', course: 'Pemrograman Web', due: '6 hari lagi', status: 'rendah', progress: 80 },
        { id: 4, title: 'Resume Video Pointer', course: 'Algoritma & Struktur Data', due: '1 minggu lagi', status: 'rendah', progress: 15 },
    ];

    return (
        <ProtectedLayout>
            <Head title="Tugas" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Tugas"
                    description="Kelola daftar tugas aktif, pantau progress, dan prioritas deadline."
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <ClipboardList className="w-3.5 h-3.5" />
                            4 tugas aktif
                        </span>
                        <span className={UI.chip}>
                            <ListChecks className="w-3.5 h-3.5" />
                            2 tugas mendekati deadline
                        </span>
                    </div>
                    <button type="button" className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Unduh daftar tugas
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {assignments.map((assignment) => (
                        <AssignmentCard key={assignment.title} {...assignment} />
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}

