import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import RequireAuth from '@/components/RequireAuth';

// Workshop Pages (Lazy)
const GenelYetenekPage = React.lazy(() => import('@/pages/workshops/GenelYetenekPage'));
const ResimPage = React.lazy(() => import('@/pages/workshops/ResimPage'));
const MuzikSinavRoutes = React.lazy(() => import('@/pages/workshops/muzik-sinav/MuzikSinavRoutes'));
const TabletAssessmentPage = React.lazy(() => import('@/pages/workshops/TabletAssessmentPage'));
const IndividualAssessmentPage = React.lazy(() => import('@/pages/workshops/IndividualAssessmentPage'));
const ExamSimulatorPage = React.lazy(() => import('@/pages/workshops/ExamSimulatorPage'));
const ExamContinuePage = React.lazy(() => import('@/pages/workshops/ExamContinuePage'));
const ExamResultPage = React.lazy(() => import('@/pages/workshops/ExamResultPage'));

/**
 * Workshop (Atölye) Routes
 * All /atolyeler/* routes - some public, some protected
 */
export const workshopRoutes = [
    // Public Workshop Landing Pages
    <Route key="genel" path="/atolyeler/genel-yetenek" element={<GenelYetenekPage />} />,
    <Route key="resim" path="/atolyeler/resim" element={<ResimPage />} />,
    // Redirect old /atolyeler/muzik to muzik-sinav
    <Route key="muzik-redirect" path="/atolyeler/muzik" element={<Navigate to="/atolyeler/muzik-sinav" replace />} />,
    <Route key="muzik-redirect-sub" path="/atolyeler/muzik/*" element={<Navigate to="/atolyeler/muzik-sinav" replace />} />,
    // Music Exam (AI-powered)
    <Route key="muzik-sinav" path="/atolyeler/muzik-sinav" element={<MuzikSinavRoutes />} />,
    <Route key="muzik-sinav-sub" path="/atolyeler/muzik-sinav/*" element={<MuzikSinavRoutes />} />,
    <Route key="tablet" path="/atolyeler/tablet-degerlendirme" element={<RequireAuth><TabletAssessmentPage /></RequireAuth>} />,
    <Route key="bireysel" path="/atolyeler/bireysel-degerlendirme" element={<RequireAuth><IndividualAssessmentPage /></RequireAuth>} />,
    <Route key="simul" path="/atolyeler/sinav-simulasyonu" element={<RequireAuth><ExamSimulatorPage /></RequireAuth>} />,
    <Route key="devam" path="/atolyeler/sinav-simulasyonu/devam" element={<RequireAuth><ExamContinuePage /></RequireAuth>} />,
    <Route key="sonuc" path="/atolyeler/sinav-simulasyonu/sonuc" element={<RequireAuth><ExamResultPage /></RequireAuth>} />,
];
