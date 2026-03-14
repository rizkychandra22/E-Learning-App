import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Trash2, X, Search, Tags } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
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
    active: { label: 'Active', progress: 70 },
    archived: { label: 'Archived', progress: 100 },
};

export default function MyCourses({ courses, jurusans, categories, filters, migrationRequired, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category ?? 'all');
    const [editingId, setEditingId] = useState(null);

    const form = useForm(emptyForm);
    const isEditing = editingId !== null;
    const selectedCourse = useMemo(() => courses.find((item) => item.id === editingId) ?? null, [courses, editingId]);

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
    };

    const submitForm = (event) => {
        event.preventDefault();

        const payload = (data) => ({
            ...data,
            tags: parseTags(data.tags),
        });

        if (isEditing) {
            form.transform(payload).put(`/my-courses/${editingId}`, { preserveScroll: true });
            return;
        }

        form.transform(payload).post('/my-courses', { preserveScroll: true });
    };

    const destroyCourse = (course) => {
        if (!window.confirm(`Hapus kursus "${course.title}"?`)) return;
        router.delete(`/my-courses/${course.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kursus Saya" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Kursus Saya" description="Kelola kursus yang Anda ampu tanpa mengubah gaya tampilan katalog." />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <BookOpen className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <BookOpen className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel kursus belum tersedia.</p>
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
                                        placeholder="Cari judul / kode kursus..."
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
                                    <option value="archived">Archived</option>
                                </select>
                                <select
                                    value={categoryFilter}
                                    onChange={(event) => setCategoryFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-48 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">Semua Kategori</option>
                                    {(categories ?? []).map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                                <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Filter</button>
                                <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                            </form>
                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                            {courses.length === 0 && (
                                <div className="col-span-full text-sm text-muted-foreground text-center py-12">Belum ada kursus untuk Anda.</div>
                            )}
                            {courses.map((course, index) => {
                                const meta = statusMeta[course.status] ?? statusMeta.draft;
                                return (
                                    <div
                                        key={course.id}
                                        className="bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-card-lg transition-all duration-300 animate-fade-in group"
                                        style={{ animationDelay: `${index * 60}ms` }}
                                    >
                                        <div className={cn('h-28 flex items-end p-4', gradients[index % gradients.length])}>
                                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-background/20 text-primary-foreground backdrop-blur-sm">
                                                {course.category || 'Kursus'}
                                            </span>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold group-hover:text-primary transition-colors truncate">{course.title}</h3>
                                                    <p className="text-xs text-muted-foreground truncate">{course.code}</p>
                                                </div>
                                                <span className="text-[11px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">{course.status}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course.credit_hours ?? 0} SKS</span>
                                                <span>Semester {course.semester ?? '-'}</span>
                                                <span>{course.materials_count ?? 0} Materi</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">Status</span>
                                                    <span className="font-medium">{meta.label}</span>
                                                </div>
                                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                                    <div className={cn('h-full rounded-full', gradients[index % gradients.length])} style={{ width: `${meta.progress}%` }} />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {(course.tags ?? []).length > 0 ? course.tags.map((tag) => (
                                                    <span key={`${course.id}-${tag}`} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                                                        <Tags className="w-3 h-3" />
                                                        {tag}
                                                    </span>
                                                )) : <span className="text-xs text-muted-foreground">Tanpa tag</span>}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                                                <button
                                                    type="button"
                                                    onClick={() => beginEdit(course)}
                                                    disabled={course.is_mock || mocked}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium disabled:opacity-60"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => destroyCourse(course)}
                                                    disabled={course.is_mock || mocked}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium disabled:opacity-60"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl shadow-card p-5 h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">{isEditing ? 'Edit Kursus' : 'Tambah Kursus'}</h2>
                            {isEditing && (
                                <button type="button" onClick={beginCreate} className="p-1.5 rounded-md hover:bg-secondary" aria-label="Batalkan edit">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {isEditing && selectedCourse && (
                            <p className="text-xs text-muted-foreground mb-4">
                                Mengubah kursus <span className="font-medium text-foreground">{selectedCourse.title}</span>
                            </p>
                        )}

                        <form onSubmit={submitForm} className="space-y-3">
                            <Field label="Judul Kursus" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                            <Field label="Kode Kursus" value={form.data.code} error={form.errors.code} onChange={(value) => form.setData('code', value)} />
                            <Field label="Kategori" value={form.data.category} error={form.errors.category} onChange={(value) => form.setData('category', value)} placeholder="Contoh: Pemrograman Web" />
                            <Field label="Tags" value={form.data.tags} error={form.errors.tags} onChange={(value) => form.setData('tags', value)} placeholder="Pisahkan dengan koma, contoh: react, laravel" />
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
                            <SelectField label="Jurusan" value={form.data.jurusan_id} onChange={(value) => form.setData('jurusan_id', value)} error={form.errors.jurusan_id}>
                                <option value="">Pilih Jurusan</option>
                                {jurusans.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.fakultas?.name ?? '-'})
                                    </option>
                                ))}
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
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                </SelectField>
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing || migrationRequired || mocked}
                                className="w-full inline-flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                            >
                                <Plus className="w-4 h-4" />
                                {isEditing ? 'Simpan Perubahan' : 'Tambah Kursus'}
                            </button>
                        </form>
                    </div>
                </div>
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

function parseTags(raw) {
    if (!raw) return [];

    return [...new Set(
        String(raw)
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== ''),
    )];
}
