import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
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
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.is_admin) {
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
            return new Response(JSON.stringify({ message: 'Hiç abone bulunamadı', sent: 0, failed: 0, total: 0 }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // VAPID keys
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
        const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:info@bilsemc2.com';

        // web-push kütüphanesini yapılandır
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

        // Bildirim payload
        const notificationPayload = JSON.stringify({
            title,
            body,
            url: url || '/',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png'
        });

        // Tüm abonelere gönder
        let successCount = 0;
        let failCount = 0;
        const expiredEndpoints: string[] = [];

        console.log(`${subscriptions.length} aboneye gönderim başlıyor...`);

        for (const sub of subscriptions) {
            try {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };

                console.log(`Gönderiliyor: ${sub.endpoint.substring(0, 50)}...`);
                await webpush.sendNotification(pushSubscription, notificationPayload);
                successCount++;
                console.log(`Başarılı: ${sub.endpoint.substring(0, 50)}...`);
            } catch (error: unknown) {
                const pushError = error as { statusCode?: number; message?: string };
                if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                    // Expired subscription — sil
                    expiredEndpoints.push(sub.endpoint);
                    console.log(`Abone süresi dolmuş, temizlenecek: ${sub.endpoint.substring(0, 50)}...`);
                }
                failCount++;
                console.error(`Push başarısız (${sub.endpoint.substring(0, 50)}...): ${pushError.statusCode || 'unknown'} - ${pushError.message || 'unknown error'}`);
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

    } catch (error: unknown) {
        const err = error as { message?: string };
        return new Response(JSON.stringify({ error: err.message || 'Bilinmeyen hata' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
