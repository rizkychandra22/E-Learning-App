import { cn } from '@/lib/cn';

export function PageHeroBanner({ title, description, className = '' }) {
    return (
        <section className={cn('dashboard-hero-panel animate-fade-in', className)}>
            <div className="absolute inset-x-0 top-0 h-1.5 gradient-primary opacity-90" />
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground mt-2 text-sm sm:text-base">{description}</p>}
        </section>
    );
}
