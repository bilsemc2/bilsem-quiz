# Admin Sayfası Tab Geçişinde Yenileme Sorunu (Çözüldü)

## Sorun
`/admin` sayfasında başka bir sekmeye geçip geri gelince sayfa loading'e giriyordu.

## Kök Neden
Supabase `autoRefreshToken: true` ayarı nedeniyle tab focus'lanınca `TOKEN_REFRESHED` eventi fırlatıyordu. Bu zinciri tetikliyordu:

1. `TOKEN_REFRESHED` → `subscribeAuthState` callback
2. `syncAuthState(nextUser)` → `setUser(yeniNesne)` — user ID aynı olmasına rağmen
3. `RouteAccessGateProvider` `user` bağımlılığı değişti sanarak `setLoading(true)` + `checkAccess()` DB sorgusu
4. `GuardLoadingScreen` gösterildi → kullanıcı bunu "sayfa yenilendi" olarak algıladı

## Çözüm
`src/hooks/useAuthSessionController.ts` → `syncAuthState` içine erken çıkış eklendi:

```ts
if (nextUser?.id && previousUserId === nextUser.id) {
    return; // TOKEN_REFRESHED — aynı kullanıcı, re-render'a gerek yok
}
```

## Bonus Düzeltmeler
- `public/chunk-error-handler.js`: `text/html` olan her unhandled rejection sayfayı reload ediyordu. Daha dar koşula daraltıldı (sadece MIME type hatası).
- `vite.config.ts`: `devOptions: { enabled: false }` — dev modda PWA Service Worker kapatıldı.
- `vite.config.ts`: `esbuild.drop: ['console']` → sadece production'da aktif.
