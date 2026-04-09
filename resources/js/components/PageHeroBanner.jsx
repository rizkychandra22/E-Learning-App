import { cn } from '@/lib/cn';

export function PageHeroBanner({ title, description, icon: Icon, action = null, className = '' }) {
    return (
        <section className={cn('dashboard-hero-panel animate-fade-in', className)}>
            <div className="absolute inset-x-0 top-0 h-1.5 gradient-primary opacity-90" />
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        {Icon ? <Icon className="w-6 h-6 text-primary" /> : null}
                        {title}
                    </h1>
                    {description && <p className="text-muted-foreground mt-2 text-sm sm:text-base">{description}</p>}
                </div>
                {action ? <div className="flex items-center gap-2 flex-wrap justify-end">{action}</div> : null}
            </div>
        </section>
    );
}

