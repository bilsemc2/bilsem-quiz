import React from 'react';
import { Route } from 'react-router-dom';
import RequireAuth from '@/components/RequireAuth';

// Arcade Games (Lazy)
const ArcadeHubPage = React.lazy(() => import('@/pages/Arcade/ArcadeHubPage'));
const DarkMaze = React.lazy(() => import('@/components/Arcade/Games/DarkMaze/DarkMaze'));
const RenkliBalon = React.lazy(() => import('@/components/Arcade/Games/RenkliBalon/RenkliBalon'));
const TersNavigator = React.lazy(() => import('@/components/Arcade/Games/TersNavigator/TersNavigator'));
const AynaUstasi = React.lazy(() => import('@/components/Arcade/Games/Ayna/AynaUstasi'));
const KraftOrigami = React.lazy(() => import('@/components/Arcade/Games/paper/KraftOrigami'));
const LabirentUstasi = React.lazy(() => import('@/components/Arcade/Games/labirent/LabirentUstasi'));
const OruntuluTop = React.lazy(() => import('@/components/Arcade/Games/OruntuluTop/OruntuluTop'));
const KartDedektifi = React.lazy(() => import('@/components/Arcade/Games/KartDedektifi/KartDedektifi'));
const NeseliBalonlar = React.lazy(() => import('@/components/Arcade/Games/NeseliBalonlar/NeseliBalonlar'));
const ChromaBreak = React.lazy(() => import('@/components/Arcade/Games/chromabreak/ChromaBreak'));
const YolBulmaca = React.lazy(() => import('@/components/Arcade/Games/YolBulmaca/YolBulmaca'));
const RenkliLambalar = React.lazy(() => import('@/components/Arcade/Games/RenkliLambalar/RenkliLambalar'));
const ChromaHafiza = React.lazy(() => import('@/components/Arcade/Games/ChromaHafiza/ChromaHafiza'));

/**
 * Arcade (BİLSEM Zeka) Routes
 * All /bilsem-zeka/* routes - protected, require authentication
 */
export const arcadeRoutes = [
    <Route key="hub" path="/bilsem-zeka" element={<RequireAuth><ArcadeHubPage /></RequireAuth>} />,
    <Route key="karanlik" path="/bilsem-zeka/karanlik-labirent" element={<RequireAuth><DarkMaze /></RequireAuth>} />,
    <Route key="balon" path="/bilsem-zeka/renkli-balon" element={<RequireAuth><RenkliBalon /></RequireAuth>} />,
    <Route key="ters" path="/bilsem-zeka/ters-navigator" element={<RequireAuth><TersNavigator /></RequireAuth>} />,
    <Route key="ayna" path="/bilsem-zeka/ayna-ustasi" element={<RequireAuth><AynaUstasi /></RequireAuth>} />,
    <Route key="kraft" path="/bilsem-zeka/kraft-origami" element={<RequireAuth><KraftOrigami /></RequireAuth>} />,
    <Route key="labirent" path="/bilsem-zeka/labirent-ustasi" element={<RequireAuth><LabirentUstasi /></RequireAuth>} />,
    <Route key="top" path="/bilsem-zeka/oruntulu-top" element={<RequireAuth><OruntuluTop /></RequireAuth>} />,
    <Route key="kart" path="/bilsem-zeka/kart-dedektifi" element={<RequireAuth><KartDedektifi /></RequireAuth>} />,
    <Route key="neseli" path="/bilsem-zeka/neseli-balonlar" element={<RequireAuth><NeseliBalonlar /></RequireAuth>} />,
    <Route key="chroma" path="/bilsem-zeka/chromabreak" element={<RequireAuth><ChromaBreak /></RequireAuth>} />,
    <Route key="yol" path="/bilsem-zeka/yol-bulmaca" element={<RequireAuth><YolBulmaca /></RequireAuth>} />,
    <Route key="lambalar" path="/bilsem-zeka/renkli-lambalar" element={<RequireAuth><RenkliLambalar /></RequireAuth>} />,
    <Route key="hafiza" path="/bilsem-zeka/chroma-hafiza" element={<RequireAuth><ChromaHafiza /></RequireAuth>} />,
];
