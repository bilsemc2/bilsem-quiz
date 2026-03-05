/**
 * MuzikSinavRoutes — Main router for the BİLSEM Music Exam Workshop.
 * Wraps all pages in ExamProvider and includes sidebar navigation.
 * Test pages require login + Müzik talent.
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Music, Menu, X, Loader2 } from 'lucide-react';
import { ExamProvider } from './contexts/ExamContext';
import { MusicAIProvider } from './contexts/MusicAIContext';
import { Sidebar } from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import TekSesPage from './pages/TekSesPage';
import CiftSesPage from './pages/CiftSesPage';
import EzgiPage from './pages/EzgiPage';
import RitimPage from './pages/RitimPage';
import SarkiPage from './pages/SarkiPage';
import UretkenlikPage from './pages/UretkenlikPage';
import ReportPage from './pages/ReportPage';
import { useAuth } from '../../../contexts/AuthContext';
import AccessDeniedScreen from '../../../components/AccessDeniedScreen';
import { authRepository } from '@/server/repositories/authRepository';
import { normalizeTalents } from '@/features/auth/model/accessControlUseCase';

function TestLayout() {
    const { user } = useAuth();
    const [hasMusicTalent, setHasMusicTalent] = useState<boolean | null>(null);
    const [userTalents, setUserTalents] = useState<string[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkTalent = async () => {
            if (!user) { setHasMusicTalent(false); return; }
            const profile = await authRepository.getProfileByUserId(user.id);
            if (profile) {
                if (profile.is_admin || profile.role === 'teacher') { setHasMusicTalent(true); return; }
                const talents = normalizeTalents(profile.yetenek_alani);
                setUserTalents(talents);
                setHasMusicTalent(
                    talents.some((talent) => {
                        const normalized = talent.toLocaleLowerCase('tr-TR');
                        return normalized === 'müzik' || normalized === 'muzik';
                    })
                );
            } else { setHasMusicTalent(false); }
        };
        checkTalent();
    }, [user]);

    if (hasMusicTalent === null) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-cyber-blue animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-nunito font-bold">Yetenek kontrolü yapılıyor...</p>
            </div>
        </div>
    );

    if (!hasMusicTalent) return <AccessDeniedScreen requiredTalent="Müzik" backLink="/atolyeler/muzik-sinav" backLabel="Tanıtım Sayfasına Dön" userTalents={userTalents.length > 0 ? userTalents : undefined} requiredIncludes={['muzik']} />;

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={() => setIsMobileMenuOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile header */}
                <header className="md:hidden bg-white dark:bg-slate-800 border-b-2 border-black/10 dark:border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyber-blue/10 border-2 border-cyber-blue/20 rounded-lg flex items-center justify-center">
                            <Music className="w-4 h-4 text-cyber-blue" strokeWidth={2.5} />
                        </div>
                        <span className="text-black dark:text-white font-nunito font-extrabold text-sm uppercase tracking-wider">Müzik Sınavı</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="w-9 h-9 bg-gray-100 dark:bg-slate-700 border-2 border-black/10 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300"
                    >
                        {isMobileMenuOpen ? <X className="w-4 h-4" strokeWidth={2.5} /> : <Menu className="w-4 h-4" strokeWidth={2.5} />}
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}


function MuzikSinavRoutes() {
    const location = useLocation();
    const isLanding = location.pathname === '/atolyeler/muzik-sinav' || location.pathname === '/atolyeler/muzik-sinav/';

    return (
        <MusicAIProvider>
            <ExamProvider>
                {isLanding ? (
                    <LandingPage />
                ) : (
                    <Routes>
                        <Route element={<TestLayout />}>
                            <Route path="tek-ses" element={<TekSesPage />} />
                            <Route path="cift-ses" element={<CiftSesPage />} />
                            <Route path="ezgi" element={<EzgiPage />} />
                            <Route path="ritim" element={<RitimPage />} />
                            <Route path="sarki" element={<SarkiPage />} />
                            <Route path="uretkenlik" element={<UretkenlikPage />} />
                            <Route path="rapor" element={<ReportPage />} />
                        </Route>
                    </Routes>
                )}
            </ExamProvider>
        </MusicAIProvider>
    );
}

export default MuzikSinavRoutes;
