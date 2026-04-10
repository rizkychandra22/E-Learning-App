import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { CalendarCheck2, Clock3, Search } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

export default function StudentAttendance({ courses = [], records = [], summary = {}, filters = {}, migrationRequired = {} }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');

    const cards = useMemo(() => ([
        { title: 'Total Sesi', value: summary?.total_sessions ?? 0, tone: 'gradient-primary' },
        { title: 'Sudah Hadir', value: summary?.attended_sessions ?? 0, tone: 'gradient-success' },
        { title: 'Sedang Dibuka', value: summary?.open_sessions ?? 0, tone: 'gradient-warm' },
        { title: 'Terlewat', value: summary?.missed_sessions ?? 0, tone: 'bg-gradient-to-r from-rose-500 to-red-600' },
    ]), [summary]);

    const hasMigrationIssue = Boolean(migrationRequired?.sessions || migrationRequired?.records || migrationRequired?.enrollments);

    const submitFilter = (event) => {
        event.preventDefault();
        router.get('/attendance', { search, course: courseFilter }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setSearch('');
        setCourseFilter('');
        router.get('/attendance', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitCheckIn = (sessionId) => {
        router.post(`/attendance/${sessionId}/check-in`, {}, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Absensi" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Absensi" description="Lakukan absensi per pertemuan sesuai jadwal dari dosen." />

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {cards.map((card) => (
                        <StatCard key={card.title} title={card.title} value={card.value} tone={card.tone} />
                    ))}
                </div>

                <section className="panel-card overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <form onSubmit={submitFilter} className="flex flex-col lg:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari materi atau judul sesi absensi..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
                                />
                            </div>
                            <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-64">
                                <option value="">Semua mata kuliah</option>
                                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                            </select>
                            <button type="submit" className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Filter</button>
                            <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Reset</button>
                        </form>
                    </div>

                    {hasMigrationIssue && (
                        <div className="mx-4 mt-4 rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                            Fitur absensi belum aktif karena tabel attendance belum tersedia. Jalankan migrasi terlebih dahulu.
                        </div>
                    )}

                    <div className="p-4 space-y-3">
                        {records.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-10">Belum ada sesi absensi untuk mata kuliah Anda.</p>
                        )}

                        {records.map((item) => (
                            <div key={item.session_id} className="panel-subcard p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{item.material_title}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {item.course_title}
                                        {item.meeting_number ? ` · Pertemuan ${item.meeting_number}` : ''}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                                        <Clock3 className="w-3.5 h-3.5" />
                                        {formatDate(item.opens_at)} - {formatDate(item.closes_at)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={item.status} />
                                    {item.can_check_in ? (
                                        <button
                                            type="button"
                                            onClick={() => submitCheckIn(item.session_id)}
                                            className="inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                                        >
                                            <CalendarCheck2 className="w-3.5 h-3.5" />
                                            Hadir
                                        </button>
                                    ) : (
                                        <button type="button" disabled className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                                            <CalendarCheck2 className="w-3.5 h-3.5" />
                                            {item.status === 'attended' ? 'Sudah Hadir' : 'Tidak Tersedia'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
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

function StatusBadge({ status }) {
    const config = {
        attended: { label: 'Sudah Hadir', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
        open: { label: 'Dibuka', className: 'bg-primary/10 text-primary' },
        upcoming: { label: 'Belum Dibuka', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
        missed: { label: 'Terlewat', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-300' },
    };

    const item = config[status] ?? config.upcoming;
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${item.className}`}>{item.label}</span>;
}

function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

