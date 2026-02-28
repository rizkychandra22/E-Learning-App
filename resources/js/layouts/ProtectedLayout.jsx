import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

export function ProtectedLayout({ children }) {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) router.visit('/login');
    }, [user]);

    if (!user) return null;
    return <DashboardLayout>{children}</DashboardLayout>;
}
