import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { HelpCircle, Plus, Search, Trash2 } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { CreateFormModal } from '@/components/CreateFormModal';

const emptyForm = {
    title: '',
    description: '',
    course_id: '',
    duration_minutes: '',
    total_questions: '',
    scheduled_at: '',
    status: 'draft',
};

export default function Quizzes({ quizzes, courses, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const form = useForm(emptyForm);
    const isEditing = editingId !== null;

    const summary = useMemo(() => {
        const total = quizzes.length;
        const active = quizzes.filter((item) => item.status === 'active').length;
        const draft = quizzes.filter((item) => item.status === 'draft').length;
        const averageScore = quizzes.length ? Math.round(quizzes.reduce((sum, q) => sum + (Number(q.avg_score) || 0), 0) / quizzes.length) : 0;
        return { total, active, draft, averageScore };
    }, [quizzes]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/quizzes', { search, status: statusFilter, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
        setShowForm(true);
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
            form.put(`/quizzes/${editingId}`, { preserveScroll: true, onSuccess: closeForm });
            return;
        }
        form.post('/quizzes', { preserveScroll: true, onSuccess: closeForm });
    };

    const destroyQuiz = (quiz) => {
        if (!window.confirm(`Hapus kuis "${quiz.title}"?`)) return;
        router.delete(`/quizzes/${quiz.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kuis" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Kuis" description="Buat dan kelola kuis untuk evaluasi mahasiswa" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Kuis" value={summary.total} tone="gradient-primary" />
                    <StatCard title="Aktif" value={summary.active} tone="gradient-success" />
                    <StatCard title="Draft" value={summary.draft} tone="gradient-warm" />
                    <StatCard title="Rata-rata Skor" value={`${summary.averageScore}%`} tone="bg-gradient-to-r from-sky-500 to-blue-600" />
                </div>

                <section className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                            <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kuis..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm" />
                                </div>
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm"><option value="all">Semua</option><option value="active">Aktif</option><option value="draft">Draft</option><option value="closed">Ditutup</option></select>
                                <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm"><option value="">Semua kursus</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
                                <button type="submit" className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Filter</button>
                            </form>
                            <button type="button" onClick={beginCreate} disabled={migrationRequired || mocked} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"><Plus className="w-4 h-4" /> Buat Kuis</button>
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {quizzes.length === 0 && <div className="col-span-full text-sm text-muted-foreground text-center py-10">Belum ada kuis.</div>}
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="panel-subcard p-4 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="inline-flex h-8 w-8 rounded-xl gradient-primary items-center justify-center text-white"><HelpCircle className="w-4 h-4" /></span>
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{mapStatus(quiz.status)}</span>
                                </div>
                                <div>
                                    <p className="font-semibold">{quiz.title}</p>
                                    <p className="text-xs text-muted-foreground">{quiz.course?.title ?? '-'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <p>{quiz.total_questions ?? 0} soal</p>
                                    <p>{quiz.duration_minutes ?? 0} menit</p>
                                    <p>{quiz.participants_count ?? 0} peserta</p>
                                    <p>Avg: {quiz.avg_score ?? '-'}%</p>
                                </div>
                                <p className="text-xs text-muted-foreground">Jatuh tempo: {formatDate(quiz.scheduled_at)}</p>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => beginEdit(quiz)} disabled={quiz.is_mock || mocked} className="text-xs px-2.5 py-1 rounded-lg border border-border">Edit</button>
                                    <button type="button" onClick={() => destroyQuiz(quiz)} disabled={quiz.is_mock || mocked} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-destructive/15 text-destructive"><Trash2 className="w-3.5 h-3.5" />Hapus</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <CreateFormModal open={showForm} title={isEditing ? 'Edit Kuis' : 'Tambah Kuis'} onClose={closeForm} onSubmit={submitForm} submitLabel={isEditing ? 'Simpan' : 'Tambah'} processing={form.processing} disableSubmit={migrationRequired || mocked} maxWidthClass="max-w-3xl">
                    <div className="space-y-3">
                        <Field label="Judul Kuis" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                        <label className="block"><span className="text-sm font-medium">Deskripsi</span><textarea value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} rows={3} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />{form.errors.description && <span className="text-xs text-destructive mt-1 block">{form.errors.description}</span>}</label>
                        <SelectField label="Kursus" value={form.data.course_id} onChange={(value) => form.setData('course_id', value)} error={form.errors.course_id}><option value="">Tanpa Kursus</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</SelectField>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Durasi (menit)" type="number" value={form.data.duration_minutes} error={form.errors.duration_minutes} onChange={(value) => form.setData('duration_minutes', value)} />
                            <Field label="Jumlah Soal" type="number" value={form.data.total_questions} error={form.errors.total_questions} onChange={(value) => form.setData('total_questions', value)} />
                        </div>
                        <Field label="Jadwal" type="datetime-local" value={form.data.scheduled_at} error={form.errors.scheduled_at} onChange={(value) => form.setData('scheduled_at', value)} />
                        <SelectField label="Status" value={form.data.status} onChange={(value) => form.setData('status', value)} error={form.errors.status}><option value="draft">Draft</option><option value="active">Aktif</option><option value="closed">Ditutup</option></SelectField>
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
function mapStatus(value) { if (value === 'active') return 'Aktif'; if (value === 'closed') return 'Ditutup'; return 'Draft'; }
function formatDate(value) { if (!value) return '-'; return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
function toInputDateTime(dateString) { if (!dateString) return ''; const date = new Date(dateString); if (Number.isNaN(date.getTime())) return ''; const offset = date.getTimezoneOffset(); const local = new Date(date.getTime() - offset * 60000); return local.toISOString().slice(0, 16); }
