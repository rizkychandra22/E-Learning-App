import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ClipboardList, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { CreateFormModal } from '@/components/CreateFormModal';
import { ActionIconButton } from '@/components/ActionIconButton';

const emptyForm = {
    title: '',
    description: '',
    course_id: '',
    due_at: '',
    max_score: 100,
    status: 'draft',
};

export default function Assignments({ assignments, courses, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm(emptyForm);
    const isEditing = editingId !== null;

    const summary = useMemo(() => {
        const total = assignments.length;
        const open = assignments.filter((item) => item.status === 'active').length;
        const needReview = assignments.filter((item) => Number(item.submissions_count) > 0).length;
        const graded = assignments.filter((item) => item.status === 'closed').length;
        return { total, open, needReview, graded };
    }, [assignments]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/assignments', { search, status: statusFilter, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
        setShowForm(true);
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
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();
        if (isEditing) {
            form.put(`/assignments/${editingId}`, { preserveScroll: true, onSuccess: closeForm });
            return;
        }
        form.post('/assignments', { preserveScroll: true, onSuccess: closeForm });
    };

    const destroyAssignment = (assignment) => {
        if (!window.confirm(`Hapus tugas "${assignment.title}"?`)) return;
        router.delete(`/assignments/${assignment.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Tugas" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Tugas" description="Buat, kelola, dan nilai tugas mahasiswa" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Tugas" value={summary.total} tone="gradient-primary" />
                    <StatCard title="Terbuka" value={summary.open} tone="gradient-success" />
                    <StatCard title="Perlu Dinilai" value={summary.needReview} tone="gradient-warm" />
                    <StatCard title="Sudah Dinilai" value={summary.graded} tone="bg-gradient-to-r from-sky-500 to-blue-600" />
                </div>

                <section className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                            <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari tugas..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm" />
                                </div>
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                                    <option value="all">Semua</option>
                                    <option value="draft">Draft</option>
                                    <option value="active">Terbuka</option>
                                    <option value="closed">Ditutup</option>
                                </select>
                                <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                                    <option value="">Semua kursus</option>
                                    {courses.map((course) => (<option key={course.id} value={course.id}>{course.title}</option>))}
                                </select>
                                <button type="submit" className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Filter</button>
                            </form>
                            <button type="button" onClick={beginCreate} disabled={migrationRequired || mocked} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"><Plus className="w-4 h-4" /> Buat Tugas</button>
                        </div>
                    </div>

                    <div className="p-4 space-y-3">
                        {assignments.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">Belum ada tugas.</div>}
                        {assignments.map((assignment) => {
                            const collected = Number(assignment.submissions_count ?? 0);
                            const maxSub = Math.max(Number(assignment.students_count ?? 1), 1);
                            const pct = Math.max(0, Math.min(100, Math.round((collected / maxSub) * 100)));
                            return (
                                <div key={assignment.id} className="panel-subcard p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="font-semibold">{assignment.title}</p>
                                            <p className="text-xs text-muted-foreground">{assignment.course?.title ?? '-'} · Jatuh tempo: {formatDateTime(assignment.due_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{mapStatus(assignment.status)}</span>
                                            <ActionIconButton icon={Pencil} label="Edit" tone="primary" onClick={() => beginEdit(assignment)} disabled={assignment.is_mock || mocked} />
                                            <ActionIconButton icon={Trash2} label="Hapus" tone="danger" onClick={() => destroyAssignment(assignment)} disabled={assignment.is_mock || mocked} />
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full gradient-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                                    <p className="text-xs text-muted-foreground">{collected}/{maxSub} dikumpulkan ({pct}%)</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <CreateFormModal open={showForm} title={isEditing ? 'Edit Tugas' : 'Tambah Tugas'} onClose={closeForm} onSubmit={submitForm} submitLabel={isEditing ? 'Simpan' : 'Tambah'} processing={form.processing} disableSubmit={migrationRequired || mocked} maxWidthClass="max-w-3xl">
                    <div className="space-y-3">
                        <Field label="Judul Tugas" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                        <label className="block"><span className="text-sm font-medium">Deskripsi</span><textarea value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} rows={3} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />{form.errors.description && <span className="text-xs text-destructive mt-1 block">{form.errors.description}</span>}</label>
                        <SelectField label="Kursus" value={form.data.course_id} onChange={(value) => form.setData('course_id', value)} error={form.errors.course_id}><option value="">Tanpa Kursus</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</SelectField>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Tenggat Waktu" type="datetime-local" value={form.data.due_at} error={form.errors.due_at} onChange={(value) => form.setData('due_at', value)} />
                            <Field label="Skor Maksimum" type="number" value={form.data.max_score} error={form.errors.max_score} onChange={(value) => form.setData('max_score', value)} />
                        </div>
                        <SelectField label="Status" value={form.data.status} onChange={(value) => form.setData('status', value)} error={form.errors.status}><option value="draft">Draft</option><option value="active">Terbuka</option><option value="closed">Ditutup</option></SelectField>
                    </div>
                </CreateFormModal>
            </div>
        </ProtectedLayout>
    );
}

function StatCard({ title, value, tone }) {
    return <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-card ${tone}`}><div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" /><p className="text-sm text-white/85">{title}</p><p className="mt-1 text-[42px] leading-none font-bold">{value}</p></div>;
}

function Field({ label, value, onChange, error, type = 'text' }) { return <label className="block"><span className="text-sm font-medium">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />{error && <span className="text-xs text-destructive mt-1 block">{error}</span>}</label>; }
function SelectField({ label, value, onChange, error, children }) { return <label className="block"><span className="text-sm font-medium">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">{children}</select>{error && <span className="text-xs text-destructive mt-1 block">{error}</span>}</label>; }

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

function mapStatus(value) {
    if (value === 'active') return 'Terbuka';
    if (value === 'closed') return 'Ditutup';
    return 'Draft';
}

