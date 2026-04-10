import { cn } from '@/lib/cn';

/**
 * Reusable card-list component that replaces plain HTML tables.
 *
 * Props:
 *   items      – array of data objects
 *   renderCard – (item, index) => ReactNode  — custom card renderer
 *   emptyText  – string shown when items is empty
 *   className  – extra wrapper classes
 *   columns    – 1 | 2 (card grid columns, default 1)
 */
export function DataCardList({ items = [], renderCard, emptyText = 'Tidak ada data.', className, columns = 1 }) {
    if (!items.length) {
        return (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                {emptyText}
            </div>
        );
    }

    return (
        <div className={cn(
            'grid gap-3',
            columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1',
            className,
        )}>
            {items.map((item, index) => renderCard(item, index))}
        </div>
    );
}

/**
 * A single styled card row — consistent look across all pages.
 *
 * Props:
 *   children      – card body content
 *   accentColor   – left-border color (CSS value), e.g. 'hsl(var(--primary))'
 *   className     – extra classes
 *   onClick       – optional click handler
 */
export function DataCard({ children, accentColor, className, onClick }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative panel-card p-4',
                'transition-all duration-200 hover:shadow-card-lg hover:-translate-y-0.5',
                onClick && 'cursor-pointer',
                className,
            )}
            style={accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : undefined}
        >
            {children}
        </div>
    );
}

/**
 * Badge pill helper.
 */
export function CardBadge({ children, className }) {
    return (
        <span className={cn('inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium', className)}>
            {children}
        </span>
    );
}

/**
 * Standard field label+value pair used inside DataCard.
 */
export function CardField({ label, value, className }) {
    return (
        <div className={cn('min-w-0', className)}>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-sm mt-0.5 truncate">{value ?? '-'}</p>
        </div>
    );
}

/**
 * Action button group — sits at bottom-right of a card.
 */
export function CardActions({ children }) {
    return (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
            {children}
        </div>
    );
}


