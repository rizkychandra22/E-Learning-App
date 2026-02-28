import { Head } from '@inertiajs/react';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';

export default function Placeholder({ title, description }) {
    return (
        <ProtectedLayout>
            <Head title={title} />
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                    <span className="text-xs font-bold">WIP</span>
                </div>
                <h1 className="text-xl font-bold">{title}</h1>
                <p className="text-muted-foreground mt-2 text-center max-w-md">{description || 'Halaman ini sedang dalam pengembangan. Akan segera tersedia.'}</p>
            </div>
        </ProtectedLayout>
    );
}
