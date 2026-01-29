// Module loading error recovery
// This handles stale chunk errors after deployments

window.addEventListener('error', (event) => {
    // Check if it's a module loading error
    if (
        event.message?.includes('Failed to fetch dynamically imported module') ||
        event.message?.includes('Loading chunk') ||
        event.message?.includes('Loading CSS chunk')
    ) {
        console.warn('[App] Detected stale chunk, reloading page...');
        // Clear cache and reload
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        // Force reload (bypass cache)
        window.location.reload();
    }
}, true);

// Also handle unhandled promise rejections for dynamic imports
window.addEventListener('unhandledrejection', (event) => {
    if (
        event.reason?.message?.includes('Failed to fetch dynamically imported module') ||
        event.reason?.message?.includes('text/html')
    ) {
        console.warn('[App] Dynamic import failed, reloading page...');
        window.location.reload();
    }
});
