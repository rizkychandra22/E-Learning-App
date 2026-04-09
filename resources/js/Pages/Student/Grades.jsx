import { useMemo } from 'react';
import { Award, BarChart3, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { Head, usePage } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { cn } from '@/lib/cn';
import { PageHeroBanner } from '@/components/PageHeroBanner';

const UI = {
    panel: 'panel-card p-4',
};

const KPI_GRADIENT_CLASS = {
    primary: 'gradient-primary',
    accent: 'gradient-success',
    warm: 'gradient-warm',
    success: 'gradient-accent',
};

function StatCard({ title, value, icon: Icon, tone = 'primary' }) {
    return (
        <div className={cn('relative overflow-hidden rounded-2xl p-4 text-white shadow-card-lg min-h-[122px]', KPI_GRADIENT_CLASS[tone] ?? KPI_GRADIENT_CLASS.primary)}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/16 grid place-items-center">
                <Icon className="h-4 w-4 text-white/90" />
            </div>
            <p className="text-sm text-white/85">{title}</p>
            <p className="mt-2 text-[42px] leading-none font-bold tracking-tight">{value}</p>
        </div>
    );
}

function gradeFromPercent(value) {
    const score = Number(value) || 0;
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    if (score >= 50) return 'D';
    return 'E';
}

function normalizeType(rawType) {
    const value = String(rawType ?? '').toLowerCase();
    if (value.includes('assign') || value.includes('tugas')) return 'assignment';
    if (value.includes('quiz')) return 'quiz';
    if (value.includes('uts') || value.includes('mid')) return 'uts';
    if (value.includes('uas') || value.includes('final')) return 'uas';
    return 'other';
}

function buildComparisonChartData(courses) {
    return courses.slice(0, 5).map((course) => ({
        label: course.courseTitle,
        assignment: course.assignmentAvg,
        quiz: course.quizAvg,
        overall: course.finalAvg,
    }));
}

function ComparisonBarChart({ data }) {
    const chartWidth = 760;
    const chartHeight = 220;
    const paddingX = 38;
    const paddingTop = 20;
    const paddingBottom = 34;
    const groups = data.length || 1;
    const groupWidth = (chartWidth - paddingX * 2) / groups;
    const barWidth = Math.min(18, groupWidth / 4);
    const baseline = chartHeight - paddingBottom;
    const scaleHeight = chartHeight - paddingTop - paddingBottom;
    const colors = {
        assignment: 'hsl(var(--primary))',
        quiz: 'hsl(var(--success))',
        overall: 'hsl(var(--info))',
    };

    return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[220px]">
            {[0, 25, 50, 75, 100].map((tick) => {
                const y = baseline - (tick / 100) * scaleHeight;
                return (
                    <g key={tick}>
                        <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 6" />
                        <text x={paddingX - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[9px]">{tick}</text>
                    </g>
                );
            })}
            {data.map((item, index) => {
                const groupX = paddingX + index * groupWidth + groupWidth * 0.15;
                const bars = [
                    { key: 'assignment', value: item.assignment },
                    { key: 'quiz', value: item.quiz },
                    { key: 'overall', value: item.overall },
                ];
                return (
                    <g key={item.label}>
                        {bars.map((bar, barIndex) => {
                            const value = Math.max(0, Math.min(100, Number(bar.value) || 0));
                            const height = (value / 100) * scaleHeight;
                            const y = baseline - height;
                            const x = groupX + barIndex * (barWidth + 3);
                            return (
                                <rect
                                    key={`${item.label}-${bar.key}`}
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={height}
                                    rx={4}
                                    fill={colors[bar.key]}
                                />
                            );
                        })}
                        <text x={groupX + barWidth * 1.5 + 3} y={chartHeight - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                            {item.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

function RadarProfileChart({ data }) {
    const size = 280;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 84;
    const rings = 5;
    const pointsCount = data.length || 1;

    const toPoint = (index, value = 100) => {
        const angle = (Math.PI * 2 * index) / pointsCount - Math.PI / 2;
        const r = (Math.max(0, Math.min(100, Number(value) || 0)) / 100) * radius;
        return {
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
        };
    };

    const polygonPoints = data.map((item, index) => {
        const point = toPoint(index, item.value);
        return `${point.x},${point.y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px] mx-auto">
            {Array.from({ length: rings }).map((_, ringIndex) => {
                const ringRadius = (radius / rings) * (ringIndex + 1);
                const ringPoints = data.map((_, index) => {
                    const angle = (Math.PI * 2 * index) / pointsCount - Math.PI / 2;
                    const x = cx + Math.cos(angle) * ringRadius;
                    const y = cy + Math.sin(angle) * ringRadius;
                    return `${x},${y}`;
                }).join(' ');
                return <polygon key={`ring-${ringIndex}`} points={ringPoints} fill="none" stroke="hsl(var(--border))" />;
            })}

            {data.map((item, index) => {
                const outer = toPoint(index, 100);
                return <line key={`axis-${item.label}`} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="hsl(var(--border))" />;
            })}

            <polygon points={polygonPoints} fill="hsl(var(--primary) / 0.24)" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            {data.map((item, index) => {
                const point = toPoint(index, item.value);
                const label = toPoint(index, 114);
                return (
                    <g key={`point-${item.label}`}>
                        <circle cx={point.x} cy={point.y} r="3.5" fill="hsl(var(--primary))" />
                        <text x={label.x} y={label.y} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                            {item.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function StudentGrades() {
    const { user } = useAuth();
    const { props } = usePage();
    if (!user) return null;

    const records = props?.records ?? [];
    const summary = props?.summary ?? { average: 0, graded_count: 0, assignment_avg: 0, quiz_avg: 0 };
    const migrationRequired = props?.migrationRequired;

    const courseScoreRows = useMemo(() => {
        if (!records.length) return [];
        const map = new Map();
        records.forEach((item) => {
            const courseTitle = item?.course?.title ?? 'Tanpa Mata Kuliah';
            const normalizedType = normalizeType(item?.type);
            const score = Number(item?.score) || 0;
            const maxScore = Number(item?.max_score) || 0;
            const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;

            if (!map.has(courseTitle)) {
                map.set(courseTitle, {
                    courseTitle,
                    totals: [],
                    assignment: [],
                    quiz: [],
                    uts: [],
                    uas: [],
                });
            }

            const bucket = map.get(courseTitle);
            bucket.totals.push(percent);
            if (normalizedType === 'assignment') bucket.assignment.push(percent);
            if (normalizedType === 'quiz') bucket.quiz.push(percent);
            if (normalizedType === 'uts') bucket.uts.push(percent);
            if (normalizedType === 'uas') bucket.uas.push(percent);
        });

        const avg = (arr) => (arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0);
        return Array.from(map.values()).map((item) => {
            const assignmentAvg = avg(item.assignment);
            const quizAvg = avg(item.quiz);
            const utsAvg = avg(item.uts);
            const uasAvg = avg(item.uas);
            const finalAvg = avg(item.totals);
            return {
                courseTitle: item.courseTitle,
                assignmentAvg: Number(assignmentAvg.toFixed(1)),
                quizAvg: Number(quizAvg.toFixed(1)),
                utsAvg: item.uts.length ? Number(utsAvg.toFixed(1)) : null,
                uasAvg: item.uas.length ? Number(uasAvg.toFixed(1)) : null,
                finalAvg: Number(finalAvg.toFixed(1)),
                grade: gradeFromPercent(finalAvg),
            };
        }).sort((a, b) => b.finalAvg - a.finalAvg);
    }, [records]);

    const comparisonData = useMemo(() => buildComparisonChartData(courseScoreRows), [courseScoreRows]);
    const radarData = useMemo(() => {
        const source = courseScoreRows.slice(0, 6);
        if (!source.length) return [];
        return source.map((item) => {
            const trimmed = item.courseTitle.replace('Fundamental', '').replace('Masterclass', '').trim();
            return {
                label: trimmed.length > 14 ? `${trimmed.slice(0, 12)}..` : trimmed,
                value: item.finalAvg,
            };
        });
    }, [courseScoreRows]);

    const activeCoursesCount = useMemo(() => {
        if (courseScoreRows.length) return courseScoreRows.length;
        return 0;
    }, [courseScoreRows]);
    const semesterIpk = useMemo(() => Number(((Number(summary.average) || 0) / 25).toFixed(2)), [summary.average]);
    const predicate = useMemo(() => gradeFromPercent(summary.average), [summary.average]);

    return (
        <ProtectedLayout>
            <Head title="Nilai" />
            <div className="space-y-6">
                <PageHeroBanner
                    title="Nilai"
                    description="Pantau perkembangan nilai akademikmu."
                />

                {migrationRequired && (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
                        Tabel penilaian belum tersedia. Jalankan <code className="font-mono">php artisan migrate</code>
                    </div>
                )}

                <div className="grid grid-cols-1 min-[540px]:grid-cols-2 xl:grid-cols-4 gap-3">
                    <StatCard title="Rata-rata Keseluruhan" value={summary.average} icon={TrendingUp} tone="primary" />
                    <StatCard title="Mata Kuliah Aktif" value={activeCoursesCount} icon={BookOpen} tone="success" />
                    <StatCard title="IPK Sementara" value={semesterIpk.toFixed(2)} icon={GraduationCap} tone="accent" />
                    <StatCard title="Predikat" value={predicate} icon={Award} tone="warm" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    <section className="panel-card p-4 xl:col-span-7">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Perbandingan Nilai per Komponen
                        </h3>
                        <div className="panel-subcard p-3 mt-4">
                            {comparisonData.length ? (
                                <ComparisonBarChart data={comparisonData} />
                            ) : (
                                <p className="text-sm text-muted-foreground py-12 text-center">Belum ada data penilaian.</p>
                            )}
                        </div>
                    </section>
                    <section className="panel-card p-4 xl:col-span-5">
                        <h3 className="font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Profil Nilai
                        </h3>
                        <div className="panel-subcard p-3 mt-4 min-h-[300px] flex items-center justify-center">
                            {radarData.length ? (
                                <RadarProfileChart data={radarData} />
                            ) : (
                                <p className="text-sm text-muted-foreground">Belum ada data profil nilai.</p>
                            )}
                        </div>
                    </section>
                </div>

                <div className={UI.panel}>
                    <h3 className="font-semibold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Detail Nilai per Mata Kuliah
                    </h3>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[840px] text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground border-b border-border">
                                    <th className="py-2 px-2 font-medium">Mata Kuliah</th>
                                    <th className="py-2 px-2 font-medium">Tugas</th>
                                    <th className="py-2 px-2 font-medium">Kuis</th>
                                    <th className="py-2 px-2 font-medium">UTS</th>
                                    <th className="py-2 px-2 font-medium">UAS</th>
                                    <th className="py-2 px-2 font-medium">Akhir</th>
                                    <th className="py-2 px-2 font-medium">Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!courseScoreRows.length && (
                                    <tr>
                                        <td className="py-4 px-2 text-muted-foreground" colSpan={7}>
                                            Belum ada nilai yang dipublikasikan.
                                        </td>
                                    </tr>
                                )}
                                {courseScoreRows.map((item, index) => {
                                    const dotColors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-accent', 'bg-destructive'];
                                    const gradeTone = item.grade === 'A' ? 'bg-success/15 text-success' : item.grade === 'B' ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning';
                                    return (
                                        <tr key={`${item.courseTitle}-${index}`} className="border-b border-border/70">
                                            <td className="py-2.5 px-2 font-medium">
                                                <span className={cn('inline-block h-2.5 w-2.5 rounded-full mr-2 align-middle', dotColors[index % dotColors.length])} />
                                                <span className="align-middle">{item.courseTitle}</span>
                                            </td>
                                            <td className="py-2.5 px-2">{item.assignmentAvg ? item.assignmentAvg.toFixed(0) : '-'}</td>
                                            <td className="py-2.5 px-2">{item.quizAvg ? item.quizAvg.toFixed(0) : '-'}</td>
                                            <td className="py-2.5 px-2">{item.utsAvg !== null ? item.utsAvg.toFixed(0) : '-'}</td>
                                            <td className="py-2.5 px-2">{item.uasAvg !== null ? item.uasAvg.toFixed(0) : '-'}</td>
                                            <td className="py-2.5 px-2 font-semibold">{item.finalAvg.toFixed(0)}</td>
                                            <td className="py-2.5 px-2">
                                                <span className={cn('inline-flex min-w-7 justify-center px-2 py-0.5 rounded-full text-xs font-semibold', gradeTone)}>
                                                    {item.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}

