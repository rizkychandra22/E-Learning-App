import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Upload, Download, BookOpen, Users, Star, Clock3 } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { StatCard } from '@/components/StatCard';
import { CreateFormModal } from '@/components/CreateFormModal';
import { ActionIconButton } from '@/components/ActionIconButton';

const emptyForm = {
    title: '',
    code: '',
    description: '',
    category: '',
    tags: '',
    jurusan_id: '',
    lecturer_id: '',
    level: 'dasar',
    semester: '',
    credit_hours: 2,
    status: 'draft',
};

const statusChip = {
    draft: 'bg-warning/20 text-warning',
    active: 'bg-success/15 text-success',
    archived: 'bg-secondary text-secondary-foreground',
};

const levelChip = {
    dasar: 'bg-info/15 text-info',
    menengah: 'bg-warning/20 text-warning',
    lanjutan: 'bg-destructive/15 text-destructive',
};

function parseTags(raw) {
    if (!raw) return [];
    return [...new Set(String(raw).split(',').map((item) => item.trim()).filter(Boolean))];
}

function formatBytes(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const sized = value / (1024 ** index);
    return `${sized.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function ManageCourses({ courses, jurusans, lecturers, migrationRequired, materialsMigrationRequired, filters, categories, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category ?? 'all');
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm(emptyForm);
    const materialForm = useForm({ title: '', file: null });

    const isEditing = editingId !== null;
    const selectedCourse = useMemo(() => courses.find((item) => item.id === editingId) ?? null, [courses, editingId]);

    const stats = useMemo(() => {
        const total = courses.length;
        const active = courses.filter((item) => item.status === 'active').length;
        const draft = courses.filter((item) => item.status === 'draft').length;
        const participantTotal = courses.reduce((sum, item, idx) => sum + ((item.students_count ?? (idx + 2) * 40) || 0), 0);
        return { total, active, draft, participantTotal };
    }, [courses]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/manage-courses', { search, status: statusFilter, category: categoryFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        setCategoryFilter('all');
        router.get('/manage-courses', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        setShowForm(true);
        form.setData(emptyForm);
        form.clearErrors();
        materialForm.reset();
    };

    const beginEdit = (course) => {
        setEditingId(course.id);
        setShowForm(true);
        form.setData({
            title: course.title ?? '',
            code: course.code ?? '',
            description: course.description ?? '',
            category: course.category ?? '',
            tags: Array.isArray(course.tags) ? course.tags.join(', ') : '',
            jurusan_id: course.jurusan_id ? String(course.jurusan_id) : '',
            lecturer_id: course.lecturer_id ? String(course.lecturer_id) : '',
            level: course.level ?? 'dasar',
            semester: course.semester ?? '',
            credit_hours: course.credit_hours ?? 2,
            status: course.status ?? 'draft',
        });
        form.clearErrors();
    };

    const closeForm = () => {
        setEditingId(null);
        setShowForm(false);
        form.setData(emptyForm);
        form.clearErrors();
        materialForm.reset();
    };

    const submitForm = (event) => {
        event.preventDefault();
        const transformPayload = (data) => ({ ...data, tags: parseTags(data.tags) });

        if (isEditing) {
            form.transform(transformPayload).put(`/manage-courses/${editingId}`, { preserveScroll: true });
            return;
        }

        form.transform(transformPayload).post('/manage-courses', { preserveScroll: true });
    };

    const destroyCourse = (course) => {
        if (!window.confirm(`Hapus kursus "${course.title}"?`)) return;
        router.delete(`/manage-courses/${course.id}`, { preserveScroll: true });
    };

    const submitMaterial = (event) => {
        event.preventDefault();
        if (!editingId) return;

        materialForm.post(`/manage-courses/${editingId}/materials`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => materialForm.reset(),
        });
    };

    const destroyMaterial = (material) => {
        if (!editingId) return;
        if (!window.confirm(`Hapus materi "${material.title}"?`)) return;
        router.delete(`/manage-courses/${editingId}/materials/${material.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kelola Kursus" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Kelola Kursus" description="Manajemen seluruh kursus yang tersedia di platform" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Kursus" value={stats.total} icon={BookOpen} gradient="primary" />
                    <StatCard title="Aktif" value={stats.active} icon={BookOpen} gradient="success" />
                    <StatCard title="Draft" value={stats.draft} icon={BookOpen} gradient="warm" />
                    <StatCard title="Total Peserta" value={new Intl.NumberFormat('id-ID').format(stats.participantTotal)} icon={Users} gradient="accent" />
                </div>

                <section className="panel-card p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                        <h3 className="font-semibold text-2xl">Daftar Kursus</h3>
                        <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
                            <div className="inline-flex items-center rounded-lg border border-border bg-background p-1 overflow-x-auto">
                                {['all', 'active', 'draft', 'archived'].map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter(status);
                                            router.get('/manage-courses', { search, status, category: categoryFilter }, { preserveState: true, preserveScroll: true, replace: true });
                                        }}
                                        className={`px-2.5 py-1.5 whitespace-nowrap rounded-md text-xs font-medium transition-colors ${statusFilter === status ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={submitFilter} className="relative w-full md:w-56">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari kursus..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </form>

                            <select
                                value={categoryFilter}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setCategoryFilter(value);
                                    router.get('/manage-courses', { search, status: statusFilter, category: value }, { preserveState: true, preserveScroll: true, replace: true });
                                }}
                                className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                            >
                                <option value="all">Semua Kategori</option>
                                {(categories ?? []).map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>

                            <button type="button" onClick={beginCreate} disabled={mocked || migrationRequired} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
                                <Plus className="w-4 h-4" /> Tambah
                            </button>
                        </div>
                    </div>

                    <CreateFormModal
                        open={showForm}
                        title={isEditing ? 'Edit Kursus' : 'Tambah Kursus'}
                        onClose={closeForm}
                        onSubmit={submitForm}
                        submitLabel="Simpan"
                        processing={form.processing}
                        disableSubmit={mocked || migrationRequired}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Nama Kursus" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                            <Field label="Kode Kursus" value={form.data.code} error={form.errors.code} onChange={(value) => form.setData('code', value)} />
                            <Field label="Kategori" value={form.data.category} error={form.errors.category} onChange={(value) => form.setData('category', value)} />
                            <Field label="Tags" value={form.data.tags} error={form.errors.tags} onChange={(value) => form.setData('tags', value)} placeholder="react, laravel" />
                            <SelectField label="Program Studi" value={form.data.jurusan_id} error={form.errors.jurusan_id} onChange={(value) => form.setData('jurusan_id', value)}>
                                <option value="">Pilih Jurusan</option>
                                {jurusans.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </SelectField>
                            <SelectField label="Dosen Pengampu" value={form.data.lecturer_id} error={form.errors.lecturer_id} onChange={(value) => form.setData('lecturer_id', value)}>
                                <option value="">Pilih Dosen</option>
                                {lecturers.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </SelectField>
                            <SelectField label="Level" value={form.data.level} error={form.errors.level} onChange={(value) => form.setData('level', value)}>
                                <option value="dasar">Pemula</option>
                                <option value="menengah">Menengah</option>
                                <option value="lanjutan">Lanjutan</option>
                            </SelectField>
                            <SelectField label="Status" value={form.data.status} error={form.errors.status} onChange={(value) => form.setData('status', value)}>
                                <option value="draft">Draft</option>
                                <option value="active">Aktif</option>
                                <option value="archived">Arsip</option>
                            </SelectField>
                            <Field label="Semester" type="number" value={form.data.semester} error={form.errors.semester} onChange={(value) => form.setData('semester', value)} />
                            <Field label="SKS" type="number" value={form.data.credit_hours} error={form.errors.credit_hours} onChange={(value) => form.setData('credit_hours', value)} />
                            <label className="md:col-span-2 block">
                                <span className="text-sm font-medium">Deskripsi</span>
                                <textarea
                                    rows={3}
                                    value={form.data.description}
                                    onChange={(event) => form.setData('description', event.target.value)}
                                    className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                                />
                            </label>
                        </div>
                    </CreateFormModal>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        {courses.map((course, idx) => {
                            const participant = course.students_count ?? (idx + 2) * 40;
                            const rating = (4.5 + ((idx % 4) * 0.1)).toFixed(1);
                            const duration = `${(course.credit_hours ?? 2) * 6}j`;
                            return (
                                <article key={course.id} className="panel-subcard p-3.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="w-9 h-9 rounded-xl gradient-primary text-primary-foreground grid place-items-center">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div className="flex gap-1">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${statusChip[course.status] ?? 'bg-secondary text-secondary-foreground'}`}>{course.status === 'active' ? 'Aktif' : course.status === 'draft' ? 'Draft' : 'Arsip'}</span>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${levelChip[course.level] ?? 'bg-secondary text-secondary-foreground'}`}>{course.level === 'dasar' ? 'Pemula' : course.level === 'menengah' ? 'Menengah' : 'Lanjutan'}</span>
                                        </div>
                                    </div>
                                    <h4 className="mt-3 font-semibold text-lg leading-tight">{course.title}</h4>
                                    <p className="text-sm text-muted-foreground">{course.lecturer?.name ?? '-' } · {course.category || '-'}</p>
                                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {participant}</span>
                                        <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-warning" /> {rating}</span>
                                        <span className="inline-flex items-center gap-1"><Clock3 className="w-3 h-3" /> {duration}</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <ActionIconButton icon={Pencil} label="Edit" tone="primary" onClick={() => beginEdit(course)} disabled={mocked || course.is_mock} />
                                        <ActionIconButton icon={Trash2} label="Hapus" tone="danger" onClick={() => destroyCourse(course)} disabled={mocked || course.is_mock} />
                                    </div>
                                </article>
                            );
                        })}
                        {courses.length === 0 && <div className="xl:col-span-3 text-sm text-muted-foreground p-6 text-center">Belum ada kursus.</div>}
                    </div>
                </section>

                {isEditing && (
                    <section className="panel-card p-4">
                        <h3 className="font-semibold text-xl mb-3">Materi Kursus: {selectedCourse?.title}</h3>

                        <form onSubmit={submitMaterial} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-4">
                            <Field label="Judul Materi" value={materialForm.data.title} error={materialForm.errors.title} onChange={(value) => materialForm.setData('title', value)} />
                            <label className="block">
                                <span className="text-sm font-medium">File</span>
                                <input type="file" onChange={(event) => materialForm.setData('file', event.target.files?.[0] ?? null)} className="mt-1 w-full text-sm rounded-lg border border-border bg-background px-3 py-2" />
                            </label>
                            <button type="submit" disabled={materialForm.processing || materialsMigrationRequired || mocked} className="self-end inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"><Upload className="w-4 h-4" />Upload</button>
                        </form>

                        <div className="space-y-2">
                            {(selectedCourse?.materials ?? []).map((material) => (
                                <div key={material.id} className="panel-subcard p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium">{material.title}</p>
                                        <p className="text-xs text-muted-foreground">{material.file_name} · {formatBytes(material.file_size)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={mocked || material.is_mock ? undefined : `/manage-courses/${editingId}/materials/${material.id}/download`}
                                            onClick={(event) => {
                                                if (mocked || material.is_mock) event.preventDefault();
                                            }}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sky-500 hover:bg-sky-500/10"
                                            title="Unduh"
                                            aria-label="Unduh"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                        <ActionIconButton icon={Trash2} label="Hapus" tone="danger" onClick={() => destroyMaterial(material)} disabled={mocked || material.is_mock} />
                                    </div>
                                </div>
                            ))}
                            {(selectedCourse?.materials ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum ada materi kursus.</p>}
                        </div>
                    </section>
                )}
            </div>
        </ProtectedLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text', placeholder = '' }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function SelectField({ label, value, onChange, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {children}
            </select>
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}
