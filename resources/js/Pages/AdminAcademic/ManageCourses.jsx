import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, TriangleAlert } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

const emptyForm = {
    title: '',
    code: '',
    description: '',
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

export default function ManageCourses({ courses, jurusans, lecturers, migrationRequired, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? 'all');
    const [editingId, setEditingId] = useState(null);
    const form = useForm(emptyForm);
    const isEditing = editingId !== null;

    const selectedCourse = useMemo(() => courses.find((item) => item.id === editingId) ?? null, [courses, editingId]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/manage-courses', { search, status: statusFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setStatusFilter('all');
        router.get('/manage-courses', {}, { preserveState: true, preserveScroll: true, replace: true });
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
            jurusan_id: course.jurusan_id ? String(course.jurusan_id) : '',
            lecturer_id: course.lecturer_id ? String(course.lecturer_id) : '',
            level: course.level ?? 'dasar',
            semester: course.semester ?? '',
            credit_hours: course.credit_hours ?? 2,
            status: course.status ?? 'draft',
        });
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();
        if (isEditing) {
            form.put(`/manage-courses/${editingId}`, { preserveScroll: true });
            return;
        }
        form.post('/manage-courses', { preserveScroll: true });
    };

    const destroyCourse = (course) => {
        if (!window.confirm(`Hapus kursus "${course.title}"?`)) return;
        router.delete(`/manage-courses/${course.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kelola Kursus" />
            <div className="space-y-6 max-w-7xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Kelola Kursus</h1>
                    <p className="text-muted-foreground mt-1">Kelola katalog kursus akademik beserta dosen pengampu dan status publikasi</p>
                </div>

                {migrationRequired && (
                    <div className="flex items-start gap-2 p-4 rounded-xl border border-warning/40 bg-warning/10 text-warning">
                        <TriangleAlert className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel kursus belum tersedia.</p>
                            <p>Jalankan migrasi dulu: <code className="font-mono">php artisan migrate</code></p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <form onSubmit={submitFilter} className="flex flex-col md:flex-row gap-2">
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
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                </select>
                                <button type="submit" className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium">Filter</button>
                                <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-secondary/60 transition-colors">Reset</button>
                            </form>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead className="bg-secondary/50 text-left">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Kursus</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Jurusan</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Dosen</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Semester</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">SKS</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course) => (
                                        <tr key={course.id} className="border-t border-border">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium">{course.title}</p>
                                                <p className="text-xs text-muted-foreground">{course.code}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{course.jurusan?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{course.lecturer?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{course.semester ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{course.credit_hours}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[course.status] ?? 'bg-secondary text-secondary-foreground'}`}>
                                                    {course.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button type="button" onClick={() => beginEdit(course)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                    <button type="button" onClick={() => destroyCourse(course)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive text-xs font-medium">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {courses.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                Belum ada data kursus.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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

                            <button type="submit" disabled={form.processing || migrationRequired} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
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
