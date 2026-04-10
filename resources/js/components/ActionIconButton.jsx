import { cn } from '@/lib/cn';

const toneClass = {
    neutral: 'text-slate-500 hover:bg-secondary',
    info: 'text-sky-500 hover:bg-sky-500/10',
    primary: 'text-primary hover:bg-primary/10',
    success: 'text-success hover:bg-success/10',
    warning: 'text-warning hover:bg-warning/10',
    danger: 'text-destructive hover:bg-destructive/10',
};

export function ActionIconButton({
    icon: Icon,
    label,
    tone = 'neutral',
    disabled = false,
    type = 'button',
    className,
    ...props
}) {
    return (
        <button
            type={type}
            title={label}
            aria-label={label}
            disabled={disabled}
            className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition-colors disabled:opacity-50',
                toneClass[tone] ?? toneClass.neutral,
                className
            )}
            {...props}
        >
            {Icon ? <Icon className="w-4 h-4" /> : null}
        </button>
    );
}

