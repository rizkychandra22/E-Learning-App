import { useMemo, useState } from 'react';
import { Clock3, MessageCircle, Reply, Search, Send } from 'lucide-react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

function MessageCard({ message, onReply, replyingTo, canReply, allowReply = true }) {
    return (
        <div className={cn('rounded-xl border border-border bg-background p-3', message.parent_id ? 'ml-6 mt-2' : '')}>
            <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full gradient-primary text-white grid place-items-center text-xs font-semibold shrink-0">
                    {message.author_initials}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold truncate">{message.author}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{message.created_label}</p>
                    </div>
                    <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">{message.message}</p>
                    {canReply && allowReply && (
                        <button
                            type="button"
                            onClick={() => onReply(message)}
                            className={cn(
                                'mt-2 inline-flex items-center gap-1 text-xs rounded-lg px-2 py-1 border',
                                replyingTo?.id === message.id
                                    ? 'border-primary text-primary bg-primary/10'
                                    : 'border-border text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Reply className="w-3.5 h-3.5" />
                            Balas
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function ThreadCard({ item, isActive, onOpen }) {
    return (
        <article className={cn('panel-subcard p-4', isActive ? 'border border-primary/30 bg-primary/5' : '')}>
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.course} - {item.author} - {item.time}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.body}</p>
                </div>
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shrink-0', item.can_reply ? 'bg-success/10 text-success' : 'bg-secondary text-secondary-foreground')}>
                    {item.can_reply ? 'Terbuka' : 'Ditutup'}
                </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {item.replies ?? 0} pesan
                </span>
                <button type="button" onClick={onOpen} className="text-xs font-semibold text-primary hover:opacity-80">
                    {isActive ? 'Sedang Dibuka' : 'Buka Diskusi'}
                </button>
            </div>
        </article>
    );
}

export default function StudentDiscussions() {
    const { user } = useAuth();
    const { props } = usePage();
    const [search, setSearch] = useState('');
    const [courseFilter, setCourseFilter] = useState('Semua Mata Kuliah');
    const [activeDiscussionId, setActiveDiscussionId] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const form = useForm({
        message: '',
        parent_id: '',
    });

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

    const discussions = props?.discussions ?? [];
    const courses = props?.courses ?? [];
    const migrationRequired = props?.migrationRequired ?? {};
    const canSendMessages = !migrationRequired?.messages;

    const hasMigrationIssue = Boolean(
        migrationRequired?.discussions || migrationRequired?.enrollments || migrationRequired?.messages
    );

    const courseOptions = useMemo(
        () => ['Semua Mata Kuliah', ...courses.map((course) => course.title)],
        [courses]
    );

    const visibleThreads = useMemo(() => discussions.filter((item) => {
        const byCourse = courseFilter === 'Semua Mata Kuliah' || item.course === courseFilter;
        const bySearch = search.trim() === '' || `${item.title} ${item.course} ${item.author} ${item.body}`.toLowerCase().includes(search.trim().toLowerCase());
        return byCourse && bySearch;
    }), [discussions, courseFilter, search]);

    const activeDiscussion = useMemo(
        () => visibleThreads.find((item) => item.id === activeDiscussionId) ?? visibleThreads[0] ?? null,
        [visibleThreads, activeDiscussionId]
    );

    const groupedMessages = useMemo(() => {
        if (!activeDiscussion) return [];
        const messages = activeDiscussion.messages ?? [];
        const roots = messages.filter((item) => item.parent_id === null);
        return roots.map((root) => ({
            root,
            replies: messages.filter((item) => item.parent_id === root.id),
        }));
    }, [activeDiscussion]);

    const openDiscussion = (discussionId) => {
        setActiveDiscussionId(discussionId);
        setReplyingTo(null);
        form.setData({ message: '', parent_id: '' });
        form.clearErrors();
    };

    const selectReply = (message) => {
        setReplyingTo(message);
        form.setData('parent_id', String(message.id));
    };

    const clearReply = () => {
        setReplyingTo(null);
        form.setData('parent_id', '');
    };

    const submitMessage = (event) => {
        event.preventDefault();
        if (!activeDiscussion) return;

        form.post(`/discussions/${activeDiscussion.id}/messages`, {
            preserveScroll: true,
            onSuccess: () => {
                form.setData({ message: '', parent_id: '' });
                setReplyingTo(null);
            },
        });
    };

    return (
        <ProtectedLayout>
            <Head title="Diskusi" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Diskusi"
                    description="Buka diskusi kelas yang aktif, lalu ajukan pertanyaan atau balas pertanyaan teman."
                />

                {hasMigrationIssue && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Fitur diskusi interaktif belum siap. Jalankan migrasi terbaru terlebih dahulu.
                    </div>
                )}

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
                        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm lg:w-64"
                    >
                        {courseOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1 lg:ml-auto"><Clock3 className="w-3.5 h-3.5" />{today}</span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <section className="space-y-3">
                        {visibleThreads.map((item) => (
                            <ThreadCard
                                key={item.id}
                                item={item}
                                isActive={activeDiscussion?.id === item.id}
                                onOpen={() => openDiscussion(item.id)}
                            />
                        ))}
                        {visibleThreads.length === 0 && (
                            <div className="panel-card p-4 text-sm text-muted-foreground">Belum ada diskusi untuk mata kuliah yang Anda ikuti.</div>
                        )}
                    </section>

                    <section className="panel-card p-4">
                        {!activeDiscussion ? (
                            <p className="text-sm text-muted-foreground">Pilih diskusi di sebelah kiri untuk melihat detail.</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="border-b border-border pb-3">
                                    <p className="text-xs text-muted-foreground">{activeDiscussion.course}</p>
                                    <h3 className="font-semibold">{activeDiscussion.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-2">{activeDiscussion.body}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Dibuka oleh {activeDiscussion.author}</p>
                                </div>

                                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                    {groupedMessages.map(({ root, replies }) => (
                                        <div key={root.id}>
                                            <MessageCard
                                                message={root}
                                                canReply={activeDiscussion.can_reply && canSendMessages}
                                                replyingTo={replyingTo}
                                                onReply={selectReply}
                                                allowReply
                                            />
                                            {replies.map((reply) => (
                                                <MessageCard
                                                    key={reply.id}
                                                    message={reply}
                                                    canReply={activeDiscussion.can_reply && canSendMessages}
                                                    replyingTo={replyingTo}
                                                    onReply={selectReply}
                                                    allowReply={false}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                    {groupedMessages.length === 0 && (
                                        <div className="text-sm text-muted-foreground">Belum ada pesan. Jadilah yang pertama bertanya.</div>
                                    )}
                                </div>

                                <form onSubmit={submitMessage} className="space-y-2 border-t border-border pt-3">
                                    {replyingTo && (
                                        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
                                            <span>Membalas: {replyingTo.author}</span>
                                            <button type="button" onClick={clearReply} className="text-primary font-semibold">Batal</button>
                                        </div>
                                    )}
                                    <textarea
                                        rows={3}
                                        value={form.data.message}
                                        onChange={(event) => form.setData('message', event.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder={
                                            !canSendMessages
                                                ? 'Fitur pesan diskusi belum aktif'
                                                : activeDiscussion.can_reply
                                                    ? 'Tulis pertanyaan atau jawaban...'
                                                    : 'Diskusi ditutup'
                                        }
                                        disabled={!activeDiscussion.can_reply || !canSendMessages || form.processing}
                                    />
                                    {form.errors.message && <p className="text-xs text-destructive">{form.errors.message}</p>}
                                    <button
                                        type="submit"
                                        disabled={!activeDiscussion.can_reply || !canSendMessages || form.processing}
                                        className="inline-flex items-center gap-1 rounded-lg gradient-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        Kirim
                                    </button>
                                </form>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </ProtectedLayout>
    );
}
