import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Base64 URL string'i Uint8Array'e çevirir (VAPID key için gerekli)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!base64String) {
        throw new Error('VITE_VAPID_PUBLIC_KEY is missing in environment variables');
    }
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Push bildirim desteği var mı kontrol eder
 */
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Mevcut bildirim izin durumunu döner
 */
export function getNotificationPermission(): NotificationPermission {
    if (!isPushSupported()) return 'denied';
    return Notification.permission;
}

/**
 * Kullanıcıdan bildirim izni ister
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushSupported()) return 'denied';
    const permission = await Notification.requestPermission();
    return permission;
}

/**
 * Push subscription oluşturur ve Supabase'e kaydeder
 */
export async function subscribeToPush(): Promise<boolean> {
    try {
        if (!isPushSupported()) {
            console.warn('Push notifications desteklenmiyor');
            return false;
        }

        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.warn('Bildirim izni verilmedi');
            return false;
        }

        // Service Worker'ı al
        const registration = await navigator.serviceWorker.ready;

        // Mevcut subscription varsa kontrol et
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            // Zaten abone, Supabase'de olduğundan emin ol
            await saveSubscriptionToSupabase(existingSubscription);
            return true;
        }

        // Yeni subscription oluştur
        if (!VAPID_PUBLIC_KEY) {
            console.error('VITE_VAPID_PUBLIC_KEY tanımlanmamış. Push aboneliği oluşturulamıyor.');
            return false;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer
        });

        // Supabase'e kaydet
        await saveSubscriptionToSupabase(subscription);
        return true;
    } catch (error) {
        console.error('Push subscription hatası:', error);
        return false;
    }
}

/**
 * Push subscription'ı Supabase'e kaydeder
 */
async function saveSubscriptionToSupabase(subscription: PushSubscription): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn('Kullanıcı giriş yapmamış, subscription kaydedilemedi');
        return;
    }

    const subscriptionJSON = subscription.toJSON();
    const keys = subscriptionJSON.keys as { p256dh: string; auth: string } | undefined;

    if (!keys?.p256dh || !keys?.auth) {
        console.error('Subscription keys eksik');
        return;
    }

    const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
            user_id: user.id,
            endpoint: subscriptionJSON.endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth
        }, {
            onConflict: 'endpoint'
        });

    if (error) {
        console.error('Subscription kayıt hatası:', error);
    }
}

/**
 * Push subscription'ı iptal eder
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Supabase'den sil
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscription.endpoint);

            // Tarayıcıdan aboneliği kaldır
            await subscription.unsubscribe();
        }

        return true;
    } catch (error) {
        console.error('Unsubscribe hatası:', error);
        return false;
    }
}

/**
 * Kullanıcının push bildirim izni daha önce sorulmuş mu
 */
export function hasBeenAskedForPermission(): boolean {
    return localStorage.getItem('push_permission_asked') === 'true';
}

/**
 * İzin sorulduğunu işaretle
 */
export function markPermissionAsked(): void {
    localStorage.setItem('push_permission_asked', 'true');
}
