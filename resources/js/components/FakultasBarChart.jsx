import { useState, useId } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const BAR_COLORS = [
    { gradient: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.12)' },
    { gradient: 'hsl(var(--accent))', bg: 'hsl(var(--accent) / 0.12)' },
    { gradient: 'hsl(var(--warning))', bg: 'hsl(var(--warning) / 0.12)' },
    { gradient: 'hsl(var(--success))', bg: 'hsl(var(--success) / 0.12)' },
];

export function FakultasBarChart({ data = [], title = 'Statistik Fakultas' }) {
    const [activeIndex, setActiveIndex] = useState(null);
    const gradientIdPrefix = useId();

    if (!data.length) return null;

    const maxValue = Math.max(...data.map((d) => d.jurusan_count || 0), 1);
    const totalJurusan = data.reduce((sum, d) => sum + (d.jurusan_count || 0), 0);
    const avgJurusan = data.length ? (totalJurusan / data.length).toFixed(1) : 0;

    const barHeight = 18;
    const barGap = 6;
    const labelWidth = 120;
    const valueWidth = 28;
    const paddingY = 10;
    const chartAreaWidth = 260;
    const svgWidth = labelWidth + chartAreaWidth + valueWidth + 20;
    const svgHeight = paddingY * 2 + data.length * (barHeight + barGap) - barGap;

    return (
        <div className="panel-card p-4 animate-fade-in">
            <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    {title}
                </h3>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Fakultas</p>
                    <p className="text-sm font-semibold">{data.length}</p>
                </div>
            </div>

            <div className="panel-subcard p-4">
                <div className="w-full max-h-[320px] overflow-x-auto overflow-y-auto">
                    <svg
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="w-full max-w-[680px] mx-auto"
                        style={{ minWidth: 300, minHeight: Math.max(svgHeight, 120) }}
                    >
                        <defs>
                            {data.map((_, i) => {
                                const color = BAR_COLORS[i % BAR_COLORS.length];
                                return (
                                    <linearGradient key={i} id={`${gradientIdPrefix}-bar-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={color.gradient} stopOpacity="0.9" />
                                        <stop offset="100%" stopColor={color.gradient} stopOpacity="0.6" />
                                    </linearGradient>
                                );
                            })}
                        </defs>

                        {data.map((item, i) => {
                            const y = paddingY + i * (barHeight + barGap);
                            const barWidth = ((item.jurusan_count || 0) / maxValue) * chartAreaWidth;
                            const isActive = activeIndex === i;
                            const color = BAR_COLORS[i % BAR_COLORS.length];

                            return (
                                <g
                                    key={item.code || i}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                    className="cursor-pointer"
                                >
                                    {/* Label */}
                                    <text
                                        x={labelWidth - 12}
                                        y={y + barHeight / 2}
                                        textAnchor="end"
                                        dominantBaseline="central"
                                        className={cn('text-xs transition-all duration-150', isActive ? 'fill-foreground font-semibold' : 'fill-muted-foreground font-medium')}
                                    >
                                        {item.name?.length > 22 ? item.name.slice(0, 20) + '…' : item.name}
                                    </text>

                                    {/* Background track */}
                                    <rect
                                        x={labelWidth}
                                        y={y + 2}
                                        width={chartAreaWidth}
                                        height={barHeight - 4}
                                        rx={8}
                                        fill="hsl(var(--secondary))"
                                        opacity={0.5}
                                    />

                                    {/* Bar */}
                                    <rect
                                        x={labelWidth}
                                        y={y + 2}
                                        width={Math.max(barWidth, 8)}
                                        height={barHeight - 4}
                                        rx={8}
                                        fill={`url(#${gradientIdPrefix}-bar-${i})`}
                                        opacity={isActive ? 1 : 0.85}
                                        className="transition-all duration-300"
                                        style={{ filter: isActive ? 'brightness(1.1)' : 'none' }}
                                    >
                                        <animate
                                            attributeName="width"
                                            from="0"
                                            to={Math.max(barWidth, 8)}
                                            dur="0.8s"
                                            fill="freeze"
                                            begin="0s"
                                        />
                                    </rect>

                                    {/* Value */}
                                    <text
                                        x={labelWidth + chartAreaWidth + 12}
                                        y={y + barHeight / 2}
                                        dominantBaseline="central"
                                        className={cn('text-xs font-bold transition-all duration-150', isActive ? 'fill-foreground' : 'fill-muted-foreground')}
                                    >
                                        {item.jurusan_count || 0}
                                    </text>

                                    {/* Hover overlay */}
                                    <rect
                                        x={0}
                                        y={y - barGap / 2}
                                        width={svgWidth}
                                        height={barHeight + barGap}
                                        fill="transparent"
                                    />
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Tooltip / detail card */}
                <div className="mt-3 min-h-[44px]">
                    {activeIndex !== null && data[activeIndex] && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/60 animate-fade-in text-sm">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: BAR_COLORS[activeIndex % BAR_COLORS.length].gradient }} />
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span className="font-semibold">{data[activeIndex].name}</span>
                                <span className="text-muted-foreground">Kode: <span className="font-medium text-foreground">{data[activeIndex].code}</span></span>
                                <span className="text-muted-foreground">Jurusan: <span className="font-medium text-foreground">{data[activeIndex].jurusan_count}</span></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-secondary/60 p-3">
                    <p className="text-xs text-muted-foreground">Total Fakultas</p>
                    <p className="font-semibold mt-1">{data.length}</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3">
                    <p className="text-xs text-muted-foreground">Total Jurusan</p>
                    <p className="font-semibold mt-1">{totalJurusan}</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3">
                    <p className="text-xs text-muted-foreground">Rata-rata Jurusan</p>
                    <p className="font-semibold mt-1">{avgJurusan}</p>
                </div>
            </div>
        </div>
    );
}


