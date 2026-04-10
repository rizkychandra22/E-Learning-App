import { useId, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/cn';

const TONE_COLORS = {
    primary: 'hsl(var(--primary))',
    accent: 'hsl(var(--accent))',
    success: 'hsl(var(--success))',
    warm: 'hsl(var(--warning))',
};

const DONUT_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
    'hsl(var(--info))',
];

function toNumeric(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value === null || value === undefined) return 0;

    let normalized = String(value).trim().replace(/\s+/g, '');
    if (!normalized) return 0;

    if (normalized.includes('.') && normalized.includes(',')) {
        if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
            normalized = normalized.replace(/\./g, '').replace(',', '.');
        } else {
            normalized = normalized.replace(/,/g, '');
        }
    } else if (normalized.includes(',')) {
        normalized = /^-?\d{1,3}(,\d{3})+$/.test(normalized) ? normalized.replace(/,/g, '') : normalized.replace(',', '.');
    } else if (normalized.includes('.')) {
        normalized = /^-?\d{1,3}(\.\d{3})+$/.test(normalized) ? normalized.replace(/\./g, '') : normalized;
    }

    normalized = normalized.replace(/[^\d.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function SummaryTile({ label, value }) {
    return (
        <div className="rounded-lg bg-secondary/60 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold mt-1">{value}</p>
        </div>
    );
}

function LineChart({
    data,
    chartWidth,
    chartHeight,
    paddingX,
    paddingY,
    strokeColor,
    gradientId,
    activeIndex,
    onSetActive,
    chartHeightClass,
}) {
    const values = data.map((item) => toNumeric(item.value));
    const rawMax = Math.max(...values, 1);
    const rawMin = Math.min(...values);
    // Keep Y bounds tight so compact charts stay proportional without large empty areas.
    const verticalPadding = Math.max((rawMax - rawMin) * 0.06, 1);
    const maxValue = rawMax + verticalPadding;
    const minValue = rawMin - verticalPadding;
    const range = Math.max(maxValue - minValue, 1);

    const points = data.map((item, index) => {
        const x = paddingX + (index * (chartWidth - paddingX * 2)) / Math.max(data.length - 1, 1);
        const ratio = (toNumeric(item.value) - minValue) / range;
        const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
        return { x, y, item };
    });

    const linePath = points.map((point) => `${point.x},${point.y}`).join(' ');
    const areaPath = points.length
        ? `M ${points[0].x} ${chartHeight - paddingY} L ${points.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${points[points.length - 1].x} ${chartHeight - paddingY} Z`
        : '';

    const clampedActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(data.length - 1, 0));

    return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={cn('w-full', chartHeightClass)}>
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
                    key={`${point.item.label}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={index === clampedActiveIndex ? 6 : 4}
                    fill={index === clampedActiveIndex ? strokeColor : 'hsl(var(--background))'}
                    stroke={strokeColor}
                    strokeWidth={index === clampedActiveIndex ? 3 : 2}
                    className="transition-all duration-150"
                    onMouseEnter={() => onSetActive(index)}
                />
            ))}
        </svg>
    );
}

function BarChart({ data, chartWidth, chartHeight, paddingX, paddingY, strokeColor, activeIndex, onSetActive, chartHeightClass }) {
    const values = data.map((item) => toNumeric(item.value));
    const maxValue = Math.max(...values, 1);
    const baselineY = chartHeight - paddingY;
    const innerWidth = chartWidth - paddingX * 2;
    const unitWidth = innerWidth / Math.max(data.length, 1);
    const barWidth = Math.max(16, unitWidth * 0.56);

    return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={cn('w-full', chartHeightClass)}>
            {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                const y = paddingY + (chartHeight - paddingY * 2) * ratio;
                return <line key={ratio} x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 6" />;
            })}

            {data.map((item, index) => {
                const value = toNumeric(item.value);
                const heightRatio = value / maxValue;
                const barHeight = Math.max(6, heightRatio * (chartHeight - paddingY * 2));
                const x = paddingX + index * unitWidth + (unitWidth - barWidth) / 2;
                const y = baselineY - barHeight;
                const isActive = index === activeIndex;

                return (
                    <g key={`${item.label}-${index}`} onMouseEnter={() => onSetActive(index)}>
                        <rect x={x} y={y} width={barWidth} height={barHeight} rx={10} fill={strokeColor} opacity={isActive ? 1 : 0.78} className="transition-all duration-200" />
                        <text x={x + barWidth / 2} y={baselineY + 14} textAnchor="middle" className={cn('text-[10px] fill-muted-foreground', isActive && 'fill-foreground font-semibold')}>
                            {item.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

function PieChart({ data, activeIndex, onSetActive, valueFormatter, compact = false }) {
    const total = data.reduce((sum, item) => sum + toNumeric(item.value), 0);
    const radius = 82;
    const cx = 110;
    const cy = 110;

    const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
        const radians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + r * Math.cos(radians),
            y: centerY + r * Math.sin(radians),
        };
    };

    const describeArcSlice = (centerX, centerY, r, startAngle, endAngle) => {
        const start = polarToCartesian(centerX, centerY, r, endAngle);
        const end = polarToCartesian(centerX, centerY, r, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
    };

    let offsetCursor = 0;
    const segments = data.map((item, index) => {
        const value = toNumeric(item.value);
        const fraction = total > 0 ? value / total : 0;
        const startAngle = offsetCursor * 360;
        const endAngle = (offsetCursor + fraction) * 360;
        offsetCursor += fraction;
        return {
            label: item.label,
            value,
            fraction,
            startAngle,
            endAngle,
            color: DONUT_COLORS[index % DONUT_COLORS.length],
            index,
        };
    });

    const safeActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(data.length - 1, 0));
    const active = segments[safeActiveIndex];

    if (compact) {
        return (
            <div className="space-y-2.5">
                <div className="mx-auto relative h-[150px] w-[150px]">
                    <svg viewBox="0 0 220 220" className="h-full w-full">
                        {segments.map((segment) => (
                            <path
                                key={segment.label}
                                d={describeArcSlice(cx, cy, radius, segment.startAngle, segment.endAngle)}
                                fill={segment.color}
                                className="transition-all duration-200"
                            />
                        ))}
                    </svg>
                    <div className="absolute inset-0 grid place-items-center text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-base font-bold">{valueFormatter(total)}</p>
                    </div>
                </div>

                <div className="space-y-1">
                    {segments.map((segment) => (
                        <div
                            key={segment.label}
                            className={cn(
                                'rounded-lg px-2 py-1.5 transition-colors',
                                segment.index === safeActiveIndex ? 'bg-primary/10' : 'hover:bg-secondary/60'
                            )}
                            onMouseEnter={() => onSetActive(segment.index)}
                        >
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: segment.color }} />
                                    <span className="font-medium truncate">{segment.label}</span>
                                </div>
                                <span className="font-semibold">{valueFormatter(segment.value)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{(segment.fraction * 100).toFixed(1)}%</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 2xl:grid-cols-[200px_minmax(0,1fr)] gap-4 items-center">
            <div className="mx-auto relative h-[190px] w-[190px]">
                <svg viewBox="0 0 220 220" className="h-full w-full">
                    {segments.map((segment) => (
                        <path
                            key={segment.label}
                            d={describeArcSlice(cx, cy, radius, segment.startAngle, segment.endAngle)}
                            fill={segment.color}
                            opacity={segment.index === safeActiveIndex ? 1 : 0.8}
                            className="transition-all duration-200 cursor-pointer"
                            transform={
                                segment.index === safeActiveIndex
                                    ? `translate(${Math.cos((((segment.startAngle + segment.endAngle) / 2 - 90) * Math.PI) / 180) * 4}, ${Math.sin((((segment.startAngle + segment.endAngle) / 2 - 90) * Math.PI) / 180) * 4})`
                                    : undefined
                            }
                            onMouseEnter={() => onSetActive(segment.index)}
                        />
                    ))}
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{valueFormatter(total)}</p>
                </div>
            </div>

            <div className="space-y-2 min-w-0">
                {segments.map((segment) => {
                    const percent = segment.fraction * 100;
                    const isActive = segment.index === safeActiveIndex;
                    return (
                        <button
                            key={segment.label}
                            type="button"
                            onMouseEnter={() => onSetActive(segment.index)}
                            onClick={() => onSetActive(segment.index)}
                            className={cn(
                                'w-full text-left rounded-lg border p-2.5 transition-all',
                                isActive ? 'border-primary/50 bg-primary/10' : 'border-border bg-background hover:bg-secondary/60'
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: segment.color }} />
                                    <span className="text-sm font-medium truncate">{segment.label}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{percent.toFixed(1)}%</span>
                            </div>
                            <p className="text-sm font-semibold mt-1">{valueFormatter(segment.value)}</p>
                        </button>
                    );
                })}
            </div>

            {active && (
                <div className="2xl:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <SummaryTile label="Kategori Aktif" value={active.label} />
                    <SummaryTile label="Nilai" value={valueFormatter(active.value)} />
                    <SummaryTile label="Kontribusi" value={`${(active.fraction * 100).toFixed(1)}%`} />
                </div>
            )}
        </div>
    );
}

export function InteractiveTrendChart({
    title,
    data = [],
    valueFormatter = (value) => String(value),
    tone = 'primary',
    showTrend = true,
    chartType = 'line',
    compact = false,
    compactFooter = null,
}) {
    const gradientId = useId();
    const [activeIndex, setActiveIndex] = useState(data.length ? data.length - 1 : 0);
    const chartWidth = 760;
    const chartHeight = 220;
    const paddingX = 24;
    const paddingY = 18;

    const values = useMemo(() => data.map((item) => toNumeric(item.value)), [data]);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const clampedActiveIndex = Math.min(Math.max(activeIndex, 0), Math.max(data.length - 1, 0));
    const activeItem = data[clampedActiveIndex];

    const trendPercent = data.length > 1 && values[0] > 0
        ? ((values[values.length - 1] - values[0]) / values[0]) * 100
        : 0;

    const toneColor = TONE_COLORS[tone] ?? TONE_COLORS.primary;

    const handleMouseMove = (event) => {
        if (data.length < 2 || chartType === 'donut') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const relativeX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
        const ratioX = relativeX / bounds.width;
        setActiveIndex(Math.round(ratioX * (data.length - 1)));
    };

    if (!data.length) return null;

    const chartHeightClass = compact ? 'h-[190px]' : 'h-[220px]';
    const effectivePaddingY = compact ? 10 : 18;

    return (
        <div className="panel-card p-4 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    {title}
                </h3>
                {showTrend && chartType !== 'donut' && (
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Trend</p>
                        <p className={cn('text-sm font-semibold', trendPercent >= 0 ? 'text-success' : 'text-destructive')}>
                            {trendPercent >= 0 ? '+' : ''}
                            {trendPercent.toFixed(1)}%
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 panel-subcard p-3">
                {chartType === 'donut' ? (
                    <PieChart data={data} activeIndex={clampedActiveIndex} onSetActive={setActiveIndex} valueFormatter={valueFormatter} compact={compact} />
                ) : (
                    <div className="w-full overflow-hidden" onMouseMove={handleMouseMove} onMouseLeave={() => setActiveIndex(data.length ? data.length - 1 : 0)}>
                        {chartType === 'bar' ? (
                            <BarChart
                                data={data}
                                chartWidth={chartWidth}
                                chartHeight={chartHeight}
                                paddingX={paddingX}
                                paddingY={effectivePaddingY}
                                strokeColor={toneColor}
                                activeIndex={clampedActiveIndex}
                                onSetActive={setActiveIndex}
                                chartHeightClass={chartHeightClass}
                            />
                        ) : (
                            <LineChart
                                data={data}
                                chartWidth={chartWidth}
                                chartHeight={chartHeight}
                                paddingX={paddingX}
                                paddingY={effectivePaddingY}
                                strokeColor={toneColor}
                                gradientId={gradientId}
                                activeIndex={clampedActiveIndex}
                                onSetActive={setActiveIndex}
                                chartHeightClass={chartHeightClass}
                            />
                        )}
                    </div>
                )}

                {chartType !== 'donut' && !compact && (
                    <>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <SummaryTile label="Nilai Aktif" value={activeItem ? valueFormatter(activeItem.value) : '-'} />
                            <SummaryTile label="Periode / Label" value={activeItem?.label ?? '-'} />
                            <SummaryTile label="Titik Tertinggi" value={valueFormatter(maxValue)} />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {data.map((item, index) => (
                                <button
                                    key={`${item.label}-${index}`}
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
                    </>
                )}

                {chartType === 'line' && !compact && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Rentang data: {valueFormatter(minValue)} - {valueFormatter(maxValue)}
                    </p>
                )}

                {compact && chartType === 'line' && compactFooter && (
                    <div className="mt-3 border-t border-border/70 pt-3">
                        {Array.isArray(compactFooter) ? (
                            <div className="space-y-1.5">
                                {compactFooter.map((text, index) => (
                                    <p key={`compact-footer-${index}`} className="text-xs text-muted-foreground">
                                        {text}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">{compactFooter}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

