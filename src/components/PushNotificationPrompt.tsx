import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    isPushSupported,
    getNotificationPermission,
    subscribeToPush,
    hasBeenAskedForPermission,
    markPermissionAsked
} from '../services/pushNotificationService';

const PushNotificationPrompt: React.FC = () => {
    const { user } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        if (!user || !isPushSupported()) return;

        const permission = getNotificationPermission();

        if (permission === 'granted') {
            // İzin zaten verilmiş — subscription yoksa oluştur (sessizce)
            const autoSubscribe = async () => {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const existingSub = await registration.pushManager.getSubscription();
                    if (!existingSub) {
                        // Subscription yok, oluştur ve Supabase'e kaydet
                        await subscribeToPush();
                    }
                } catch (err) {
                    console.error('Otomatik push subscription hatası:', err);
                }
            };
            autoSubscribe();
        } else if (permission === 'default' && !hasBeenAskedForPermission()) {
            // Henüz sorulmamış — banner göster
            const timer = setTimeout(() => setShowPrompt(true), 5000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleSubscribe = async () => {
        setIsSubscribing(true);
        try {
            await subscribeToPush();
            markPermissionAsked();
            setShowPrompt(false);
        } catch (error) {
            console.error('Bildirim aboneliği hatası:', error);
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleDismiss = () => {
        markPermissionAsked();
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10000,
                maxWidth: '420px',
                width: 'calc(100% - 32px)',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                animation: 'pushPromptSlideUp 0.4s ease-out'
            }}
        >
            <style>{`
        @keyframes pushPromptSlideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '20px'
                    }}
                >
                    🔔
                </div>

                <div style={{ flex: 1 }}>
                    <h4
                        style={{
                            margin: '0 0 4px 0',
                            color: '#f1f5f9',
                            fontSize: '15px',
                            fontWeight: 700
                        }}
                    >
                        Bildirimleri Aç
                    </h4>
                    <p
                        style={{
                            margin: 0,
                            color: '#94a3b8',
                            fontSize: '13px',
                            lineHeight: '1.4'
                        }}
                    >
                        Yeni oyunlar, güncellemeler ve sınav hatırlatmalarından anında haberdar ol!
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button
                    onClick={handleDismiss}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        background: 'transparent',
                        color: '#94a3b8',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Şimdi Değil
                </button>
                <button
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    style={{
                        padding: '8px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isSubscribing ? 'wait' : 'pointer',
                        opacity: isSubscribing ? 0.7 : 1,
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                    }}
                >
                    {isSubscribing ? 'Açılıyor...' : '🔔 Bildirimleri Aç'}
                </button>
            </div>
        </div>
    );
};

export default PushNotificationPrompt;
