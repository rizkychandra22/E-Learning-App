import { useMemo, useState } from 'react';
import { Clock3, MessageCircle, Search, ThumbsUp } from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const THREADS = [
    { id: 1, initials: 'AP', title: 'Perbedaan useState vs useReducer di React?', course: 'React JS Fundamental', author: 'Andi Pratama', likes: 12, replies: 8, time: '2 jam lalu', tags: ['#hooks', '#react'], solved: true },
    { id: 2, initials: 'BR', title: 'Kenapa query SQL saya sangat lambat?', course: 'Database Design', author: 'Budi R.', likes: 5, replies: 4, time: '5 jam lalu', tags: ['#sql', '#optimization'], solved: true },
    { id: 3, initials: 'CM', title: 'Cara terbaik menstruktur folder proyek Node.js?', course: 'Node.js Advanced', author: 'Citra M.', likes: 22, replies: 15, time: 'Kemarin', tags: ['#structure', '#nodejs'], solved: true },
    { id: 4, initials: 'DA', title: 'Tips memilih warna pada UI yang baik?', course: 'UI/UX Design Basics', author: 'Dewi A.', likes: 18, replies: 7, time: '2 hari lalu', tags: ['#color', '#ui'], solved: true },
];

function ThreadItem({ item }) {
    return (
        <article className="panel-subcard p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full gradient-primary text-white grid place-items-center text-sm font-semibold">{item.initials}</div>
                    <div className="min-w-0">
                        <p className="font-semibold truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.course} · {item.author} · {item.time}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-primary">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-success/10 text-success px-2.5 py-1 text-xs font-semibold">Terjawab</span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{item.likes} Suka</span>
                <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{item.replies} Balasan</span>
            </div>
        </article>
    );
}

export default function StudentDiscussions() {
    const { user } = useAuth();
    const { props } = usePage();
    const [search, setSearch] = useState('');
    const [courseFilter, setCourseFilter] = useState('Semua Mata Kuliah');
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

    const courseOptions = ['Semua Mata Kuliah', 'React JS Fundamental', 'Database Design', 'Node.js Advanced', 'UI/UX Design Basics'];
    const visibleThreads = THREADS.filter((item) => {
        const byCourse = courseFilter === 'Semua Mata Kuliah' || item.course === courseFilter;
        const bySearch = search.trim() === '' || `${item.title} ${item.course} ${item.author}`.toLowerCase().includes(search.trim().toLowerCase());
        return byCourse && bySearch;
    });

    return (
        <ProtectedLayout>
            <Head title="Diskusi" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Diskusi"
                    description="Tanya, jawab, dan diskusi bersama teman sekelas."
                    action={<button type="button" className="inline-flex items-center rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground">+ Buat Diskusi</button>}
                />

                <div className="flex flex-col lg:flex-row gap-3">
                    <label className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari diskusi..."
                            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm"
                        />
                    </label>
                    <select
                        value={courseFilter}
                        onChange={(event) => setCourseFilter(event.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm lg:w-48"
                    >
                        {courseOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1 lg:ml-auto"><Clock3 className="w-3.5 h-3.5" />{today}</span>
                </div>

                <div className="space-y-3">
                    {visibleThreads.map((item) => <ThreadItem key={item.id} item={item} />)}
                </div>
            </div>
        </ProtectedLayout>
    );
}

