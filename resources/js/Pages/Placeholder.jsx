import { Head } from '@inertiajs/react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PageHeroBanner } from '@/components/PageHeroBanner';

export default function Placeholder({ title, description }) {
    return (
        <ProtectedLayout>
            <Head title={title} />
            <div className="space-y-6 w-full max-w-none">
                <PageHeroBanner title={title} description={description || 'Halaman ini sedang dalam pengembangan. Akan segera tersedia.'} />
                <div className="flex flex-col items-center justify-center min-h-[44vh] animate-fade-in rounded-xl border border-dashed border-border bg-card/60">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                        <span className="text-xs font-bold">WIP</span>
                    </div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="text-muted-foreground mt-2 text-center max-w-md">{description || 'Halaman ini sedang dalam pengembangan. Akan segera tersedia.'}</p>
                </div>
            </div>
        </ProtectedLayout>
    );
}

