import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Clock3, Search, Users } from 'lucide-react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

export default function Attendance({ courses, records, summary, filters, migrationRequired }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [courseFilter, setCourseFilter] = useState(filters?.course ? String(filters.course) : '');

    const cards = useMemo(() => ([
        { title: 'Total Mahasiswa', value: summary?.total_students ?? 0, tone: 'gradient-primary' },
        { title: 'Sesi Absensi', value: summary?.total_meetings ?? 0, tone: 'gradient-success' },
        { title: 'Rata-rata Kehadiran', value: `${summary?.average_attendance_percent ?? 0}%`, tone: 'gradient-warm' },
        { title: 'Sesi Aktif', value: records.filter((item) => item.is_active).length, tone: 'bg-gradient-to-r from-sky-500 to-blue-600' },
    ]), [summary, records]);

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

    return (
        <ProtectedLayout>
            <Head title="Absensi" />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title="Absensi" description="Pantau kehadiran mahasiswa per pertemuan secara real-time" />

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
                                    placeholder="Cari judul pertemuan atau modul..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
                                />
                            </div>
                            <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm lg:w-64">
                                <option value="">Pilih mata kuliah</option>
                                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                            </select>
                            <button type="submit" className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Filter</button>
                            <button type="button" onClick={resetFilter} className="px-4 py-2 rounded-lg border border-border bg-background text-sm">Reset</button>
                        </form>
                    </div>

                    {hasMigrationIssue && (
                        <div className="mx-4 mt-4 rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                            Fitur absensi membutuhkan tabel attendance sessions, attendance records, dan enrollment. Jalankan migrasi terlebih dahulu.
                        </div>
                    )}

                    <div className="p-4">
                        {!courseFilter && <p className="text-sm text-muted-foreground text-center py-8">Pilih mata kuliah untuk melihat rekap absensi per pertemuan.</p>}

                        {courseFilter && records.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">Belum ada data absensi untuk mata kuliah ini.</p>
                        )}

                        {courseFilter && records.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[860px] text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                                            <th className="text-left py-3 px-2">Pertemuan</th>
                                            <th className="text-left py-3 px-2">Materi</th>
                                            <th className="text-left py-3 px-2">Jadwal</th>
                                            <th className="text-right py-3 px-2">Hadir</th>
                                            <th className="text-right py-3 px-2">Persentase Hadir</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map((item) => (
                                            <tr key={item.session_id} className="border-b border-border/70 last:border-0">
                                                <td className="py-3 px-2 font-medium">Pertemuan {item.meeting_number || '-'}</td>
                                                <td className="py-3 px-2">{item.material_title}</td>
                                                <td className="py-3 px-2 text-xs text-muted-foreground">
                                                    <div className="inline-flex items-center gap-1">
                                                        <Clock3 className="w-3.5 h-3.5" />
                                                        {formatDate(item.opens_at)} - {formatDate(item.closes_at)}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-right">{item.attended_count}/{item.students_total}</td>
                                                <td className="py-3 px-2 text-right">
                                                    <Badge value={item.attendance_percent} icon={<Users className="w-3.5 h-3.5" />} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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

function Badge({ value, icon }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary">
            {icon}
            {value}%
        </span>
    );
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


