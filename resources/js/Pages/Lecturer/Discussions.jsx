import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X, Search, MessageSquare } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardField, CardActions, CardBadge } from '@/components/DataCardList';

const emptyForm = {
    title: '',
    body: '',
    course_id: '',
    status: 'open',
};

const statusBadge = {
    open: 'bg-success/15 text-success',
    closed: 'bg-secondary text-secondary-foreground',
};

export default function Discussions({ discussions, courses, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [editingId, setEditingId] = useState(null);

    const form = useForm(emptyForm);
    const isEditing = editingId !== null;
    const selectedDiscussion = useMemo(() => discussions.find((item) => item.id === editingId) ?? null, [discussions, editingId]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/discussions', { search, status: statusFilter, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        setCourseFilter('');
        router.get('/discussions', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
    };

    const beginEdit = (discussion) => {
        setEditingId(discussion.id);
        form.setData({
            title: discussion.title ?? '',
            body: discussion.body ?? '',
            course_id: discussion.course_id ? String(discussion.course_id) : '',
            status: discussion.status ?? 'open',
        });
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();

        if (isEditing) {
            form.put(`/discussions/${editingId}`, { preserveScroll: true });
            return;
        }

        form.post('/discussions', { preserveScroll: true });
    };

    const destroyDiscussion = (discussion) => {
        if (!window.confirm(`Hapus diskusi "${discussion.title}"?`)) return;
        router.delete(`/discussions/${discussion.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Diskusi" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Diskusi" description="Kelola topik diskusi dan interaksi mahasiswa di setiap kursus." />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <MessageSquare className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <MessageSquare className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel discussions belum tersedia.</p>
                            <p>Jalankan migrasi dulu: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari judul diskusi..."
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="open">Open</option>
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
                                items={discussions}
                                emptyText="Belum ada diskusi untuk kursus Anda."
                                renderCard={(discussion) => (
                                    <DataCard key={discussion.id} accentColor="hsl(var(--primary))">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">{discussion.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{discussion.course?.title ?? 'Tanpa kursus'}</p>
                                                </div>
                                                <CardBadge className={statusBadge[discussion.status] ?? 'bg-secondary text-secondary-foreground'}>
                                                    {discussion.status}
                                                </CardBadge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <CardField label="Dibuat" value={formatDateTime(discussion.created_at)} />
                                                <CardField label="Status" value={discussion.status} />
                                            </div>
                                            <p className="text-sm text-muted-foreground break-words">{discussion.body}</p>
                                        </div>
                                        <CardActions>
                                            <button
                                                type="button"
                                                onClick={() => beginEdit(discussion)}
                                                disabled={discussion.is_mock || mocked}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium disabled:opacity-60"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroyDiscussion(discussion)}
                                                disabled={discussion.is_mock || mocked}
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

                    <div className="bg-card border border-border rounded-xl shadow-card p-5 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">{isEditing ? 'Edit Diskusi' : 'Tambah Diskusi'}</h2>
                            {isEditing && (
                                <button type="button" onClick={beginCreate} className="p-1.5 rounded-md hover:bg-secondary" aria-label="Batalkan edit">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {isEditing && selectedDiscussion && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Mengubah diskusi <span className="font-medium text-foreground">{selectedDiscussion.title}</span>
                            </p>
                        )}

                        <form onSubmit={submitForm} className="space-y-3">
                            <Field label="Judul Diskusi" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                            <SelectField label="Kursus" value={form.data.course_id} onChange={(value) => form.setData('course_id', value)} error={form.errors.course_id}>
                                <option value="">Tanpa Kursus</option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </SelectField>
                            <label className="block">
                                <span className="text-sm font-medium">Isi Diskusi</span>
                                <textarea
                                    value={form.data.body}
                                    onChange={(event) => form.setData('body', event.target.value)}
                                    rows={4}
                                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                {form.errors.body && <span className="text-xs text-destructive mt-1 block">{form.errors.body}</span>}
                            </label>
                            <SelectField label="Status" value={form.data.status} onChange={(value) => form.setData('status', value)} error={form.errors.status}>
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                            </SelectField>

                            <button
                                type="submit"
                                disabled={form.processing || migrationRequired || mocked}
                                className="w-full inline-flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                            >
                                <Plus className="w-4 h-4" />
                                {isEditing ? 'Simpan Perubahan' : 'Tambah Diskusi'}
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
