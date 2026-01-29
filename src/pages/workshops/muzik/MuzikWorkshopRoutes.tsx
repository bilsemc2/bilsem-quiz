import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet, Link } from 'react-router-dom';
import { AudioProvider } from './contexts/AudioContext';
import { AIAudioProvider } from './contexts/AIAudioContext';
import { Sidebar } from './components/Sidebar';
import SingleNotePage from './SingleNotePage';
import DoubleNotePage from './DoubleNotePage';
import TripleNotePage from './TripleNotePage';
import RhythmPage from './RhythmPage';
import MelodyPage from './MelodyPage';
import MelodyDifferencePage from './MelodyDifferencePage';
import RhythmDifferencePage from './RhythmDifferencePage';
import SongPage from './SongPage';
import MuzikPage from '../MuzikPage';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Lock, Loader2 } from 'lucide-react';

/**
 * Test sayfaları için layout - Sidebar dahil + Yetenek kontrolü
 */
const TestLayout: React.FC = () => {
    const { user } = useAuth();
    const [hasMusicTalent, setHasMusicTalent] = useState<boolean | null>(null);
    const [userTalents, setUserTalents] = useState<string[]>([]);

    useEffect(() => {
        const checkTalent = async () => {
            if (!user) {
                setHasMusicTalent(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('yetenek_alani, is_admin, role')
                .eq('id', user.id)
                .single();

            if (profile) {
                // Admin veya öğretmen ise direkt izin ver
                if (profile.is_admin || profile.role === 'teacher') {
                    setHasMusicTalent(true);
                    return;
                }

                const talentsInput = profile.yetenek_alani;
                let talents: string[] = [];

                if (Array.isArray(talentsInput)) {
                    talents = talentsInput;
                } else if (typeof talentsInput === 'string') {
                    talents = talentsInput.split(/[,;]/).map(t => t.trim()).filter(Boolean);
                }

                setUserTalents(talents);
                const hasTalent = talents.some(t => t.toLowerCase() === 'müzik');
                setHasMusicTalent(hasTalent);
            } else {
                setHasMusicTalent(false);
            }
        };

        checkTalent();
    }, [user]);

    // Yükleniyor
    if (hasMusicTalent === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Yetenek kontrolü yapılıyor...</p>
                </div>
            </div>
        );
    }

    // Yetenek alanı uygun değil - Ana sayfaya yönlendir
    if (!hasMusicTalent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-rose-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Erişim Kısıtlı</h1>
                    <p className="text-white/70 mb-6 leading-relaxed">
                        Müzik AI Atölyesi testleri sadece yetenek alanı <strong className="text-indigo-400">Müzik</strong> olan öğrencilerimiz içindir.
                        {userTalents.length > 0 && (
                            <span className="block mt-2">
                                Sizin yetenek alanınız: <strong className="text-amber-400">{userTalents.join(', ')}</strong>
                            </span>
                        )}
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/atolyeler/muzik"
                            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all text-center"
                        >
                            Tanıtım Sayfasına Dön
                        </Link>
                        <Link
                            to="/profile"
                            className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-center border border-white/10"
                        >
                            Profilimi Görüntüle
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 sticky top-0 z-50 shadow-sm flex-shrink-0">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100">
                            🎹
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-indigo-600 tracking-tight leading-none">
                                Müzik AI Atölyesi
                            </h1>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                BİLSEM Yetenek Geliştirme
                            </span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-6">
                        <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase">
                                AI Aktif
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content with Sidebar */}
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>

            {/* Footer */}
            <footer className="py-4 border-t bg-white text-center text-slate-400 text-[10px] font-bold flex-shrink-0 uppercase tracking-widest">
                &copy; 2026 Müzik AI Atölyesi - Tüm Modüller Hazır
            </footer>
        </>
    );
};

/**
 * Müzik AI Atölyesi - Ana Router
 * AI destekli ses tanıma, ritim algılama ve melodi analizi
 */
const MuzikWorkshopRoutes: React.FC = () => {
    return (
        <AudioProvider>
            <AIAudioProvider>
                <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
                    <Routes>
                        {/* Ana Giriş Sayfası - Sidebar YOK */}
                        <Route index element={<MuzikPage />} />

                        {/* Test Sayfaları - Sidebar VAR + Yetenek Kontrolü */}
                        <Route element={<TestLayout />}>
                            <Route path="single-note" element={<SingleNotePage />} />
                            <Route path="double-note" element={<DoubleNotePage />} />
                            <Route path="triple-note" element={<TripleNotePage />} />
                            <Route path="rhythm" element={<RhythmPage />} />
                            <Route path="melody" element={<MelodyPage />} />
                            <Route path="melody-difference" element={<MelodyDifferencePage />} />
                            <Route path="rhythm-difference" element={<RhythmDifferencePage />} />
                            <Route path="song-performance" element={<SongPage />} />
                        </Route>
                    </Routes>
                </div>
            </AIAudioProvider>
        </AudioProvider>
    );
};

export default MuzikWorkshopRoutes;
