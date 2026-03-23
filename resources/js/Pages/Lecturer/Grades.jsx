import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Award, BookOpenCheck, Search } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardActions, CardBadge, CardField } from '@/components/DataCardList';

const assignmentStatusBadge = {
    submitted: 'bg-warning/20 text-warning',
    graded: 'bg-success/20 text-success',
    draft: 'bg-secondary text-secondary-foreground',
};

const quizStatusBadge = {
    submitted: 'bg-warning/20 text-warning',
    graded: 'bg-success/20 text-success',
    in_progress: 'bg-secondary text-secondary-foreground',
};

export default function Grades({ assignmentSubmissions, quizAttempts, courses, summary, filters, migrationRequired }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [typeFilter, setTypeFilter] = useState(filters?.type ?? 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');

    const [editingType, setEditingType] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const form = useForm({ score: '', feedback: '' });

    const selectedItem = useMemo(() => {
        if (!editingType || !editingId) return null;

        if (editingType === 'assignment') {
            return assignmentSubmissions.find((item) => item.id === editingId) ?? null;
        }

        return quizAttempts.find((item) => item.id === editingId) ?? null;
    }, [editingType, editingId, assignmentSubmissions, quizAttempts]);

    const applyFilters = (event) => {
        event.preventDefault();
        router.get('/grades', {
            search,
            course: courseFilter,
            type: typeFilter,
            status: statusFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setCourseFilter('');
        setTypeFilter('all');
        setStatusFilter('all');
        router.get('/grades', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const openGradeForm = (type, item) => {
        setEditingType(type);
        setEditingId(item.id);
        form.setData({
            score: item.score ?? '',
            feedback: item.feedback ?? '',
        });
        form.clearErrors();
    };

    const submitGrade = (event) => {
        event.preventDefault();
        if (!selectedItem) return;

        if (editingType === 'assignment') {
            form.put(`/grades/assignments/${selectedItem.id}`, { preserveScroll: true });
            return;
        }

        form.put(`/grades/quizzes/${selectedItem.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Penilaian" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Penilaian" description="Review submission mahasiswa, beri nilai, dan kirim feedback terstruktur." />

                {migrationRequired?.any && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Tabel grading/submission belum lengkap. Jalankan <code className="font-mono">php artisan migrate</code>.
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <SummaryCard label="Tugas menunggu" value={summary?.pending_assignment ?? 0} />
                    <SummaryCard label="Kuis menunggu" value={summary?.pending_quiz ?? 0} />
                    <SummaryCard label="Tugas dinilai" value={summary?.graded_assignment ?? 0} />
                    <SummaryCard label="Kuis dinilai" value={summary?.graded_quiz ?? 0} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 panel-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <form onSubmit={applyFilters} className="flex flex-col lg:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari mahasiswa/judul..."
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <select
                                    value={typeFilter}
                                    onChange={(event) => setTypeFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-36 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">Semua Tipe</option>
                                    <option value="assignment">Tugas</option>
                                    <option value="quiz">Kuis</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-36 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="graded">Graded</option>
                                </select>
                                <select
                                    value={courseFilter}
                                    onChange={(event) => setCourseFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-52 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="">Semua Kursus</option>
                                    {courses.map((course) => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                                <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Filter</button>
                                <button type="button" onClick={resetFilters} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                            </form>
                        </div>

                        <div className="p-4 space-y-6">
                            {(typeFilter === 'all' || typeFilter === 'assignment') && (
                                <section className="space-y-3">
                                    <h3 className="font-semibold">Submission Tugas</h3>
                                    <DataCardList
                                        items={assignmentSubmissions}
                                        emptyText="Belum ada submission tugas untuk filter ini."
                                        renderCard={(item) => (
                                            <DataCard key={`assignment-${item.id}`} accentColor="hsl(var(--primary))">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate">{item.assignment?.title}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{item.student?.name} - {item.course?.title ?? item.assignment?.course?.title}</p>
                                                        </div>
                                                        <CardBadge className={assignmentStatusBadge[item.status] ?? 'bg-secondary text-secondary-foreground'}>{item.status}</CardBadge>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <CardField label="Skor" value={item.score ?? '-'} />
                                                        <CardField label="Maks" value={item.assignment?.max_score ?? 100} />
                                                        <CardField label="Submitted" value={formatDateTime(item.submitted_at)} />
                                                    </div>
                                                    {item.submission_text && <p className="text-sm text-muted-foreground break-words">{item.submission_text}</p>}
                                                </div>
                                                <CardActions>
                                                    <button
                                                        type="button"
                                                        onClick={() => openGradeForm('assignment', item)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium"
                                                    >
                                                        Nilai
                                                    </button>
                                                </CardActions>
                                            </DataCard>
                                        )}
                                    />
                                </section>
                            )}

                            {(typeFilter === 'all' || typeFilter === 'quiz') && (
                                <section className="space-y-3">
                                    <h3 className="font-semibold">Attempt Kuis</h3>
                                    <DataCardList
                                        items={quizAttempts}
                                        emptyText="Belum ada attempt kuis untuk filter ini."
                                        renderCard={(item) => (
                                            <DataCard key={`quiz-${item.id}`} accentColor="hsl(var(--primary))">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate">{item.quiz?.title}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{item.student?.name} - {item.course?.title ?? item.quiz?.course?.title}</p>
                                                        </div>
                                                        <CardBadge className={quizStatusBadge[item.status] ?? 'bg-secondary text-secondary-foreground'}>{item.status}</CardBadge>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <CardField label="Skor" value={item.score ?? '-'} />
                                                        <CardField label="Maks" value={100} />
                                                        <CardField label="Submitted" value={formatDateTime(item.submitted_at)} />
                                                    </div>
                                                    {item.answers && <p className="text-sm text-muted-foreground break-words">{item.answers}</p>}
                                                </div>
                                                <CardActions>
                                                    <button
                                                        type="button"
                                                        onClick={() => openGradeForm('quiz', item)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium"
                                                    >
                                                        Nilai
                                                    </button>
                                                </CardActions>
                                            </DataCard>
                                        )}
                                    />
                                </section>
                            )}
                        </div>
                    </div>

                    <div className="panel-card p-4 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">Form Penilaian</h2>
                        </div>

                        {!selectedItem && (
                            <p className="text-sm text-muted-foreground">
                                Pilih salah satu submission di daftar kiri untuk memberi nilai.
                            </p>
                        )}

                        {selectedItem && (
                            <>
                                <div className="panel-subcard p-3 text-sm mb-4">
                                    <p className="font-medium">{editingType === 'assignment' ? selectedItem.assignment?.title : selectedItem.quiz?.title}</p>
                                    <p className="text-xs text-muted-foreground">{selectedItem.student?.name}</p>
                                </div>

                                <form onSubmit={submitGrade} className="space-y-3">
                                    <label className="block">
                                        <span className="text-sm font-medium">Skor</span>
                                        <input
                                            type="number"
                                            value={form.data.score}
                                            onChange={(event) => form.setData('score', event.target.value)}
                                            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        {form.errors.score && <span className="text-xs text-destructive mt-1 block">{form.errors.score}</span>}
                                    </label>

                                    <label className="block">
                                        <span className="text-sm font-medium">Feedback</span>
                                        <textarea
                                            rows={4}
                                            value={form.data.feedback}
                                            onChange={(event) => form.setData('feedback', event.target.value)}
                                            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        {form.errors.feedback && <span className="text-xs text-destructive mt-1 block">{form.errors.feedback}</span>}
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="w-full inline-flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                                    >
                                        <BookOpenCheck className="w-4 h-4" />
                                        Simpan Nilai
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="panel-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
    );
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID');
}


