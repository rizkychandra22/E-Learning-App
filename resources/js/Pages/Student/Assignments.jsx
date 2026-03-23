import { useMemo } from 'react';
import { CalendarDays, CheckCircle2, ClipboardList, Clock, Flag, ListChecks } from 'lucide-react';
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

function AssignmentCard({ assignment, intlLocale }) {
    const dueAt = assignment?.due_at ? new Date(assignment.due_at) : null;
    const now = new Date();
    const dayDiff = dueAt ? Math.ceil((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const priorityClass = dayDiff !== null && dayDiff <= 1 ? 'text-destructive' : dayDiff !== null && dayDiff <= 3 ? 'text-warning' : 'text-success';
    const submissionStatus = assignment?.submission?.status ?? 'belum';

    return (
        <div className={cn(UI.panel, 'space-y-3')}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-muted-foreground">{assignment?.course?.title ?? 'Tanpa kursus'}</p>
                    <h3 className="font-semibold">{assignment?.title}</h3>
                </div>
                <span className={UI.chip}>{assignment?.max_score ?? 100} poin</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className={UI.chip}>
                    <Clock className="w-3.5 h-3.5" />
                    {dueAt ? dueAt.toLocaleString(intlLocale) : 'Tanpa deadline'}
                </span>
                <span className={cn(UI.chip, priorityClass)}>
                    <Flag className="w-3.5 h-3.5" />
                    {dayDiff === null ? 'Deadline fleksibel' : dayDiff < 0 ? 'Lewat deadline' : `${dayDiff} hari lagi`}
                </span>
                <span className={cn(UI.chip, submissionStatus === 'graded' ? 'text-success' : submissionStatus === 'submitted' ? 'text-primary' : 'text-muted-foreground')}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {submissionStatus === 'graded' ? 'Sudah dinilai' : submissionStatus === 'submitted' ? 'Sudah dikumpulkan' : 'Belum dikumpulkan'}
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                <Link href={`/assignments/${assignment?.id}`} className="text-xs font-medium text-primary hover:opacity-80">
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

    const assignments = props?.assignments ?? [];
    const summary = props?.summary ?? { active_count: 0, submitted_count: 0, graded_count: 0 };
    const migrationRequired = props?.migrationRequired ?? { assignments: false, submissions: false };

    return (
        <ProtectedLayout>
            <Head title="Tugas" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Tugas"
                    description="Kelola daftar tugas aktif, pantau progress, dan prioritas deadline."
                />

                {(migrationRequired.assignments || migrationRequired.submissions) && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Fitur tugas/submission belum siap. Jalankan migrasi: <code className="font-mono">php artisan migrate</code>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <ClipboardList className="w-3.5 h-3.5" />
                            {summary.active_count} tugas
                        </span>
                        <span className={UI.chip}>
                            <ListChecks className="w-3.5 h-3.5" />
                            {summary.submitted_count} sudah dikumpulkan
                        </span>
                    </div>
                    <span className={UI.chip}>{summary.graded_count} sudah dinilai</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {assignments.map((assignment) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} intlLocale={intlLocale} />
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}

