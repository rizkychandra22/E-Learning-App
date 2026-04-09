import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { MessageSquare, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { CreateFormModal } from '@/components/CreateFormModal';
import { ActionIconButton } from '@/components/ActionIconButton';

const emptyForm = {
    title: '',
    body: '',
    course_id: '',
    status: 'open',
};

export default function Discussions({ discussions, courses, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const form = useForm(emptyForm);
    const isEditing = editingId !== null;

    const summary = useMemo(() => {
        const total = discussions.length;
        const unanswered = discussions.filter((item) => item.status === 'open').length;
        const answered = discussions.filter((item) => item.status === 'closed').length;
        const replies = discussions.reduce((sum, item) => sum + (Number(item.replies_count) || 0), 0);
        return { total, unanswered, answered, replies };
    }, [discussions]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/discussions', { search, status: statusFilter, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
        setShowForm(true);
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
            form.put(`/discussions/${editingId}`, { preserveScroll: true, onSuccess: closeForm });
            return;
        }
        form.post('/discussions', { preserveScroll: true, onSuccess: closeForm });
    };

    const destroyDiscussion = (discussion) => {
        if (!window.confirm(`Hapus diskusi "${discussion.title}"?`)) return;
        router.delete(`/discussions/${discussion.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Diskusi" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Diskusi" description="Forum diskusi dan tanya-jawab dengan mahasiswa" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Thread" value={summary.total} tone="gradient-primary" />
                    <StatCard title="Belum Dijawab" value={summary.unanswered} tone="gradient-warm" />
                    <StatCard title="Sudah Dijawab" value={summary.answered} tone="gradient-success" />
                    <StatCard title="Total Balasan" value={summary.replies} tone="bg-gradient-to-r from-sky-500 to-blue-600" />
                </div>

                <section className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                            <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari diskusi..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm" />
                                </div>
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm"><option value="all">Semua</option><option value="open">Belum dijawab</option><option value="closed">Sudah dijawab</option></select>
                                <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm"><option value="">Semua mata kuliah</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
                                <button type="submit" className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Filter</button>
                            </form>
                            <button type="button" onClick={beginCreate} disabled={migrationRequired || mocked} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"><Plus className="w-4 h-4" /> Buat Thread</button>
                        </div>
                    </div>

                    <div className="p-4 space-y-3">
                        {discussions.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">Belum ada diskusi.</div>}
                        {discussions.map((discussion) => (
                            <div key={discussion.id} className="panel-subcard p-3 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold">{discussion.title}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{discussion.body}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{discussion.course?.title ?? '-'} · {formatDateTime(discussion.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2.5 py-1 rounded-full ${discussion.status === 'open' ? 'bg-warning/20 text-warning' : 'bg-success/15 text-success'}`}>{discussion.status === 'open' ? 'Belum dijawab' : 'Terjawab'}</span>
                                    <ActionIconButton icon={Pencil} label="Edit" tone="primary" onClick={() => beginEdit(discussion)} disabled={discussion.is_mock || mocked} />
                                    <ActionIconButton icon={Trash2} label="Hapus" tone="danger" onClick={() => destroyDiscussion(discussion)} disabled={discussion.is_mock || mocked} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <CreateFormModal open={showForm} title={isEditing ? 'Edit Thread' : 'Tambah Thread'} onClose={closeForm} onSubmit={submitForm} submitLabel={isEditing ? 'Simpan' : 'Tambah'} processing={form.processing} disableSubmit={migrationRequired || mocked} maxWidthClass="max-w-3xl">
                    <div className="space-y-3">
                        <Field label="Judul Diskusi" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                        <SelectField label="Mata Kuliah" value={form.data.course_id} onChange={(value) => form.setData('course_id', value)} error={form.errors.course_id}><option value="">Tanpa Mata Kuliah</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</SelectField>
                        <label className="block"><span className="text-sm font-medium">Isi Diskusi</span><textarea value={form.data.body} onChange={(event) => form.setData('body', event.target.value)} rows={4} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />{form.errors.body && <span className="text-xs text-destructive mt-1 block">{form.errors.body}</span>}</label>
                        <SelectField label="Status" value={form.data.status} onChange={(value) => form.setData('status', value)} error={form.errors.status}><option value="open">Open</option><option value="closed">Closed</option></SelectField>
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
function formatDateTime(dateString) { if (!dateString) return '-'; const date = new Date(dateString); if (Number.isNaN(date.getTime())) return '-'; return date.toLocaleString('id-ID'); }



