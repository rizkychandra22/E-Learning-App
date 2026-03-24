import { AlertCircle, CalendarDays, CheckCircle2, ClipboardList, Clock, MessageSquare, Send } from 'lucide-react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'panel-card p-4',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

function SectionTitle({ icon: Icon, children }) {
    return (
        <h3 className="font-semibold flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            <span>{children}</span>
        </h3>
    );
}

export default function AssignmentDetail() {
    const { user } = useAuth();
    const { props } = usePage();
    if (!user) return null;

    const assignment = props?.assignment;
    const migrationRequired = props?.migrationRequired?.submissions;

    const form = useForm({
        submission_text: assignment?.submission?.submission_text ?? '',
        attachment_url: assignment?.submission?.attachment_url ?? '',
    });

    if (!assignment) {
        return (
            <ProtectedLayout>
                <Head title="Detail Tugas" />
                <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">Data tugas tidak ditemukan.</div>
            </ProtectedLayout>
        );
    }

    const dueAt = assignment?.due_at ? new Date(assignment.due_at) : null;
    const submissionStatus = assignment?.submission?.status ?? 'belum dikumpulkan';

    const submitAssignment = (event) => {
        event.preventDefault();
        form.post(`/assignments/${assignment.id}/submit`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Detail Tugas" />
            <div className="space-y-6">
                <PageHeroBanner
                    title={assignment.title}
                    description={`Kursus: ${assignment?.course?.title ?? 'Tanpa kursus'}`}
                />

                {migrationRequired && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Tabel submission belum tersedia. Jalankan <code className="font-mono">php artisan migrate</code>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {dueAt ? dueAt.toLocaleString('id-ID') : 'Tanpa deadline'}
                        </span>
                        <span className={UI.chip}>
                            <Clock className="w-3.5 h-3.5" />
                            {assignment.max_score ?? 100} poin
                        </span>
                        <span className={cn(UI.chip, submissionStatus === 'graded' ? 'text-success' : submissionStatus === 'submitted' ? 'text-primary' : 'text-muted-foreground')}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {submissionStatus}
                        </span>
                    </div>
                    <Link href="/assignments" className="text-xs font-medium text-muted-foreground hover:text-primary">
                        Kembali ke daftar tugas
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className={UI.panel}>
                            <SectionTitle icon={ClipboardList}>Deskripsi Tugas</SectionTitle>
                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                {assignment.description ?? 'Tidak ada deskripsi tambahan.'}
                            </p>
                        </div>

                        <div className={UI.panel}>
                            <SectionTitle icon={MessageSquare}>Kirim Jawaban</SectionTitle>
                            <form onSubmit={submitAssignment} className="mt-4 space-y-3">
                                <label className="block">
                                    <span className="text-sm font-medium">Jawaban</span>
                                    <textarea
                                        rows={6}
                                        value={form.data.submission_text}
                                        onChange={(event) => form.setData('submission_text', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder="Tuliskan jawaban atau ringkasan hasil tugas Anda..."
                                    />
                                    {form.errors.submission_text && <span className="mt-1 block text-xs text-destructive">{form.errors.submission_text}</span>}
                                </label>

                                <label className="block">
                                    <span className="text-sm font-medium">Link Lampiran (opsional)</span>
                                    <input
                                        type="url"
                                        value={form.data.attachment_url}
                                        onChange={(event) => form.setData('attachment_url', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder="https://drive.google.com/..."
                                    />
                                    {form.errors.attachment_url && <span className="mt-1 block text-xs text-destructive">{form.errors.attachment_url}</span>}
                                </label>

                                <button
                                    type="submit"
                                    disabled={form.processing || assignment.status !== 'active' || migrationRequired}
                                    className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                                >
                                    <Send className="w-4 h-4" />
                                    Kirim Tugas
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={UI.panel}>
                            <SectionTitle icon={AlertCircle}>Status Penilaian</SectionTitle>
                            <div className="mt-4 space-y-2 text-sm">
                                <p className="font-semibold">{assignment?.submission?.status ?? 'belum dikumpulkan'}</p>
                                <p className="text-xs text-muted-foreground">Dikumpulkan: {assignment?.submission?.submitted_at ? new Date(assignment.submission.submitted_at).toLocaleString('id-ID') : '-'}</p>
                                <p className="text-xs text-muted-foreground">Dinilai: {assignment?.submission?.graded_at ? new Date(assignment.submission.graded_at).toLocaleString('id-ID') : '-'}</p>
                                <div className="panel-subcard p-3 text-sm">
                                    Nilai: {assignment?.submission?.score ?? '-'} / {assignment.max_score ?? 100}
                                </div>
                                <div className="panel-subcard p-3 text-xs text-muted-foreground">
                                    {assignment?.submission?.feedback ?? 'Belum ada feedback dari dosen.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}


