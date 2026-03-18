import './bootstrap';
import '../css/app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { AppProviders } from './providers';
import { initPerformanceProfiling } from './lib/perf';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx');
        const legacyPages = import.meta.glob('./pages/**/*.jsx');
        let page;

        try {
            page = await resolvePageComponent(`./Pages/${name}.jsx`, pages);
        } catch (error) {
            page = await resolvePageComponent(`./pages/${name}.jsx`, legacyPages);
        }

        const originalLayout = page.default.layout;

        page.default.layout = (pageContent) => {
            const wrappedPage = originalLayout ? originalLayout(pageContent) : pageContent;
            return <AppProviders>{wrappedPage}</AppProviders>;
        };

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
        initPerformanceProfiling();
    },
});
