import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Download, FileText, Filter, FolderOpen, Search } from 'lucide-react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'panel-card p-4',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

export default function StudentMaterials({ materials = [], courses = [], migrationRequired = false, filters = {} }) {
    const { user } = useAuth();
    const { props } = usePage();
    if (!user) return null;

    const [search, setSearch] = useState(filters?.search ?? '');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');

    const intlLocale = toIntlLocale(props?.system?.default_language);
    const today = useMemo(
        () =>
            new Intl.DateTimeFormat(intlLocale, {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            }).format(new Date()),
        [intlLocale]
    );

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

    const selectedCourse = useMemo(() => courses.find((item) => String(item.id) === String(courseFilter)) ?? null, [courses, courseFilter]);

    return (
        <ProtectedLayout>
            <Head title="Materi" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner
                    title="Materi"
                    description="Akses materi kuliah berdasarkan mata kuliah yang Anda ikuti."
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <BookOpen className="w-3.5 h-3.5" />
                            {materials.length} materi tampil
                        </span>
                        <span className={UI.chip}>
                            <FolderOpen className="w-3.5 h-3.5" />
                            {courses.length} mata kuliah
                        </span>
                    </div>
                    <Link href="/my-courses" className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Buka Mata Kuliah Saya
                    </Link>
                </div>

                {migrationRequired && (
                    <div className={cn(UI.panel, 'text-sm text-warning border-warning/40 bg-warning/10')}>
                        Tabel courses/materials belum tersedia. Jalankan migrasi terlebih dahulu.
                    </div>
                )}

                <section className="panel-card p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Mata Kuliah Saya</h2>
                        <span className={UI.chip}>
                            <Filter className="w-3.5 h-3.5" />
                            Pilih mata kuliah untuk melihat materi spesifik
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {courses.map((course) => {
                            const isActive = String(course.id) === String(courseFilter);
                            const materialCount = Number(course.materials_count ?? 0);
                            return (
                                <button
                                    key={course.id}
                                    type="button"
                                    onClick={() => openCourseMaterials(course.id)}
                                    className={`panel-subcard p-4 space-y-3 border text-left transition ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'}`}
                                >
                                    <div>
                                        <p className="text-xs text-muted-foreground">{course.code ?? '-'}</p>
                                        <h3 className="font-semibold leading-tight">{course.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {course.category || 'Tanpa kategori'}
                                            {' · '}
                                            Semester {course.semester ?? '-'}
                                        </p>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" />
                                        {materialCount} materi
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {courses.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Belum ada mata kuliah terdaftar untuk akun ini.</p>}
                </section>

                <section className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border space-y-3">
                        <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari materi..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
                                />
                            </div>
                            <button type="submit" className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Filter</button>
                            <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Reset</button>
                        </form>
                        <p className="text-xs text-muted-foreground">
                            {selectedCourse ? `Menampilkan materi untuk: ${selectedCourse.title}` : 'Menampilkan materi dari semua mata kuliah yang Anda ikuti.'}
                        </p>
                    </div>

                    <div className="p-4 space-y-3">
                        {materials.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">Belum ada materi untuk filter saat ini.</div>}
                        {materials.map((material) => (
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
                                    <a
                                        href={`/materials/${material.id}/download`}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sky-500 hover:bg-sky-500/10"
                                        title="Unduh"
                                        aria-label="Unduh"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </ProtectedLayout>
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
