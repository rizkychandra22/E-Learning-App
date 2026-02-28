import { createContext, useContext, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { props } = usePage();
    const backendUser = props?.auth?.user ?? null;

    const user = backendUser
        ? {
              ...backendUser,
              role: backendUser.dashboard_role ?? 'mahasiswa',
          }
        : null;

    const login = (payload) => {
        if (!payload) {
            return;
        }

        router.post('/login', payload);
    };

    const logout = () => {
        router.post('/logout');
    };

    const value = useMemo(() => ({ user, login, logout, isAuthenticated: !!user }), [user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
