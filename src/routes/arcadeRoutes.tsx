import React from 'react';
import { Route } from 'react-router-dom';
import { protectElement } from '@/components/guards/protectElement';

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
const SevimliMantik = React.lazy(() => import('@/components/Arcade/Games/SevimliMantik/SevimliMantik'));

/**
 * Arcade (BİLSEM Zeka) Routes
 * All /bilsem-zeka/* routes - protected, require authentication
 */
export const arcadeRoutes = [
    <Route key="hub" path="/bilsem-zeka" element={protectElement(<ArcadeHubPage />)} />,
    <Route key="karanlik" path="/bilsem-zeka/karanlik-labirent" element={protectElement(<DarkMaze />)} />,
    <Route key="balon" path="/bilsem-zeka/renkli-balon" element={protectElement(<RenkliBalon />)} />,
    <Route key="ters" path="/bilsem-zeka/ters-navigator" element={protectElement(<TersNavigator />)} />,
    <Route key="ayna" path="/bilsem-zeka/ayna-ustasi" element={protectElement(<AynaUstasi />)} />,
    <Route key="kraft" path="/bilsem-zeka/kraft-origami" element={protectElement(<KraftOrigami />)} />,
    <Route key="labirent" path="/bilsem-zeka/labirent-ustasi" element={protectElement(<LabirentUstasi />)} />,
    <Route key="top" path="/bilsem-zeka/oruntulu-top" element={protectElement(<OruntuluTop />)} />,
    <Route key="kart" path="/bilsem-zeka/kart-dedektifi" element={protectElement(<KartDedektifi />)} />,
    <Route key="neseli" path="/bilsem-zeka/neseli-balonlar" element={protectElement(<NeseliBalonlar />)} />,
    <Route key="chroma" path="/bilsem-zeka/chromabreak" element={protectElement(<ChromaBreak />)} />,
    <Route key="yol" path="/bilsem-zeka/yol-bulmaca" element={protectElement(<YolBulmaca />)} />,
    <Route key="lambalar" path="/bilsem-zeka/renkli-lambalar" element={protectElement(<RenkliLambalar />)} />,
    <Route key="hafiza" path="/bilsem-zeka/chroma-hafiza" element={protectElement(<ChromaHafiza />)} />,
    <Route key="sevimli" path="/bilsem-zeka/sevimli-mantik" element={protectElement(<SevimliMantik />)} />,
];
