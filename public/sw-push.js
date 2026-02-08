// Push notification event handler for Service Worker
// Bu dosya Workbox SW tarafından importScripts ile yüklenir

self.addEventListener('push', function (event) {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'BilsemC2',
            body: event.data.text(),
            icon: '/icons/icon-192x192.png'
        };
    }

    const options = {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'BilsemC2', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Zaten açık bir pencere varsa onu odakla
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Pencere yoksa yeni bir tane aç
            return clients.openWindow(urlToOpen);
        })
    );
});
