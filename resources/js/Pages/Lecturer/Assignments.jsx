import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X, Search, ClipboardList } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardField, CardActions, CardBadge } from '@/components/DataCardList';

const emptyForm = {
    title: '',
    description: '',
    course_id: '',
    due_at: '',
    max_score: 100,
    status: 'draft',
};

const statusBadge = {
    draft: 'bg-warning/20 text-warning',
    active: 'bg-success/15 text-success',
    closed: 'bg-secondary text-secondary-foreground',
};

export default function Assignments({ assignments, courses, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [editingId, setEditingId] = useState(null);

    const form = useForm(emptyForm);
    const isEditing = editingId !== null;
    const selectedAssignment = useMemo(() => assignments.find((item) => item.id === editingId) ?? null, [assignments, editingId]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/assignments', { search, status: statusFilter, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        setCourseFilter('');
        router.get('/assignments', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
    };

    const beginEdit = (assignment) => {
        setEditingId(assignment.id);
        form.setData({
            title: assignment.title ?? '',
            description: assignment.description ?? '',
            course_id: assignment.course_id ? String(assignment.course_id) : '',
            due_at: toInputDateTime(assignment.due_at),
            max_score: assignment.max_score ?? 100,
            status: assignment.status ?? 'draft',
        });
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();

        if (isEditing) {
            form.put(`/assignments/${editingId}`, { preserveScroll: true });
            return;
        }

        form.post('/assignments', { preserveScroll: true });
    };

    const destroyAssignment = (assignment) => {
        if (!window.confirm(`Hapus tugas "${assignment.title}"?`)) return;
        router.delete(`/assignments/${assignment.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Tugas" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Tugas" description="Susun tugas dan tenggat waktu untuk kursus yang Anda ampu." />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <ClipboardList className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <ClipboardList className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel assignments belum tersedia.</p>
                            <p>Jalankan migrasi dulu: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari judul tugas..."
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
                                items={assignments}
                                emptyText="Belum ada tugas untuk kursus Anda."
                                renderCard={(assignment) => (
                                    <DataCard key={assignment.id} accentColor="hsl(var(--primary))">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">{assignment.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{assignment.course?.title ?? 'Tanpa kursus'}</p>
                                                </div>
                                                <CardBadge className={statusBadge[assignment.status] ?? 'bg-secondary text-secondary-foreground'}>
                                                    {assignment.status}
                                                </CardBadge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <CardField label="Tenggat" value={formatDateTime(assignment.due_at)} />
                                                <CardField label="Skor Maks" value={assignment.max_score ?? 0} />
                                                <CardField label="Dibuat" value={formatDateTime(assignment.created_at)} />
                                            </div>
                                            {assignment.description && (
                                                <p className="text-sm text-muted-foreground break-words">{assignment.description}</p>
                                            )}
                                        </div>
                                        <CardActions>
                                            <button
                                                type="button"
                                                onClick={() => beginEdit(assignment)}
                                                disabled={assignment.is_mock || mocked}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium disabled:opacity-60"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroyAssignment(assignment)}
                                                disabled={assignment.is_mock || mocked}
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

                    <div className="bg-card border border-border rounded-xl shadow-card p-4 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">{isEditing ? 'Edit Tugas' : 'Tambah Tugas'}</h2>
                            {isEditing && (
                                <button type="button" onClick={beginCreate} className="p-1.5 rounded-md hover:bg-secondary" aria-label="Batalkan edit">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {isEditing && selectedAssignment && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Mengubah tugas <span className="font-medium text-foreground">{selectedAssignment.title}</span>
                            </p>
                        )}

                        <form onSubmit={submitForm} className="space-y-3">
                            <Field label="Judul Tugas" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
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
                            <Field label="Tenggat Waktu" type="datetime-local" value={form.data.due_at} error={form.errors.due_at} onChange={(value) => form.setData('due_at', value)} />
                            <Field label="Skor Maksimum" type="number" value={form.data.max_score} error={form.errors.max_score} onChange={(value) => form.setData('max_score', value)} />
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
                                {isEditing ? 'Simpan Perubahan' : 'Tambah Tugas'}
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

