import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Download, Search, Trash2, Upload, FolderOpen } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';
import { DataCardList, DataCard, CardField, CardActions, CardBadge } from '@/components/DataCardList';

const emptyForm = {
    course_id: '',
    title: '',
    file: null,
};

export default function Materials({ materials, courses, migrationRequired, filters, mocked }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');

    const form = useForm(emptyForm);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/materials', { search, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setCourseFilter('');
        router.get('/materials', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitForm = (event) => {
        event.preventDefault();

        form.post('/materials', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
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
                <PageHeroBanner title="Materi" description="Unggah, kelola, dan distribusikan materi pembelajaran untuk kursus Anda." />

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
                        <FolderOpen className="w-5 h-5 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Tabel materi belum tersedia.</p>
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
                                        placeholder="Cari judul / nama file..."
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>
                                <select
                                    value={courseFilter}
                                    onChange={(event) => setCourseFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-56 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                                items={materials}
                                emptyText="Belum ada materi yang diunggah."
                                renderCard={(material) => (
                                    <DataCard key={material.id} accentColor="hsl(var(--primary))">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">{material.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{material.file_name}</p>
                                                </div>
                                                <CardBadge className="bg-primary/15 text-primary">Materi</CardBadge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <CardField label="Kursus" value={material.course?.title ?? '-'} />
                                                <CardField label="Ukuran" value={formatBytes(material.file_size)} />
                                                <CardField label="Diunggah" value={formatDate(material.created_at)} />
                                            </div>
                                        </div>
                                        <CardActions>
                                            <a
                                                href={material.is_mock || mocked ? undefined : `/materials/${material.id}/download`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium"
                                                onClick={(event) => {
                                                    if (material.is_mock || mocked) event.preventDefault();
                                                }}
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Unduh
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => destroyMaterial(material)}
                                                disabled={material.is_mock || mocked}
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

                    <div className="panel-card p-4 h-fit">
                        <h2 className="font-semibold mb-4">Upload Materi</h2>
                        <form onSubmit={submitForm} className="space-y-3">
                            <SelectField label="Pilih Kursus" value={form.data.course_id} onChange={(value) => form.setData('course_id', value)} error={form.errors.course_id}>
                                <option value="">Pilih Kursus</option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </SelectField>
                            <Field label="Judul Materi" value={form.data.title} error={form.errors.title} onChange={(value) => form.setData('title', value)} />
                            <label className="block">
                                <span className="text-sm font-medium">File Materi</span>
                                <input
                                    type="file"
                                    onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)}
                                    className="mt-1 w-full text-sm rounded-lg border border-border bg-background px-3 py-2 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary/15 file:text-primary"
                                />
                                {form.errors.file && <span className="text-xs text-destructive mt-1 block">{form.errors.file}</span>}
                                <span className="text-[11px] text-muted-foreground mt-1 block">Format: PDF, Office, TXT, ZIP/RAR, MP4/MOV/MKV/AVI/WEBM, MP3/WAV</span>
                            </label>

                            <button
                                type="submit"
                                disabled={form.processing || migrationRequired || mocked}
                                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Materi
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


