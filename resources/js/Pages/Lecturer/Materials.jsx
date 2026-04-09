import { Head, Link, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { BookOpen, Download, FileText, Layers3, Search, Trash2, Upload } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { CreateFormModal } from '@/components/CreateFormModal';
import { ActionIconButton } from '@/components/ActionIconButton';

const emptyForm = {
    course_id: '',
    title: '',
    meeting_number: '',
    file: null,
};

export default function Materials({ materials, courses, migrationRequired, filters, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');
    const [showForm, setShowForm] = useState(false);
    const form = useForm(emptyForm);

    const summary = useMemo(() => {
        const total = materials.length;
        const videos = materials.filter((item) => /mp4|mov|avi|mkv|webm/i.test(item.file_name ?? '')).length;
        const docs = total - videos;
        return { total, videos, docs };
    }, [materials]);

    const selectedCourse = useMemo(() => courses.find((item) => String(item.id) === String(courseFilter)) ?? null, [courses, courseFilter]);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/materials', { search, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const openCourseMaterials = (courseId) => {
        setCourseFilter(String(courseId));
        router.get('/materials', { search, course: courseId }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setCourseFilter('');
        router.get('/materials', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const openUpload = () => {
        setShowForm(true);
        form.clearErrors();
        form.setData((current) => ({
            ...current,
            course_id: courseFilter || current.course_id || '',
        }));
    };

    const closeForm = () => {
        setShowForm(false);
        form.reset();
        form.clearErrors();
    };

    const submitForm = (event) => {
        event.preventDefault();
        form.post('/materials', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: closeForm,
        });
    };

    const destroyMaterial = (material) => {
        if (!window.confirm(`Hapus materi "${material.title}"?`)) return;
        router.delete(`/materials/${material.id}`, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Materi" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Materi" description="Kelola konten pembelajaran berdasarkan mata kuliah yang Anda ampu" />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <StatCard title="Total Materi" value={summary.total} tone="gradient-primary" />
                    <StatCard title="Video" value={summary.videos} tone="bg-gradient-to-r from-rose-500 to-pink-600" />
                    <StatCard title="Dokumen" value={summary.docs} tone="bg-gradient-to-r from-sky-500 to-blue-600" />
                </div>

                <section className="panel-card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Pilih Mata Kuliah</h2>
                        <Link href="/my-courses" className="text-xs font-medium text-primary hover:opacity-80 inline-flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" /> Buka Mata Kuliah Saya
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {courses.map((course) => {
                            const isActive = String(course.id) === String(courseFilter);
                            const materialCount = Number(course.materials_count ?? 0);
                            return (
                                <div key={course.id} className={`panel-subcard p-4 space-y-3 border ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{course.code ?? '-'}</p>
                                        <h3 className="font-semibold leading-tight">{course.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">{course.category || 'Tanpa kategori'} · Semester {course.semester ?? '-'}</p>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" />
                                        {materialCount} materi
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openCourseMaterials(course.id)}
                                            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium ${isActive ? 'gradient-primary text-primary-foreground' : 'border border-border bg-background hover:bg-secondary'}`}
                                        >
                                            <Layers3 className="w-3.5 h-3.5" />
                                            Kelola Materi
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {courses.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Belum ada mata kuliah untuk dosen ini.</p>}
                </section>

                <section className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border space-y-3">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                            <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari materi di mata kuliah terpilih..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm" />
                                </div>
                                <button type="submit" className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Filter</button>
                                <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Reset</button>
                            </form>
                            <button type="button" onClick={openUpload} disabled={migrationRequired || mocked} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
                                <Upload className="w-4 h-4" /> Upload Materi
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {selectedCourse ? `Sedang menampilkan materi untuk: ${selectedCourse.title}` : 'Pilih mata kuliah dulu dari card di atas untuk fokus kelola materi.'}
                        </p>
                    </div>

                    <div className="p-4 space-y-3">
                        {!courseFilter && <div className="text-sm text-muted-foreground text-center py-10">Pilih mata kuliah agar materi ditampilkan per kelompok mata kuliah.</div>}
                        {courseFilter && materials.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">Belum ada materi pada mata kuliah ini.</div>}
                        {courseFilter && materials.map((material) => (
                            <div key={material.id} className="panel-subcard p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{material.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {material.course?.title ?? '-'}
                                        {material.meeting_number ? ` · Pertemuan ${material.meeting_number}` : ''}
                                        {' · '}
                                        {material.file_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{formatBytes(material.file_size)} · {formatDate(material.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{detectType(material.file_name)}</span>
                                    <a href={material.is_mock || mocked ? undefined : `/materials/${material.id}/download`} onClick={(event) => { if (material.is_mock || mocked) event.preventDefault(); }} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sky-500 hover:bg-sky-500/10" title="Unduh" aria-label="Unduh"><Download className="w-4 h-4" /></a>
                                    <ActionIconButton icon={Trash2} label="Hapus" tone="danger" onClick={() => destroyMaterial(material)} disabled={material.is_mock || mocked} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <CreateFormModal
                    open={showForm}
                    title="Upload Materi"
                    onClose={closeForm}
                    onSubmit={submitForm}
                    submitLabel="Upload"
                    processing={form.processing}
                    disableSubmit={migrationRequired || mocked}
                    maxWidthClass="max-w-2xl"
                >
                    <div className="space-y-3">
                        <SelectField label="Pilih Mata Kuliah" value={form.data.course_id} onChange={(value) => form.setData('course_id', value)} error={form.errors.course_id}>
                            <option value="">Pilih Mata Kuliah</option>
                            {courses.map((course) => (<option key={course.id} value={course.id}>{course.title}</option>))}
                        </SelectField>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="Judul Materi" value={form.data.title} onChange={(value) => form.setData('title', value)} error={form.errors.title} />
                            <Field label="Pertemuan Ke-" type="number" value={form.data.meeting_number} onChange={(value) => form.setData('meeting_number', value)} error={form.errors.meeting_number} />
                        </div>
                        <label className="block">
                            <span className="text-sm font-medium">File Materi</span>
                            <input type="file" onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)} className="mt-1 w-full text-sm rounded-lg border border-border bg-background px-3 py-2 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary/15 file:text-primary" />
                            {form.errors.file && <span className="text-xs text-destructive mt-1 block">{form.errors.file}</span>}
                        </label>
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

function Field({ label, value, onChange, error, type = 'text' }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function SelectField({ label, value, onChange, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium">{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {children}
            </select>
            {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
        </label>
    );
}

function detectType(fileName = '') {
    const lower = String(fileName).toLowerCase();
    if (/mp4|mov|avi|mkv|webm/.test(lower)) return 'Video';
    if (/url|http/.test(lower)) return 'Link';
    return 'Dokumen';
}

function formatBytes(bytes) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const sized = value / (1024 ** index);
    return `${sized.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID');
}



