import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Video } from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const FILTERS = ['Semua', 'Kelas', 'Kuis', 'Deadline', 'Ujian'];

const SCHEDULE_GROUPS = [
    {
        day: 'Kamis, 26 Maret',
        items: [
            { title: 'Kelas React JS Fundamental', course: 'React JS Fundamental', time: '09:00 - 11:00', place: 'Zoom Meeting', type: 'Kelas', tone: 'primary' },
        ],
    },
    {
        day: 'Jumat, 27 Maret',
        items: [
            { title: 'Kuis: React Hooks Dasar', course: 'React JS Fundamental', time: '13:00 - 14:00', place: 'Online Platform', type: 'Kuis', tone: 'info' },
            { title: 'Kelas Database Design', course: 'Database Design', time: '15:00 - 17:00', place: 'Ruang 301', type: 'Kelas', tone: 'success' },
        ],
    },
    {
        day: 'Sabtu, 28 Maret',
        badge: 'Hari Ini',
        items: [
            { title: 'Deadline: ERD Database', course: 'Database Design', time: '23:59', place: 'Submission Online', type: 'Deadline', tone: 'destructive' },
        ],
    },
    {
        day: 'Minggu, 29 Maret',
        items: [
            { title: 'Kelas Node.js Advanced', course: 'Node.js Advanced', time: '10:00 - 12:00', place: 'Zoom Meeting', type: 'Kelas', tone: 'info' },
        ],
    },
];

const TYPE_CLASS = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
    destructive: 'bg-destructive/10 text-destructive',
};

function ScheduleItem({ item }) {
    const Icon = item.type === 'Kelas' ? Video : CalendarDays;
    return (
        <div className="panel-subcard p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
                <div className={cn('h-10 w-10 rounded-xl grid place-items-center', TYPE_CLASS[item.tone] ?? TYPE_CLASS.primary)}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.course}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{item.time}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{item.place}</span>
                    </div>
                </div>
            </div>
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', TYPE_CLASS[item.tone] ?? TYPE_CLASS.primary)}>
                {item.type}
            </span>
        </div>
    );
}

export default function StudentSchedule() {
    const { user } = useAuth();
    const { props } = usePage();
    const [activeFilter, setActiveFilter] = useState('Semua');
    if (!user) return null;

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

    const groups = SCHEDULE_GROUPS.map((group) => ({
        ...group,
        items: activeFilter === 'Semua' ? group.items : group.items.filter((item) => item.type === activeFilter),
    })).filter((group) => group.items.length > 0);

    return (
        <ProtectedLayout>
            <Head title="Jadwal" />
            <div className="space-y-6">
                <PageHeroBanner title="Jadwal" description="Pantau jadwal kelas, kuis, deadline, dan ujian agar semua agenda belajar tetap teratur." />

                <div className="flex flex-wrap items-center gap-2">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setActiveFilter(filter)}
                            className={cn(
                                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                                activeFilter === filter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                            )}
                        >
                            {filter}
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {today}
                    </span>
                </div>

                <div className="space-y-4">
                    {groups.map((group) => (
                        <section key={group.day} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-semibold">{group.day}</span>
                                {group.badge ? <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold">{group.badge}</span> : null}
                            </div>
                            <div className="space-y-3">
                                {group.items.map((item, index) => (
                                    <ScheduleItem key={`${group.day}-${item.title}-${index}`} item={item} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}

