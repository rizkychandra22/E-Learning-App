import { useMemo } from 'react';
import { BookOpen, CalendarDays, Download, FileText, Filter, FolderOpen } from 'lucide-react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'panel-card p-4',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

function MaterialCard({ title, course, type, size, updated, tone }) {
    const toneStyle = {
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
    };

    return (
        <div className={cn(UI.panel, 'flex items-start gap-4')}>
            <div className={cn('rounded-xl p-2.5', toneStyle[tone] ?? toneStyle.primary)}>
                <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold truncate">{title}</p>
                        <p className="text-xs text-muted-foreground">{course}</p>
                    </div>
                    <span className={UI.chip}>{type}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className={UI.chip}>{size}</span>
                    <span className={UI.chip}>Update {updated}</span>
                </div>
                <div className="mt-3">
                    <Link href="/materials" className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        Download Materi
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function StudentMaterials() {
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

    const materials = [
        { title: 'Modul 4: Normalisasi', course: 'Basis Data Lanjut', type: 'PDF', size: '4.2 MB', updated: '2 hari lalu', tone: 'primary' },
        { title: 'Slide Sorting & Searching', course: 'Algoritma & Struktur Data', type: 'PPT', size: '8.1 MB', updated: '3 hari lalu', tone: 'success' },
        { title: 'Ringkasan REST API', course: 'Pemrograman Web', type: 'PDF', size: '2.8 MB', updated: '5 hari lalu', tone: 'warning' },
        { title: 'Video Query Optimization', course: 'Basis Data Lanjut', type: 'MP4', size: '320 MB', updated: '1 minggu lalu', tone: 'primary' },
    ];

    return (
        <ProtectedLayout>
            <Head title="Materi" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Materi"
                    description="Koleksi materi terbaru dari semua mata kuliah aktif."
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <BookOpen className="w-3.5 h-3.5" />
                            12 materi aktif
                        </span>
                        <span className={UI.chip}>
                            <FolderOpen className="w-3.5 h-3.5" />
                            3 mata kuliah
                        </span>
                    </div>
                    <button type="button" className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" />
                        Filter Materi
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {materials.map((material) => (
                        <MaterialCard key={material.title} {...material} />
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}


