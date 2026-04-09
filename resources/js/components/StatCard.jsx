import { cn } from '@/lib/cn';

export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, gradient = 'primary', delay = 0 }) {
    const gradientClasses = {
        primary: 'gradient-primary',
        accent: 'gradient-accent',
        warm: 'gradient-warm',
        success: 'gradient-success',
    };
    const hasValue = value !== null && value !== undefined && value !== '';
    const changeTone = changeType === 'down' ? 'text-white' : 'text-white';

    return (
        <div className={cn('relative overflow-hidden rounded-2xl p-3.5 sm:p-4 text-white shadow-card-lg animate-fade-in min-h-[132px]', gradientClasses[gradient] ?? gradientClasses.primary)} style={{ animationDelay: `${delay}ms` }}>
            <div className="absolute -right-6 -top-7 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/16 grid place-items-center">
                {Icon ? <Icon className="w-4 h-4 text-white/90" /> : null}
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/85">{title}</p>
            <p className="mt-1.5 text-[30px] leading-none font-bold tracking-tight">{hasValue ? value : '-'}</p>
            <p className={cn('mt-1 text-xs text-white/85 min-h-[18px]', change ? changeTone : 'opacity-0')}>{change ?? '-'}</p>
        </div>
    );
}

