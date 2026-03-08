import { useId, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function InteractiveTrendChart({
    title,
    data = [],
    valueFormatter = (value) => String(value),
    tone = 'primary',
    showTrend = true,
}) {
    const gradientId = useId();
    const [activeIndex, setActiveIndex] = useState(data.length ? data.length - 1 : 0);
    const chartWidth = 760;
    const chartHeight = 220;
    const paddingX = 24;
    const paddingY = 18;
    const values = data.map((item) => Number(item.value) || 0);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = Math.max(maxValue - minValue, 1);

    const toneColor = {
        primary: 'hsl(var(--primary))',
        accent: 'hsl(var(--accent))',
        success: 'hsl(var(--success))',
        warm: 'hsl(var(--warning))',
    };
    const strokeColor = toneColor[tone] ?? toneColor.primary;

    const points = data.map((item, index) => {
        const x = paddingX + (index * (chartWidth - paddingX * 2)) / Math.max(data.length - 1, 1);
        const ratio = (Number(item.value) - minValue) / range;
        const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
        return { x, y, item };
    });

    const linePath = points.map((point) => `${point.x},${point.y}`).join(' ');
    const areaPath = points.length
        ? `M ${points[0].x} ${chartHeight - paddingY} L ${points.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${points[points.length - 1].x} ${chartHeight - paddingY} Z`
        : '';

    const clampedActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(data.length - 1, 0));
    const activeItem = data[clampedActiveIndex];
    const trendPercent = data.length > 1 && values[0] > 0 ? ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0;

    const handleMouseMove = (event) => {
        if (data.length < 2) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const relativeX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
        const ratioX = relativeX / bounds.width;
        setActiveIndex(Math.round(ratioX * (data.length - 1)));
    };

    if (!data.length) return null;

    return (
        <div className="bg-card rounded-xl border border-border p-4 shadow-card animate-fade-in">
            <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    {title}
                </h3>
                {showTrend && (
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Trend</p>
                        <p className={cn('text-sm font-semibold', trendPercent >= 0 ? 'text-success' : 'text-destructive')}>
                            {trendPercent >= 0 ? '+' : ''}
                            {trendPercent.toFixed(1)}%
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background/55 p-3">
                <div className="w-full overflow-hidden" onMouseMove={handleMouseMove} onMouseLeave={() => setActiveIndex(data.length ? data.length - 1 : 0)}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[220px]">
                        <defs>
                            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
                                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
                            </linearGradient>
                        </defs>
                        {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                            const y = paddingY + (chartHeight - paddingY * 2) * ratio;
                            return <line key={ratio} x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 6" />;
                        })}
                        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
                        <polyline fill="none" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={linePath} />
                        {points.map((point, index) => (
                            <circle
                                key={point.item.label}
                                cx={point.x}
                                cy={point.y}
                                r={index === clampedActiveIndex ? 6 : 4}
                                fill={index === clampedActiveIndex ? strokeColor : 'hsl(var(--background))'}
                                stroke={strokeColor}
                                strokeWidth={index === clampedActiveIndex ? 3 : 2}
                                className="transition-all duration-150"
                                onMouseEnter={() => setActiveIndex(index)}
                            />
                        ))}
                    </svg>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-lg bg-secondary/60 p-3">
                        <p className="text-xs text-muted-foreground">Nilai Aktif</p>
                        <p className="font-semibold mt-1">{activeItem ? valueFormatter(activeItem.value) : '-'}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                        <p className="text-xs text-muted-foreground">Periode</p>
                        <p className="font-semibold mt-1">{activeItem?.label ?? '-'}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3">
                        <p className="text-xs text-muted-foreground">Titik Tertinggi</p>
                        <p className="font-semibold mt-1">{valueFormatter(maxValue)}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    {data.map((item, index) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                                index === clampedActiveIndex ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-secondary'
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
