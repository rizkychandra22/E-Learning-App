import { cn } from '@/lib/cn';
import { KPI_CARD_BASE_CLASS, KPI_CARD_HEIGHT_CLASS, WARM_STRIP_CLASS } from '@/lib/card';

const ACCENT_STRIP_BY_VARIANT = {
    primary: WARM_STRIP_CLASS,
    accent: WARM_STRIP_CLASS,
    warm: WARM_STRIP_CLASS,
    success: WARM_STRIP_CLASS,
};

export function DashboardIcon({ icon: Icon, variant = 'primary' }) {
    const variantClass = {
        primary: 'gradient-primary text-primary-foreground',
        accent: 'gradient-accent text-accent-foreground',
        warm: 'gradient-warm text-foreground',
        success: 'gradient-success text-success-foreground',
    };

    return (
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-card', variantClass[variant] ?? variantClass.primary)}>
            {Icon && <Icon className="w-4 h-4" strokeWidth={2.25} />}
        </div>
    );
}

export function CompactStatCard({ title, value, change, changeType = 'up', icon: Icon, gradient = 'primary', delay = 0 }) {
    const hasValue = value !== null && value !== undefined && value !== '';
    const changeTone = changeType === 'down' ? 'text-destructive' : 'text-success';

    return (
        <div className={cn(KPI_CARD_BASE_CLASS, 'animate-fade-in')} style={{ animationDelay: `${delay}ms` }}>
            <div className={cn('absolute inset-x-0 top-0 h-1.5 opacity-90', ACCENT_STRIP_BY_VARIANT[gradient] ?? ACCENT_STRIP_BY_VARIANT.primary)} />
            <div className="flex items-center justify-between gap-3 pt-1">
                <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate">{title}</p>
                </div>
                {Icon && <DashboardIcon icon={Icon} variant={gradient} />}
            </div>
            <div className="space-y-2">
                <p className="text-2xl sm:text-3xl leading-none font-bold tracking-tight">{hasValue ? value : '-'}</p>
                <p className={cn('text-[11px] sm:text-xs font-semibold mt-1 h-5 inline-flex items-center rounded-full px-2', change ? `bg-secondary/70 ${changeTone}` : 'opacity-0')}>
                    {change ?? '-'}
                </p>
            </div>
        </div>
    );
}

export function MiniRoleCard({ title, value, icon: Icon, iconVariant = 'primary', meta = 'Data terbaru' }) {
    const hasValue = value !== null && value !== undefined && value !== '';

    return (
        <div className={cn(KPI_CARD_BASE_CLASS)}>
            <div className={cn('absolute inset-x-0 top-0 h-1.5 opacity-90', ACCENT_STRIP_BY_VARIANT[iconVariant] ?? ACCENT_STRIP_BY_VARIANT.primary)} />
            <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate">{title}</p>
                {Icon && <DashboardIcon icon={Icon} variant={iconVariant} />}
            </div>
            <div className="space-y-2">
                <p className="text-2xl sm:text-3xl leading-none font-bold tracking-tight">{hasValue ? value : '-'}</p>
                <p className="text-[11px] sm:text-xs font-medium text-muted-foreground h-5 inline-flex items-center rounded-full bg-secondary/60 px-2">{meta}</p>
            </div>
        </div>
    );
}

export function EqualCard({ children, className }) {
    return <div className={cn('h-full [&>*]:h-full', KPI_CARD_HEIGHT_CLASS, className)}>{children}</div>;
}
