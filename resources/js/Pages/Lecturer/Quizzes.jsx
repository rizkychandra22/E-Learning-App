import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X, Search, Award } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardField, CardActions, CardBadge } from '@/components/DataCardList';

const emptyForm = {
    title: '',
    description: '',
    course_id: '',
    duration_minutes: '',
    total_questions: '',
    scheduled_at: '',
    status: 'draft',
};

const statusBadge = {
    draft: 'bg-warning/20 text-warning',
    active: 'bg-success/15 text-success',
    closed: 'bg-secondary text-secondary-foreground',
};

export default function Quizzes({ quizzes, courses, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [editingId, setEditingId] = useState(null);

    const form = useForm(emptyForm);
    const isEditing = editingId !== null;
    const selectedQuiz = useMemo(() => quizzes.find((item) => item.id === editingId) ?? null, [quizzes, editingId]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/quizzes', { search, status: statusFilter, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        setCourseFilter('');
        router.get('/quizzes', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
    };

    const beginEdit = (quiz) => {
        setEditingId(quiz.id);
        form.setData({
            title: quiz.title ?? '',
            description: quiz.description ?? '',
            course_id: quiz.course_id ? String(quiz.course_id) : '',
            duration_minutes: quiz.duration_minutes ?? '',
            total_questions: quiz.total_questions ?? '',
            scheduled_at: toInputDateTime(quiz.scheduled_at),
            status: quiz.status ?? 'draft',
        });
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();

        if (isEditing) {
            form.put(`/quizzes/${editingId}`, { preserveScroll: true });
            return;
        }

        form.post('/quizzes', { preserveScroll: true });
    };

    const destroyQuiz = (quiz) => {
        if (!window.confirm(`Hapus kuis "${quiz.title}"?`)) return;
        router.delete(`/quizzes/${quiz.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kuis" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Kuis" description="Siapkan kuis dan ujian online yang terstruktur untuk mahasiswa." />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <Award className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <Award className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel quizzes belum tersedia.</p>
                            <p>Jalankan migrasi dulu: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 panel-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari judul kuis..."
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="closed">Closed</option>
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
                                <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                            </form>
                        </div>

                        <div className="p-4">
                            <DataCardList
                                items={quizzes}
                                emptyText="Belum ada kuis untuk kursus Anda."
                                renderCard={(quiz) => (
                                    <DataCard key={quiz.id} accentColor="hsl(var(--primary))">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">{quiz.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{quiz.course?.title ?? 'Tanpa kursus'}</p>
                                                </div>
                                                <CardBadge className={statusBadge[quiz.status] ?? 'bg-secondary text-secondary-foreground'}>
                                                    {quiz.status}
                                                </CardBadge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <CardField label="Durasi" value={quiz.duration_minutes ? `${quiz.duration_minutes} menit` : '-'} />
                                                <CardField label="Jumlah Soal" value={quiz.total_questions ?? '-'} />
                                                <CardField label="Jadwal" value={formatDateTime(quiz.scheduled_at)} />
                                            </div>
                                            {quiz.description && (
                                                <p className="text-sm text-muted-foreground break-words">{quiz.description}</p>
                                            )}
                                        </div>
                                        <CardActions>
                                            <button
                                                type="button"
                                                onClick={() => beginEdit(quiz)}
                                                disabled={quiz.is_mock || mocked}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium disabled:opacity-60"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroyQuiz(quiz)}
                                                disabled={quiz.is_mock || mocked}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium disabled:opacity-60"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Hapus
                                            </button>
                                        </CardActions>
                                    </DataCard>
                                )}
                            />
                        </div>
                    </div>

                    <div className="panel-card p-4 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">{isEditing ? 'Edit Kuis' : 'Tambah Kuis'}</h2>
                            {isEditing && (
                                <button type="button" onClick={beginCreate} className="p-1.5 rounded-md hover:bg-secondary" aria-label="Batalkan edit">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {isEditing && selectedQuiz && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Mengubah kuis <span className="font-medium text-foreground">{selectedQuiz.title}</span>
                            </p>
                        )}

                        <form onSubmit={submitForm} className="space-y-3">
                            <Field label="Judul Kuis" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                            <label className="block">
                                <span className="text-sm font-medium">Deskripsi</span>
                                <textarea
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                    rows={3}
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                {form.errors.description && <span className="text-xs text-destructive mt-1 block">{form.errors.description}</span>}
                            </label>
                            <SelectField label="Kursus" value={form.data.course_id} onChange={(value) => form.setData('course_id', value)} error={form.errors.course_id}>
                                <option value="">Tanpa Kursus</option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </SelectField>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Durasi (menit)" type="number" value={form.data.duration_minutes} error={form.errors.duration_minutes} onChange={(value) => form.setData('duration_minutes', value)} />
                                <Field label="Jumlah Soal" type="number" value={form.data.total_questions} error={form.errors.total_questions} onChange={(value) => form.setData('total_questions', value)} />
                            </div>
                            <Field label="Jadwal" type="datetime-local" value={form.data.scheduled_at} error={form.errors.scheduled_at} onChange={(value) => form.setData('scheduled_at', value)} />
                            <SelectField label="Status" value={form.data.status} onChange={(value) => form.setData('status', value)} error={form.errors.status}>
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                            </SelectField>

                            <button
                                type="submit"
                                disabled={form.processing || migrationRequired || mocked}
                                className="w-full inline-flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                            >
                                <Plus className="w-4 h-4" />
                                {isEditing ? 'Simpan Perubahan' : 'Tambah Kuis'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text' }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function SelectField({ label, value, onChange, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
                {children}
            </select>
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID');
}

function toInputDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
}


