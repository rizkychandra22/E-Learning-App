import { useMemo, useState } from 'react';
import { Award, CalendarDays, CheckCircle2, Clock, Send, Timer, Trophy } from 'lucide-react';
import { Head, router, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { toIntlLocale } from '@/lib/locale';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'panel-card p-4',
    chip: 'inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium',
};

function normalizeAnswersForQuiz(quiz) {
    const fromAttempt = quiz?.attempt?.answers;
    if (fromAttempt && typeof fromAttempt === 'object' && !Array.isArray(fromAttempt)) {
        return fromAttempt;
    }
    return {};
}

function QuizCard({ quiz, draft, onChangeAnswer, onSubmit }) {
    const statusTone = {
        active: 'bg-primary/10 text-primary',
        closed: 'bg-secondary text-secondary-foreground',
        graded: 'bg-success/10 text-success',
    };

    const attemptStatus = quiz?.attempt?.status ?? 'belum';

    return (
        <div className={cn(UI.panel, 'space-y-3')}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-muted-foreground">{quiz?.course?.title ?? 'Tanpa kursus'}</p>
                    <h3 className="font-semibold">{quiz?.title}</h3>
                </div>
                <span className={cn(UI.chip, statusTone[quiz?.status] ?? 'bg-secondary text-secondary-foreground')}>{quiz?.status?.toUpperCase()}</span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className={UI.chip}>
                    <Clock className="w-3.5 h-3.5" />
                    {quiz?.duration_minutes ? `${quiz.duration_minutes} menit` : 'Durasi fleksibel'}
                </span>
                <span className={UI.chip}>
                    <Timer className="w-3.5 h-3.5" />
                    {quiz?.scheduled_at ? new Date(quiz.scheduled_at).toLocaleString('id-ID') : 'Tanpa jadwal'}
                </span>
                <span className={cn(UI.chip, attemptStatus === 'graded' ? 'text-success' : attemptStatus === 'submitted' ? 'text-primary' : 'text-muted-foreground')}>
                    {attemptStatus}
                </span>
                {quiz?.attempt?.score !== null && quiz?.attempt?.score !== undefined && (
                    <span className={UI.chip}>
                        <Trophy className="w-3.5 h-3.5" />
                        Skor {quiz.attempt.score}
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {(quiz?.questions ?? []).map((question, index) => {
                    const key = String(question.id ?? question.sort_order ?? index + 1);
                    const value = draft?.[key] ?? '';

                    return (
                        <div key={`q-${quiz.id}-${key}`} className="rounded-xl border border-border p-3 space-y-2">
                            <p className="text-xs text-muted-foreground">Soal #{index + 1} ({question.question_type === 'essay' ? 'Essay' : 'Objective'})</p>
                            <p className="text-sm font-medium">{question.question_text}</p>

                            {question.question_type === 'objective' ? (
                                <div className="space-y-2">
                                    {(question.options ?? []).map((option, optionIndex) => (
                                        <label key={`opt-${key}-${optionIndex}`} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="radio"
                                                name={`quiz-${quiz.id}-q-${key}`}
                                                value={option}
                                                checked={value === option}
                                                onChange={(event) => onChangeAnswer(key, event.target.value)}
                                                disabled={quiz?.status !== 'active'}
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    rows={3}
                                    value={value}
                                    onChange={(event) => onChangeAnswer(key, event.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Tulis jawaban essay..."
                                    disabled={quiz?.status !== 'active'}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={onSubmit}
                disabled={quiz?.status !== 'active'}
                className="inline-flex items-center gap-1 rounded-lg gradient-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
            >
                <Send className="w-3.5 h-3.5" />
                Kirim Jawaban
            </button>
        </div>
    );
}

export default function StudentQuizzes() {
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

    const quizzes = props?.quizzes ?? [];
    const summary = props?.summary ?? { active_count: 0, submitted_count: 0, graded_count: 0 };
    const migrationRequired = props?.migrationRequired ?? { quizzes: false, attempts: false };
    const [draftAnswers, setDraftAnswers] = useState(() => Object.fromEntries(quizzes.map((quiz) => [quiz.id, normalizeAnswersForQuiz(quiz)])));

    const setAnswer = (quizId, questionKey, value) => {
        setDraftAnswers((prev) => ({
            ...prev,
            [quizId]: {
                ...(prev?.[quizId] ?? {}),
                [questionKey]: value,
            },
        }));
    };

    const submitQuiz = (quiz) => {
        const answers = { ...(draftAnswers?.[quiz.id] ?? {}) };
        const cleaned = Object.fromEntries(
            Object.entries(answers)
                .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : String(value ?? '').trim()])
                .filter(([, value]) => value !== '')
        );

        const totalQuestions = (quiz?.questions ?? []).length;
        if (Object.keys(cleaned).length < totalQuestions) {
            window.alert('Semua soal harus dijawab sebelum dikirim.');
            return;
        }

        router.post(`/quizzes/${quiz.id}/submit`, { answers: cleaned }, { preserveScroll: true });
    };

    return (
        <ProtectedLayout>
            <Head title="Kuis" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Kuis"
                    description="Kerjakan kuis per soal, kirim jawaban, dan cek skor saat sudah dinilai."
                />

                {(migrationRequired.quizzes || migrationRequired.attempts) && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Fitur kuis/attempt belum siap. Jalankan migrasi: <code className="font-mono">php artisan migrate</code>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className={UI.chip}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            {today}
                        </span>
                        <span className={UI.chip}>
                            <Award className="w-3.5 h-3.5" />
                            {summary.active_count} kuis tersedia
                        </span>
                        <span className={UI.chip}>
                            <Timer className="w-3.5 h-3.5" />
                            {summary.submitted_count} sudah dikumpulkan
                        </span>
                    </div>
                    <span className={UI.chip}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {summary.graded_count} sudah dinilai
                    </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {quizzes.map((quiz) => (
                        <QuizCard
                            key={`${quiz.id}-${quiz.title}`}
                            quiz={quiz}
                            draft={draftAnswers[quiz.id] ?? {}}
                            onChangeAnswer={(questionKey, value) => setAnswer(quiz.id, questionKey, value)}
                            onSubmit={() => submitQuiz(quiz)}
                        />
                    ))}
                    {quizzes.length === 0 && (
                        <div className="panel-card p-4 text-sm text-muted-foreground">Belum ada kuis tersedia.</div>
                    )}
                </div>
            </div>
        </ProtectedLayout>
    );
}
