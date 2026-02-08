// Push notification event handler for Service Worker
// Bu dosya Workbox SW tarafından importScripts ile yüklenir

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Bildirimi Alındı');

    if (!event.data) {
        console.warn('[Service Worker] Push event data boş!');
        return;
    }

    let data;
    try {
        data = event.data.json();
        console.log('[Service Worker] Bildirim verisi:', data);
    } catch (e) {
        console.warn('[Service Worker] Veri JSON olarak parse edilemedi, metin olarak okunuyor');
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
            .then(() => console.log('[Service Worker] Bildirim gösterildi'))
            .catch(err => console.error('[Service Worker] Bildirim gösterilemedi:', err))
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Bildirime tıklandı');
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Zaten açık bir pencere varsa onu odakla
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    console.log('[Service Worker] Mevcut pencere odaklanıyor:', client.url);
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Pencere yoksa yeni bir tane aç
            console.log('[Service Worker] Yeni pencere açılıyor:', urlToOpen);
            return clients.openWindow(urlToOpen);
        })
    );
});
