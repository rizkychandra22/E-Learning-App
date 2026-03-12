import { cn } from '@/lib/cn';
import { KPI_CARD_BASE_CLASS, KPI_CARD_HEIGHT_CLASS } from '@/lib/card';

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
    const changeTone = changeType === 'down' ? 'text-destructive' : 'text-success';

    return (
        <div className={cn('h-full hover:-translate-y-0.5 transition-transform animate-fade-in', KPI_CARD_BASE_CLASS)} style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground truncate">{title}</p>
                </div>
                {Icon && <DashboardIcon icon={Icon} variant={gradient} />}
            </div>
            <div>
                <p className="text-2xl leading-none font-bold">{value}</p>
                <p className={cn('text-xs font-semibold mt-1 min-h-[16px]', change ? changeTone : 'opacity-0')}>{change ?? '-'}</p>
            </div>
        </div>
    );
}

export function MiniRoleCard({ title, value, icon: Icon, iconVariant = 'primary' }) {
    return (
        <div className={cn('h-full hover:-translate-y-0.5 transition-transform', KPI_CARD_BASE_CLASS)}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground truncate">{title}</p>
                {Icon && <DashboardIcon icon={Icon} variant={iconVariant} />}
            </div>
            <p className="text-2xl leading-none font-bold">{value}</p>
        </div>
    );
}

export function EqualCard({ children }) {
    return <div className={cn('h-full [&>*]:h-full', KPI_CARD_HEIGHT_CLASS)}>{children}</div>;
}
