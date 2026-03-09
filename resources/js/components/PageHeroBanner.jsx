import { cn } from '@/lib/cn';

export function PageHeroBanner({ title, description, className = '' }) {
    return (
        <section className={cn('rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 p-5 animate-fade-in', className)}>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </section>
    );
}

