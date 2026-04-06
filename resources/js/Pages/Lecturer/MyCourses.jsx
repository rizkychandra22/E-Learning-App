import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { BookOpen, Layers3, Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { CreateFormModal } from '@/components/CreateFormModal';
import { ActionIconButton } from '@/components/ActionIconButton';
import { cn } from '@/lib/cn';

const emptyForm = {
    title: '',
    code: '',
    description: '',
    category: '',
    tags: '',
    jurusan_id: '',
    level: 'dasar',
    semester: '',
    credit_hours: 2,
    status: 'draft',
};

const gradients = ['gradient-primary', 'gradient-accent', 'gradient-warm', 'gradient-success'];
const statusMeta = {
    draft: { label: 'Draft', progress: 25 },
    active: { label: 'Aktif', progress: 70 },
    archived: { label: 'Arsip', progress: 100 },
};

export default function MyCourses({ courses, jurusans, categories, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category ?? 'all');
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm(emptyForm);
    const isEditing = editingId !== null;
    const selectedCourse = useMemo(() => courses.find((item) => item.id === editingId) ?? null, [courses, editingId]);

    const summary = useMemo(() => {
        const total = courses.length;
        const active = courses.filter((item) => item.status === 'active').length;
        const draft = courses.filter((item) => item.status === 'draft').length;
        const students = courses.reduce((sum, item) => sum + (Number(item.students_count) || 0), 0);
        return { total, active, draft, students };
    }, [courses]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/my-courses', { search, status: statusFilter, category: categoryFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        setCategoryFilter('all');
        router.get('/my-courses', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
        setShowForm(true);
    };

    const beginEdit = (course) => {
        setEditingId(course.id);
        form.setData({
            title: course.title ?? '',
            code: course.code ?? '',
            description: course.description ?? '',
            category: course.category ?? '',
            tags: Array.isArray(course.tags) ? course.tags.join(', ') : '',
            jurusan_id: course.jurusan_id ? String(course.jurusan_id) : '',
            level: course.level ?? 'dasar',
            semester: course.semester ?? '',
            credit_hours: course.credit_hours ?? 2,
            status: course.status ?? 'draft',
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
        const payload = (data) => ({ ...data, tags: parseTags(data.tags) });

        if (isEditing) {
            form.transform(payload).put(`/my-courses/${editingId}`, { preserveScroll: true, onSuccess: closeForm });
            return;
        }

        form.transform(payload).post('/my-courses', { preserveScroll: true, onSuccess: closeForm });
    };

    const destroyCourse = (course) => {
        if (!window.confirm(`Hapus kursus "${course.title}"?`)) return;
        router.delete(`/my-courses/${course.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kursus Saya" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Kursus Saya" description="Kelola semua kelas dan materi yang Anda ampu" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Kursus" value={summary.total} tone="gradient-primary" />
                    <StatCard title="Kelas Aktif" value={summary.active} tone="gradient-success" />
                    <StatCard title="Draft" value={summary.draft} tone="gradient-warm" />
                    <StatCard title="Total Jam" value={`${summary.students}j`} tone="bg-gradient-to-r from-sky-500 to-blue-600" />
                </div>

                <section className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border space-y-3">
                        <div className="flex flex-col xl:flex-row xl:items-center gap-2 justify-between">
                            <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kursus..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm" />
                                </div>
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                                    <option value="all">Semua</option>
                                    <option value="active">Aktif</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Arsip</option>
                                </select>
                                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                                    <option value="all">Semua kategori</option>
                                    {(categories ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                                <button type="submit" className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Filter</button>
                                <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Reset</button>
                            </form>
                            <div className="flex items-center gap-2">
                                <Link href="/learning-modules" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium">
                                    <Layers3 className="w-4 h-4" /> Kelola Modules
                                </Link>
                                <button type="button" onClick={beginCreate} disabled={migrationRequired || mocked} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
                                    <Plus className="w-4 h-4" /> Buat Kursus
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {courses.length === 0 && <div className="col-span-full text-sm text-muted-foreground text-center py-10">Belum ada kursus untuk Anda.</div>}
                        {courses.map((course, index) => {
                            const meta = statusMeta[course.status] ?? statusMeta.draft;
                            return (
                                <div key={course.id} className="panel-subcard p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm text-muted-foreground">{course.category || 'Kursus'}</p>
                                            <h3 className="font-semibold truncate">{course.title}</h3>
                                            <p className="text-xs text-muted-foreground truncate">{course.code}</p>
                                        </div>
                                        <div className="inline-flex items-center gap-1">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary">{meta.label}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {course.credit_hours ?? 0} materi</span>
                                        <span>Semester {course.semester ?? '-'}</span>
                                        <span>{course.materials_count ?? 0}j</span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Progress kelas</span><span className="font-medium">{meta.progress}%</span></div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className={cn('h-full rounded-full', gradients[index % gradients.length])} style={{ width: `${meta.progress}%` }} /></div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {(course.tags ?? []).length > 0 ? course.tags.map((tag) => <span key={`${course.id}-${tag}`} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground"><Tags className="w-3 h-3" />{tag}</span>) : <span className="text-xs text-muted-foreground">Tanpa tag</span>}
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <ActionIconButton icon={Pencil} label="Edit" tone="primary" onClick={() => beginEdit(course)} disabled={course.is_mock || mocked} />
                                        <ActionIconButton icon={Trash2} label="Hapus" tone="danger" onClick={() => destroyCourse(course)} disabled={course.is_mock || mocked} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <CreateFormModal
                    open={showForm}
                    title={isEditing ? 'Edit Kursus' : 'Tambah Kursus'}
                    onClose={closeForm}
                    onSubmit={submitForm}
                    submitLabel={isEditing ? 'Simpan' : 'Tambah'}
                    processing={form.processing}
                    disableSubmit={migrationRequired || mocked}
                    maxWidthClass="max-w-4xl"
                >
                    <div className="space-y-3">
                        <Field label="Judul Kursus" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                        <Field label="Kode Kursus" value={form.data.code} error={form.errors.code} onChange={(value) => form.setData('code', value)} />
                        <Field label="Kategori" value={form.data.category} error={form.errors.category} onChange={(value) => form.setData('category', value)} placeholder="Contoh: Pemrograman Web" />
                        <Field label="Tags" value={form.data.tags} error={form.errors.tags} onChange={(value) => form.setData('tags', value)} placeholder="react, laravel" />
                        <label className="block">
                            <span className="text-sm font-medium">Deskripsi</span>
                            <textarea value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} rows={3} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                            {form.errors.description && <span className="text-xs text-destructive mt-1 block">{form.errors.description}</span>}
                        </label>
                        <SelectField label="Jurusan" value={form.data.jurusan_id} onChange={(value) => form.setData('jurusan_id', value)} error={form.errors.jurusan_id}>
                            <option value="">Pilih Jurusan</option>
                            {jurusans.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.fakultas?.name ?? '-'})</option>)}
                        </SelectField>
                        <div className="grid grid-cols-2 gap-3">
                            <SelectField label="Level" value={form.data.level} onChange={(value) => form.setData('level', value)} error={form.errors.level}>
                                <option value="dasar">Dasar</option>
                                <option value="menengah">Menengah</option>
                                <option value="lanjutan">Lanjutan</option>
                            </SelectField>
                            <Field label="Semester" type="number" value={form.data.semester} error={form.errors.semester} onChange={(value) => form.setData('semester', value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="SKS" type="number" value={form.data.credit_hours} error={form.errors.credit_hours} onChange={(value) => form.setData('credit_hours', value)} />
                            <SelectField label="Status" value={form.data.status} onChange={(value) => form.setData('status', value)} error={form.errors.status}>
                                <option value="draft">Draft</option>
                                <option value="active">Aktif</option>
                                <option value="archived">Arsip</option>
                            </SelectField>
                        </div>
                    </div>
                </CreateFormModal>
            </div>
        </ProtectedLayout>
    );
}

function StatCard({ title, value, tone }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-card ${tone}`}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <p className="text-sm text-white/85">{title}</p>
            <p className="mt-1 text-[42px] leading-none font-bold">{value}</p>
        </div>
    );
}

function Field({ label, value, onChange, error, type = 'text', placeholder = '' }) {
    return <label className="block"><span className="text-sm font-medium">{label}</span><input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />{error && <span className="text-xs text-destructive mt-1 block">{error}</span>}</label>;
}

function SelectField({ label, value, onChange, error, children }) {
    return <label className="block"><span className="text-sm font-medium">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">{children}</select>{error && <span className="text-xs text-destructive mt-1 block">{error}</span>}</label>;
}

function parseTags(raw) {
    if (!raw) return [];
    return [...new Set(String(raw).split(',').map((item) => item.trim()).filter((item) => item !== ''))];
}

