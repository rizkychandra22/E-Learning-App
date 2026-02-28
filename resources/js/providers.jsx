import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

export function AppProviders({ children }) {
    return (
        <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
    );
}
