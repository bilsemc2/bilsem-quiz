import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    Chip,
    CircularProgress,
    Divider,
} from '@mui/material';
import {
    Send as SendIcon,
    NotificationsActive as NotifIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const PushNotificationAdmin: React.FC = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('/');
    const [sending, setSending] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
    const [lastResult, setLastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

    useEffect(() => {
        fetchSubscriberCount();
    }, []);

    const fetchSubscriberCount = async () => {
        try {
            const { count, error } = await supabase
                .from('push_subscriptions')
                .select('*', { count: 'exact', head: true });

            if (!error && count !== null) {
                setSubscriberCount(count);
            }
        } catch (err) {
            console.error('Abone sayısı alınamadı:', err);
        }
    };

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            toast.error('Başlık ve mesaj alanları zorunludur');
            return;
        }

        setSending(true);
        setLastResult(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Oturum bulunamadı');
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || '/' }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || 'Bildirim gönderilemedi');
                return;
            }

            setLastResult({ sent: result.sent, failed: result.failed, total: result.total });
            toast.success(`${result.sent} aboneye bildirim gönderildi!`);

            // Formu temizle
            setTitle('');
            setBody('');
            setUrl('/');
        } catch (err) {
            console.error('Bildirim gönderme hatası:', err);
            toast.error('Bildirim gönderilirken bir hata oluştu');
        } finally {
            setSending(false);
        }
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotifIcon color="primary" />
                Push Bildirim Gönder
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Uygulamayı yükleyen ve bildirimlere izin veren kullanıcılara push bildirim gönderin.
            </Typography>

            {/* Abone İstatistikleri */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Card variant="outlined" sx={{ minWidth: 180, flex: 1 }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <PeopleIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="h4" fontWeight={700}>
                            {subscriberCount !== null ? subscriberCount : '—'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Toplam Abone
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Bildirim Formu */}
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                        Yeni Bildirim
                    </Typography>

                    <TextField
                        fullWidth
                        label="Başlık"
                        placeholder="Örn: Yeni Oyun Eklendi! 🎮"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        sx={{ mb: 2 }}
                        inputProps={{ maxLength: 100 }}
                        helperText={`${title.length}/100`}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Mesaj"
                        placeholder="Örn: Hafıza Labirenti oyununu keşfetmeye hazır mısın?"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        sx={{ mb: 2 }}
                        inputProps={{ maxLength: 300 }}
                        helperText={`${body.length}/300`}
                    />

                    <TextField
                        fullWidth
                        label="Bağlantı URL (opsiyonel)"
                        placeholder="Örn: /zeka veya /atolyeler/genel-yetenek"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    {/* Önizleme */}
                    {(title || body) && (
                        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }} icon={<NotifIcon />}>
                            <Typography variant="subtitle2" fontWeight={700}>{title || 'Başlık'}</Typography>
                            <Typography variant="body2">{body || 'Mesaj içeriği'}</Typography>
                        </Alert>
                    )}

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        onClick={handleSend}
                        disabled={sending || !title.trim() || !body.trim()}
                        fullWidth
                        sx={{
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '1rem',
                        }}
                    >
                        {sending ? 'Gönderiliyor...' : `Tüm Abonelere Gönder (${subscriberCount ?? 0})`}
                    </Button>
                </CardContent>
            </Card>

            {/* Son Gönderim Sonucu */}
            {lastResult && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`✅ Gönderildi: ${lastResult.sent}`} color="success" variant="outlined" />
                    {lastResult.failed > 0 && (
                        <Chip label={`❌ Başarısız: ${lastResult.failed}`} color="error" variant="outlined" />
                    )}
                    <Chip label={`👥 Toplam: ${lastResult.total}`} variant="outlined" />
                </Box>
            )}
        </Box>
    );
};

export default PushNotificationAdmin;
