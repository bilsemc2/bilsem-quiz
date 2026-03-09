// Module loading error recovery
// This handles stale chunk errors after deployments

window.addEventListener('error', (event) => {
    const isChunkLoadError = event.message?.includes('Failed to fetch dynamically imported module') ||
        event.message?.includes('Loading chunk') ||
        event.message?.includes('Loading CSS chunk');

    if (isChunkLoadError) {
        const lastReload = sessionStorage.getItem('chunk_reload_timeout');
        if (lastReload && Date.now() - parseInt(lastReload) < 10000) {
            console.error('[App] Prevented infinite reload loop for chunk error:', event.message);
            return;
        }

        console.warn('[App] Detected stale chunk, reloading page...');
        sessionStorage.setItem('chunk_reload_timeout', Date.now().toString());

        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        window.location.reload();
    }
}, true);

// Also handle unhandled promise rejections for dynamic imports
window.addEventListener('unhandledrejection', (event) => {
    const isDynamicImportError = event.reason?.message?.includes('Failed to fetch dynamically imported module') ||
        // Only trigger on text/html if we're sure it's a module MIME type error, not a generic API 502 response
        (event.reason?.message?.includes('MIME type') && event.reason?.message?.includes('text/html'));

    if (isDynamicImportError) {
        const lastReload = sessionStorage.getItem('chunk_reload_timeout');
        if (lastReload && Date.now() - parseInt(lastReload) < 10000) {
            console.error('[App] Prevented infinite reload loop for dynamic import error:', event.reason);
            return;
        }

        console.warn('[App] Dynamic import failed, reloading page...', event.reason?.message);
        sessionStorage.setItem('chunk_reload_error_reason', String(event.reason?.message || 'unknown'));
        sessionStorage.setItem('chunk_reload_timeout', Date.now().toString());

        window.location.reload();
    }
});
