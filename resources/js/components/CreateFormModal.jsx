import { X } from 'lucide-react';

export function CreateFormModal({
    open,
    title,
    onClose,
    onSubmit,
    children,
    submitLabel = 'Simpan',
    cancelLabel = 'Batal',
    processing = false,
    disableSubmit = false,
    maxWidthClass = 'max-w-3xl',
    hideFooter = false,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" onClick={onClose} />
            <form
                onSubmit={onSubmit ?? ((event) => event.preventDefault())}
                className={`relative w-full ${maxWidthClass} rounded-[20px] border border-border bg-background shadow-2xl overflow-hidden`}
            >
                <div className="flex items-center justify-between gap-2 px-6 py-5 border-b border-border">
                    <h3 className="text-[32px] sm:text-[34px] leading-none font-semibold tracking-tight text-foreground">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label="Tutup form"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
                    {children}
                </div>

                {!hideFooter && (
                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-background/95">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border bg-secondary/55 text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="submit"
                            disabled={processing || disableSubmit}
                            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
                        >
                            {processing ? 'Menyimpan...' : submitLabel}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
