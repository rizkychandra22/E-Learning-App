const PERF_ENDPOINT = '/perf/vitals';
const LONG_TASK_THRESHOLD_MS = 50;

const getCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta?.getAttribute('content') || '';
};

const sendMetric = (payload) => {
    if (!payload || typeof payload.value !== 'number' || !Number.isFinite(payload.value)) {
        return;
    }

    const body = {
        ...payload,
        timestamp: Date.now(),
        path: window.location.pathname,
    };

    const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken(),
    };

    const request = {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'same-origin',
        keepalive: true,
    };

    fetch(PERF_ENDPOINT, request).catch(() => {});

    if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[perf]', body);
    }
};

export const initPerformanceProfiling = () => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
        return;
    }

    let lcpEntry = null;
    let clsValue = 0;
    let fcpValue = null;
    let tbtValue = 0;
    let tbtFinalized = false;
    let lcpFinalized = false;
    let clsFinalized = false;

    const finalizeLcp = () => {
        if (lcpFinalized || !lcpEntry) return;
        lcpFinalized = true;
        sendMetric({ name: 'LCP', value: lcpEntry.startTime, unit: 'ms' });
    };

    const finalizeCls = () => {
        if (clsFinalized) return;
        clsFinalized = true;
        sendMetric({ name: 'CLS', value: clsValue, unit: 'score' });
    };

    const finalizeTbt = () => {
        if (tbtFinalized) return;
        tbtFinalized = true;
        sendMetric({ name: 'TBT', value: tbtValue, unit: 'ms' });
    };

    const onPageHide = () => {
        finalizeLcp();
        finalizeCls();
        finalizeTbt();
    };

    try {
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length) {
                lcpEntry = entries[entries.length - 1];
            }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
        // ignore LCP observer errors
    }

    try {
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
        // ignore CLS observer errors
    }

    try {
        const paintObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    fcpValue = entry.startTime;
                    paintObserver.disconnect();
                }
            }
        });
        paintObserver.observe({ type: 'paint', buffered: true });
    } catch {
        // ignore paint observer errors
    }

    try {
        const longTaskObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (fcpValue === null || entry.startTime < fcpValue) {
                    continue;
                }
                const blockingTime = entry.duration - LONG_TASK_THRESHOLD_MS;
                if (blockingTime > 0) {
                    tbtValue += blockingTime;
                }
            }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch {
        // ignore longtask observer errors
    }

    window.addEventListener('load', () => {
        finalizeLcp();
        finalizeCls();
        finalizeTbt();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            onPageHide();
        }
    });

    window.addEventListener('pagehide', onPageHide);
};
