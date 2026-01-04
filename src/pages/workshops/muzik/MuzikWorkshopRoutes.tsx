import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ResultsProvider } from './contexts/ResultsContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { AudioProvider } from './contexts/AudioContext';
import { ModalProvider } from './contexts/ModalContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Sidebar as MuzikSidebar } from './components';

// Pages
import MuzikPage from '../MuzikPage';
import SingleNotePage from './SingleNotePage';
import DoubleNotePage from './DoubleNotePage';
import TripleNotePage from './TripleNotePage';
import RhythmPage from './RhythmPage';
import MelodyPage from './MelodyPage';
import MelodyDifferencePage from './MelodyDifferencePage';
import RhythmDifferencePage from './RhythmDifferencePage';
import SongPerformancePage from './SongPerformancePage';
import MuzikFinishPage from './FinishPage';
import MuzikReportPage from './ReportPage';

/**
 * Müzik Atölyesi için tüm provider'ları ve alt rotaları içeren sarmalayıcı bileşen.
 * Bu bileşen App.tsx'te lazy load edilerek Tone.js gibi ağır kütüphanelerin
 * ana sayfada (veya atölye dışındaki sayfalarda) yüklenmesi ve hata vermesi önlenir.
 */
const MuzikWorkshopRoutes: React.FC = () => {
    return (
        <AudioProvider>
            <div className="muzik-workshop-container">
                {/* Background Blobs */}
                <div className="muzik-bg-blobs">
                    <div className="muzik-blob muzik-blob-1" />
                    <div className="muzik-blob muzik-blob-2" />
                    <div className="muzik-blob muzik-blob-3" />
                </div>

                <Routes>
                    {/* Atölye Giriş Sayfası */}
                    <Route index element={<MuzikPage />} />

                    {/* Atölye Test Sayfaları (SideBar ve diğer Provider'lar ile) */}
                    <Route path="*" element={
                        <ResultsProvider>
                            <ProgressProvider>
                                <ModalProvider>
                                    <ErrorBoundary>
                                        <div className="flex flex-1 relative z-10">
                                            <MuzikSidebar />
                                            <div className="flex-1 p-4 lg:p-8 overflow-y-auto muzik-content-wrapper">
                                                <Routes>
                                                    <Route path="single-note" element={<SingleNotePage />} />
                                                    <Route path="double-note" element={<DoubleNotePage />} />
                                                    <Route path="triple-note" element={<TripleNotePage />} />
                                                    <Route path="rhythm" element={<RhythmPage />} />
                                                    <Route path="melody" element={<MelodyPage />} />
                                                    <Route path="melody-difference" element={<MelodyDifferencePage />} />
                                                    <Route path="rhythm-difference" element={<RhythmDifferencePage />} />
                                                    <Route path="song-performance" element={<SongPerformancePage />} />
                                                    <Route path="finish" element={<MuzikFinishPage />} />
                                                    <Route path="report" element={<MuzikReportPage />} />
                                                </Routes>
                                            </div>
                                        </div>
                                    </ErrorBoundary>
                                </ModalProvider>
                            </ProgressProvider>
                        </ResultsProvider>
                    } />
                </Routes>
            </div>
        </AudioProvider>
    );
};

export default MuzikWorkshopRoutes;
