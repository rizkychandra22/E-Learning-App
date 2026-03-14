import { useMemo } from 'react';
import { CalendarDays, MessageSquare, Pin, Search, Users } from 'lucide-react';
import { Head, Link, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'rounded-2xl border border-border bg-card p-4 shadow-card',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

function ThreadCard({ title, course, replies, last, pinned }) {
    return (
        <div className={cn(UI.panel, 'flex items-start gap-4')}>
            <div className={cn('rounded-xl p-2.5', pinned ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary')}>
                {pinned ? <Pin className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold truncate">{title}</p>
                        <p className="text-xs text-muted-foreground">{course}</p>
                    </div>
                    <span className={UI.chip}>{replies} balasan</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Aktif {last}</p>
                <div className="mt-3">
                    <Link href="/discussions" className="text-xs font-medium text-primary hover:opacity-80">
                        Buka diskusi
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function StudentDiscussions() {
    const { user } = useAuth();
    const { props } = usePage();
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

    const threads = [
        { title: 'Strategi Sorting yang paling efisien?', course: 'Algoritma & Struktur Data', replies: 14, last: '2 jam lalu', pinned: true },
        { title: 'Contoh kasus normalisasi 3NF', course: 'Basis Data Lanjut', replies: 8, last: '5 jam lalu', pinned: false },
        { title: 'Best practice layout responsive', course: 'Pemrograman Web', replies: 11, last: '1 hari lalu', pinned: false },
        { title: 'Tips belajar machine learning', course: 'Machine Learning', replies: 6, last: '2 hari lalu', pinned: false },
    ];

    return (
        <ProtectedLayout>
            <Head title="Diskusi" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Diskusi"
                    description="Forum tanya jawab dan kolaborasi antar mahasiswa dan dosen."
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <Users className="w-3.5 h-3.5" />
                            4 topik aktif
                        </span>
                    </div>
                    <button type="button" className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-1">
                        <Search className="w-3.5 h-3.5" />
                        Cari topik
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {threads.map((thread) => (
                        <ThreadCard key={thread.title} {...thread} />
                    ))}
                </div>
            </div>
        </ProtectedLayout>
    );
}
