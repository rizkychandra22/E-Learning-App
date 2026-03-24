import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, TriangleAlert, Tags, Upload, Download, FolderOpen } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardBadge, CardField, CardActions } from '@/components/DataCardList';

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

const statusBadge = {
    draft: 'bg-warning/20 text-warning',
    active: 'bg-success/15 text-success',
    archived: 'bg-secondary text-secondary-foreground',
};

export default function ManageCourses({ courses, jurusans, lecturers, migrationRequired, materialsMigrationRequired, filters, categories, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category ?? 'all');
    const [editingId, setEditingId] = useState(null);

    const form = useForm(emptyForm);
    const materialForm = useForm({
        title: '',
        file: null,
    });

    const isEditing = editingId !== null;
    const selectedCourse = useMemo(() => courses.find((item) => item.id === editingId) ?? null, [courses, editingId]);
    const selectedCourseMaterials = selectedCourse?.materials ?? [];

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/manage-courses', {
            search,
            status: statusFilter,
            category: categoryFilter,
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        setCategoryFilter('all');
        router.get('/manage-courses', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const beginCreate = () => {
        setEditingId(null);
        form.setData(emptyForm);
        form.clearErrors();
        materialForm.reset();
        materialForm.clearErrors();
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
            lecturer_id: course.lecturer_id ? String(course.lecturer_id) : '',
            level: course.level ?? 'dasar',
            semester: course.semester ?? '',
            credit_hours: course.credit_hours ?? 2,
            status: course.status ?? 'draft',
        });
        form.clearErrors();
        materialForm.reset();
        materialForm.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();

        const payload = (data) => ({
            ...data,
            tags: parseTags(data.tags),
        });

        if (isEditing) {
            form.transform(payload).put(`/manage-courses/${editingId}`, { preserveScroll: true });
            return;
        }

        form.transform(payload).post('/manage-courses', { preserveScroll: true });
    };

    const destroyCourse = (course) => {
        if (!window.confirm(`Hapus kursus "${course.title}"? Semua materi di dalamnya juga akan terhapus.`)) return;
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
                <PageHeroBanner title="Kelola Kursus" description="Atur data kursus, kategori, tagging, dan unggah materi pembelajaran dalam satu alur kerja." />

                {mocked && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-info/30 bg-info/10 text-info">
                        <FolderOpen className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Mode data mock aktif.</p>
                            <p>Data hanya contoh untuk review tampilan. CRUD dinonaktifkan.</p>
                        </div>
                    </div>
                )}

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel kursus belum tersedia.</p>
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

                        <div className="p-4">
                            <DataCardList
                                items={courses}
                                emptyText="Belum ada data kursus."
                                renderCard={(course) => (
                                    <DataCard key={course.id} accentColor={`hsl(var(--primary))`}>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold">{course.title}</p>
                                                    <p className="text-xs text-muted-foreground">{course.code}</p>
                                                </div>
                                                <CardBadge className={statusBadge[course.status] ?? 'bg-secondary text-secondary-foreground'}>{course.status}</CardBadge>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <CardField label="Dosen" value={course.lecturer?.name ?? '-'} />
                                                <CardField label="Semester" value={course.semester ?? '-'} />
                                                <CardField label="SKS" value={course.credit_hours} />
                                                <CardField label="Materi" value={`${(course.materials ?? []).length} file`} />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                                    <FolderOpen className="w-3 h-3" />
                                                    {course.category || '-'}
                                                </span>
                                                {(course.tags ?? []).length > 0 ? (course.tags ?? []).map((tag) => (
                                                    <span key={`${course.id}-${tag}`} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                                                        <Tags className="w-3 h-3" />
                                                        {tag}
                                                    </span>
                                                )) : <span className="text-xs text-muted-foreground">Tanpa tag</span>}
                                            </div>
                                        </div>
                                        <CardActions>
                                            <button
                                                type="button"
                                                onClick={() => beginEdit(course)}
                                                disabled={mocked || course.is_mock}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium disabled:opacity-60"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => destroyCourse(course)}
                                                disabled={mocked || course.is_mock}
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

                    <div className="space-y-4">
                        <div className="panel-card p-4 h-fit">
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
                                <Field label="Tags" value={form.data.tags} error={form.errors.tags} onChange={(value) => form.setData('tags', value)} placeholder="Pisahkan dengan koma, contoh: react, laravel, beginner" />
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
                                <SelectField label="Dosen Pengampu" value={form.data.lecturer_id} onChange={(value) => form.setData('lecturer_id', value)} error={form.errors.lecturer_id}>
                                    <option value="">Pilih Dosen</option>
                                    {lecturers.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.code})
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

                                <button type="submit" disabled={form.processing || migrationRequired || mocked} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                                    <Plus className="w-4 h-4" />
                                    {isEditing ? 'Simpan Perubahan' : 'Tambah Kursus'}
                                </button>
                            </form>
                        </div>

                        <div className="panel-card p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold">Materi Kursus</h2>
                                {isEditing && <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{selectedCourseMaterials.length} file</span>}
                            </div>

                            {!isEditing && (
                                <p className="text-sm text-muted-foreground">Pilih course terlebih dahulu dari tabel untuk mengunggah materi.</p>
                            )}

                            {isEditing && (
                                <div className="space-y-4">
                                    {materialsMigrationRequired && (
                                        <div className="flex items-start gap-2 p-3 rounded-lg border border-warning/40 bg-warning/10 text-warning text-xs">
                                            <TriangleAlert className="w-4 h-4 mt-0.5" />
                                            <p>Tabel materi belum tersedia. Jalankan <code className="font-mono">php artisan migrate</code> dulu.</p>
                                        </div>
                                    )}

                                    {form.errors.materials && (
                                        <p className="text-xs text-destructive">{form.errors.materials}</p>
                                    )}

                                    <form onSubmit={submitMaterial} className="space-y-3 p-3 rounded-lg bg-secondary/40 border border-border">
                                        <Field label="Judul Materi" value={materialForm.data.title} error={materialForm.errors.title} onChange={(value) => materialForm.setData('title', value)} placeholder="Contoh: Pertemuan 1 - Pengenalan" />
                                        <label className="block">
                                            <span className="text-sm font-medium">File Materi</span>
                                            <input
                                                type="file"
                                                onChange={(event) => materialForm.setData('file', event.target.files?.[0] ?? null)}
                                                className="mt-1 w-full text-sm rounded-lg border border-border bg-background px-3 py-2 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary/15 file:text-primary"
                                            />
                                            {materialForm.errors.file && <span className="text-xs text-destructive mt-1 block">{materialForm.errors.file}</span>}
                                            <span className="text-[11px] text-muted-foreground mt-1 block">Format didukung: PDF, Office, TXT, ZIP/RAR, MP4, MOV, MKV, AVI, WEBM, MP3, WAV</span>
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={materialForm.processing || materialsMigrationRequired || mocked}
                                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Upload Materi
                                        </button>
                                    </form>

                                    <div className="space-y-2">
                                        {selectedCourseMaterials.map((material) => (
                                            <div key={material.id} className="rounded-lg border border-border bg-background px-3 py-2.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{material.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{material.file_name}</p>
                                                        <p className="text-[11px] text-muted-foreground mt-1">
                                                            {formatBytes(material.file_size)} • {new Date(material.created_at).toLocaleDateString('id-ID')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        <a
                                                            href={mocked || material.is_mock ? undefined : `/manage-courses/${editingId}/materials/${material.id}/download`}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs"
                                                            onClick={(event) => {
                                                                if (mocked || material.is_mock) {
                                                                    event.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            <Download className="w-3 h-3" />
                                                            Unduh
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => destroyMaterial(material)}
                                                            disabled={mocked || material.is_mock}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/15 text-destructive text-xs disabled:opacity-60"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedCourseMaterials.length === 0 && (
                                            <p className="text-xs text-muted-foreground">Belum ada materi untuk kursus ini.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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

function formatBytes(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const sized = value / (1024 ** index);

    return `${sized.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

