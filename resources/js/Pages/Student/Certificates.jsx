import { useMemo } from 'react';
import { Award, CalendarDays, CheckCircle2, Download, Eye } from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const toneClass = {
    primary: 'gradient-primary',
    warm: 'gradient-warm',
    success: 'gradient-success',
    info: 'gradient-accent',
};

const barToneClass = {
    primary: 'bg-primary',
    success: 'bg-success',
    info: 'bg-info',
    warm: 'bg-warning',
};

function CertificateCard({ item }) {
    return (
        <article className="panel-card overflow-hidden p-0">
            <div className={cn('px-4 py-5 text-white relative', toneClass[item.tone] ?? toneClass.primary)}>
                <span className="absolute top-3 right-3 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">{item.code}</span>
                <div className="flex items-center justify-center mb-2"><Award className="w-6 h-6" /></div>
                <p className="text-center font-semibold">{item.course}</p>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <div>
                        <p className="text-muted-foreground">{item.instructor}</p>
                        <p className="text-muted-foreground mt-1 inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{item.date}</p>
                    </div>
                    <p className="font-semibold text-success">Nilai: {item.score}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm font-medium" disabled>
                        <Eye className="w-4 h-4" />Lihat
                    </button>
                    <button type="button" className="inline-flex items-center justify-center gap-1 rounded-lg gradient-primary px-3 py-2 text-sm font-semibold text-primary-foreground" disabled>
                        <Download className="w-4 h-4" />Unduh
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function StudentCertificates() {
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

    const certificates = props?.certificates ?? [];
    const inProgress = props?.in_progress ?? [];
    const migrationRequired = props?.migrationRequired ?? {};

    return (
        <ProtectedLayout>
            <Head title="Sertifikat" />
            <div className="space-y-6">
                <PageHeroBanner title="Sertifikat" description="Sertifikat hanya muncul dari mata kuliah yang benar-benar sudah Anda selesaikan." />

                {(migrationRequired?.learning || migrationRequired?.grades) && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Sebagian data sertifikat belum siap karena migrasi belum lengkap.
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        Sertifikat Diperoleh ({certificates.length})
                    </span>
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{today}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {certificates.map((item) => (
                        <CertificateCard key={item.id} item={item} />
                    ))}
                    {certificates.length === 0 && (
                        <div className="panel-card p-4 text-sm text-muted-foreground lg:col-span-2">Belum ada sertifikat yang diterbitkan.</div>
                    )}
                </div>

                <section className="panel-card p-4">
                    <h3 className="font-semibold">Mata Kuliah Dalam Progress</h3>
                    <div className="mt-4 space-y-3">
                        {inProgress.map((item) => (
                            <div key={item.course} className="panel-subcard p-3">
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="font-medium">{item.course}</span>
                                    <span className="font-semibold">{item.progress}%</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Selesaikan mata kuliah untuk mendapatkan sertifikat</p>
                                <div className="mt-2 h-2.5 rounded-full bg-secondary overflow-hidden">
                                    <div className={cn('h-full rounded-full', barToneClass[item.tone] ?? barToneClass.primary)} style={{ width: `${item.progress}%` }} />
                                </div>
                            </div>
                        ))}
                        {inProgress.length === 0 && (
                            <p className="text-sm text-muted-foreground">Semua mata kuliah sudah selesai atau belum ada enrollment.</p>
                        )}
                    </div>
                </section>
            </div>
        </ProtectedLayout>
    );
}
