import { cn } from '@/lib/cn';

export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, gradient = 'primary', delay = 0 }) {
    const gradientClasses = {
        primary: 'gradient-primary',
        accent: 'gradient-accent',
        warm: 'gradient-warm',
        success: 'gradient-success',
    };

    return (
        <div className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-lg transition-all duration-300 animate-fade-in border border-border" style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <p className="text-3xl font-bold tracking-tight">{value}</p>
                    {change && (
                        <p className={cn('text-xs font-medium', changeType === 'up' && 'text-success', changeType === 'down' && 'text-destructive', changeType === 'neutral' && 'text-muted-foreground')}>
                            {change}
                        </p>
                    )}
                </div>
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', gradientClasses[gradient])}>
                    <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
            </div>
        </div>
    );
}
