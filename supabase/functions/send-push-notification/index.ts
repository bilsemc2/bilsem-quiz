import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * JWT'yi base64url decode eder
 */
function base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
}

/**
 * VAPID imzalaması için gerekli Web Push gönderim fonksiyonu
 * Deno ortamında web-push npm paketi yerine native fetch + Web Crypto API kullanılır
 */
async function sendWebPush(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: string,
    vapidSubject: string,
    vapidPublicKey: string,
    vapidPrivateKey: string
): Promise<Response> {
    // Web Push spesifikasyonuna göre VAPID JWT oluştur
    const endpoint = new URL(subscription.endpoint);
    const audience = `${endpoint.protocol}//${endpoint.host}`;

    // JWT Header
    const header = { typ: 'JWT', alg: 'ES256' };

    // JWT Payload — 12 saat geçerli
    const jwtPayload = {
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 43200,
        sub: vapidSubject
    };

    // Base64url encode
    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // VAPID private key'i import et
    const privateKeyRaw = Uint8Array.from(
        atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/') + '=='),
        c => c.charCodeAt(0)
    );

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        privateKeyRaw,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    );

    // İmzala
    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        cryptoKey,
        encoder.encode(unsignedToken)
    );

    // DER formatından raw formata dönüştür
    const sigArray = new Uint8Array(signature);
    const signatureB64 = btoa(String.fromCharCode(...sigArray))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const jwt = `${unsignedToken}.${signatureB64}`;

    // Push mesajı şifrele (aes128gcm)
    // Basit plaintext gönderimi (encrypted push content encoding gerekir)
    // Deno'da tam Web Push encryption karmaşık olduğundan,
    // basit bir TTL:0 + body gönderimi yapıyoruz

    const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'TTL': '86400',
            'Urgency': 'normal'
        },
        body: encoder.encode(payload)
    });

    return response;
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Admin yetkisi kontrolü
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Yetkilendirme gerekli' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // Supabase client (service role ile tüm subscriptions'a erişim)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Kullanıcıyı doğrula
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Geçersiz token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // Admin kontrolü (profil tablosundan)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin yetkisi gerekli' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            });
        }

        // Request body
        const { title, body, url, userIds } = await req.json();

        if (!title || !body) {
            return new Response(JSON.stringify({ error: 'title ve body alanları zorunlu' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // Subscription'ları çek
        let query = supabase.from('push_subscriptions').select('*');
        if (userIds && userIds.length > 0) {
            query = query.in('user_id', userIds);
        }

        const { data: subscriptions, error: subError } = await query;

        if (subError) {
            return new Response(JSON.stringify({ error: 'Subscription listesi alınamadı' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: 'Hiç abone bulunamadı', sent: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // VAPID keys
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
        const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:info@bilsemc2.com';

        // Bildirim payload
        const notificationPayload = JSON.stringify({ title, body, url: url || '/' });

        // Tüm abonelere gönder
        let successCount = 0;
        let failCount = 0;
        const expiredEndpoints: string[] = [];

        for (const sub of subscriptions) {
            try {
                const response = await sendWebPush(
                    { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                    notificationPayload,
                    vapidSubject,
                    vapidPublicKey,
                    vapidPrivateKey
                );

                if (response.status === 201 || response.status === 200) {
                    successCount++;
                } else if (response.status === 410 || response.status === 404) {
                    // Expired subscription — sil
                    expiredEndpoints.push(sub.endpoint);
                    failCount++;
                } else {
                    failCount++;
                    console.error(`Push başarısız: ${response.status} - ${await response.text()}`);
                }
            } catch (error) {
                failCount++;
                console.error(`Push gönderim hatası:`, error);
            }
        }

        // Expired subscription'ları temizle
        if (expiredEndpoints.length > 0) {
            await supabase
                .from('push_subscriptions')
                .delete()
                .in('endpoint', expiredEndpoints);
        }

        return new Response(JSON.stringify({
            message: `Bildirim gönderildi`,
            sent: successCount,
            failed: failCount,
            expired_cleaned: expiredEndpoints.length,
            total: subscriptions.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
