import React from 'react';
import { Route } from 'react-router-dom';
import RequireAuth from '@/components/RequireAuth';

// Game Pages (Lazy)
const BallGame = React.lazy(() => import('@/pages/BallGame'));
const PartWholeGame = React.lazy(() => import('@/components/BrainTrainer/PartWholeGame'));
const RotationMatrixGame = React.lazy(() => import('@/components/BrainTrainer/RotationMatrixGame'));
const MagicCubeGame = React.lazy(() => import('@/components/BrainTrainer/MagicCubeGame'));
const CosmicMemoryGame = React.lazy(() => import('@/components/BrainTrainer/CosmicMemoryGame'));
const NBackGame = React.lazy(() => import('@/components/BrainTrainer/NBackGame'));
const ShadowDetectiveGame = React.lazy(() => import('@/components/BrainTrainer/ShadowDetectiveGame'));
const CrossMatchGame = React.lazy(() => import('@/components/BrainTrainer/CrossMatchGame'));
const TargetGridGame = React.lazy(() => import('@/components/BrainTrainer/TargetGridGame'));
const StreamSumGame = React.lazy(() => import('@/components/BrainTrainer/StreamSumGame'));
const InvisibleTowerGame = React.lazy(() => import('@/components/BrainTrainer/InvisibleTowerGame'));
const MatrixEchoGame = React.lazy(() => import('@/components/BrainTrainer/MatrixEchoGame'));
const ReflectionSumGame = React.lazy(() => import('@/components/BrainTrainer/ReflectionSumGame'));
const MazeGame = React.lazy(() => import('@/components/BrainTrainer/MazeGame'));
const StroopGame = React.lazy(() => import('@/components/BrainTrainer/StroopGame'));
const DirectionStroopGame = React.lazy(() => import('@/components/BrainTrainer/DirectionStroopGame'));
const EmojiStroopGame = React.lazy(() => import('@/components/BrainTrainer/EmojiStroopGame'));
const PencilStroopGame = React.lazy(() => import('@/components/BrainTrainer/PencilStroopGame'));
const SymbolMatchGame = React.lazy(() => import('@/components/BrainTrainer/SymbolMatchGame'));
const DualBindGame = React.lazy(() => import('@/components/BrainTrainer/DualBindGame'));
const NumberSequenceGame = React.lazy(() => import('@/components/BrainTrainer/NumberSequenceGame'));
const VerbalAnalogyGame = React.lazy(() => import('@/components/BrainTrainer/VerbalAnalogyGame'));
const SynonymGame = React.lazy(() => import('@/components/BrainTrainer/SynonymGame'));
const SentenceSynonymGame = React.lazy(() => import('@/components/BrainTrainer/SentenceSynonymGame'));
const DigitSymbolGame = React.lazy(() => import('@/components/BrainTrainer/DigitSymbolGame'));
const VisualScanningGame = React.lazy(() => import('@/components/BrainTrainer/VisualScanningGame'));
const AuditoryMemoryGame = React.lazy(() => import('@/components/BrainTrainer/AuditoryMemoryGame'));
const NumberMemoryGame = React.lazy(() => import('@/components/BrainTrainer/NumberMemoryGame'));
const NumberCipherGame = React.lazy(() => import('@/components/BrainTrainer/NumberCipherGame'));
const MathMagicGame = React.lazy(() => import('@/components/BrainTrainer/MathMagicGame'));
const NoiseFilterGame = React.lazy(() => import('@/components/BrainTrainer/NoiseFilterGame'));
const ReactionTimeGame = React.lazy(() => import('@/components/BrainTrainer/ReactionTimeGame'));
const FaceExpressionGame = React.lazy(() => import('@/components/BrainTrainer/FaceExpressionGame'));
const KnowledgeCardGame = React.lazy(() => import('@/components/BrainTrainer/KnowledgeCardGame'));
const PuzzleMasterGame = React.lazy(() => import('@/components/BrainTrainer/PuzzleMasterGame'));
const PatternPainterGame = React.lazy(() => import('@/components/BrainTrainer/PatternPainterGame'));
const MatrixPuzzleGame = React.lazy(() => import('@/components/BrainTrainer/MatrixPuzzleGame'));
const VisualAlgebraGame = React.lazy(() => import('@/components/BrainTrainer/VisualAlgebraGame'));
const PatternIQGame = React.lazy(() => import('@/components/BrainTrainer/PatternIQGame'));
const PositionPuzzleGame = React.lazy(() => import('@/components/BrainTrainer/PositionPuzzleGame'));
const MindMatchGame = React.lazy(() => import('@/components/BrainTrainer/MindMatchGame'));

/**
 * Brain Trainer Game Routes
 * All /games/* routes - protected, require authentication
 */
export const gameRoutes = [
    <Route key="ball-game" path="/ball-game" element={<RequireAuth><BallGame /></RequireAuth>} />,
    <Route key="parca-butun" path="/games/parca-butun" element={<RequireAuth><PartWholeGame /></RequireAuth>} />,
    <Route key="rotasyon" path="/games/rotasyon-matrisi" element={<RequireAuth><RotationMatrixGame /></RequireAuth>} />,
    <Route key="kupler" path="/games/sihirli-kupler" element={<RequireAuth><MagicCubeGame /></RequireAuth>} />,
    <Route key="kozmik" path="/games/kozmik-hafiza" element={<RequireAuth><CosmicMemoryGame /></RequireAuth>} />,
    <Route key="nback" path="/games/n-geri-sifresi" element={<RequireAuth><NBackGame /></RequireAuth>} />,
    <Route key="golge" path="/games/golge-dedektifi" element={<RequireAuth><ShadowDetectiveGame /></RequireAuth>} />,
    <Route key="capraz" path="/games/capraz-eslesme" element={<RequireAuth><CrossMatchGame /></RequireAuth>} />,
    <Route key="hedef" path="/games/hedef-sayi" element={<RequireAuth><TargetGridGame /></RequireAuth>} />,
    <Route key="akiskan" path="/games/akiskan-toplam" element={<RequireAuth><StreamSumGame /></RequireAuth>} />,
    <Route key="sihirbaz" path="/games/sayi-sihirbazi" element={<RequireAuth><MathMagicGame /></RequireAuth>} />,
    <Route key="kule" path="/games/gorunmez-kule" element={<RequireAuth><InvisibleTowerGame /></RequireAuth>} />,
    <Route key="matris" path="/games/matris-yankisi" element={<RequireAuth><MatrixEchoGame /></RequireAuth>} />,
    <Route key="yansima" path="/games/yansima-toplami" element={<RequireAuth><ReflectionSumGame /></RequireAuth>} />,
    <Route key="labirent" path="/games/labirent" element={<RequireAuth><MazeGame /></RequireAuth>} />,
    <Route key="stroop" path="/games/stroop" element={<RequireAuth><StroopGame /></RequireAuth>} />,
    <Route key="yon" path="/games/yon-stroop" element={<RequireAuth><DirectionStroopGame /></RequireAuth>} />,
    <Route key="sekil" path="/games/sekil-hafizasi" element={<RequireAuth><SymbolMatchGame /></RequireAuth>} />,
    <Route key="cift" path="/games/cift-mod-hafiza" element={<RequireAuth><DualBindGame /></RequireAuth>} />,
    <Route key="emoji" path="/games/emoji-stroop" element={<RequireAuth><EmojiStroopGame /></RequireAuth>} />,
    <Route key="kalem" path="/games/renkli-kalemler" element={<RequireAuth><PencilStroopGame /></RequireAuth>} />,
    <Route key="dizi" path="/games/sayisal-dizi" element={<RequireAuth><NumberSequenceGame /></RequireAuth>} />,
    <Route key="analoji" path="/games/sozel-analoji" element={<RequireAuth><VerbalAnalogyGame /></RequireAuth>} />,
    <Route key="es" path="/games/es-anlam" element={<RequireAuth><SynonymGame /></RequireAuth>} />,
    <Route key="cumle" path="/games/cumle-ici-es-anlam" element={<RequireAuth><SentenceSynonymGame /></RequireAuth>} />,
    <Route key="simge" path="/games/simge-kodlama" element={<RequireAuth><DigitSymbolGame /></RequireAuth>} />,
    <Route key="tarama" path="/games/gorsel-tarama" element={<RequireAuth><VisualScanningGame /></RequireAuth>} />,
    <Route key="isitsel" path="/games/isitsel-hafiza" element={<RequireAuth><AuditoryMemoryGame /></RequireAuth>} />,
    <Route key="sayisal" path="/games/sayisal-hafiza" element={<RequireAuth><NumberMemoryGame /></RequireAuth>} />,
    <Route key="tepki" path="/games/tepki-suresi" element={<RequireAuth><ReactionTimeGame /></RequireAuth>} />,
    <Route key="yuz" path="/games/yuz-ifadesi" element={<RequireAuth><FaceExpressionGame /></RequireAuth>} />,
    <Route key="bilgi" path="/games/bilgi-kartlari" element={<RequireAuth><KnowledgeCardGame /></RequireAuth>} />,
    <Route key="puzzle" path="/games/puzzle-master" element={<RequireAuth><PuzzleMasterGame /></RequireAuth>} />,
    <Route key="sifre" path="/games/sayisal-sifre" element={<RequireAuth><NumberCipherGame /></RequireAuth>} />,
    <Route key="gurultu" path="/games/gurultu-filtresi" element={<RequireAuth><NoiseFilterGame /></RequireAuth>} />,
    <Route key="desen" path="/games/desen-boyama" element={<RequireAuth><PatternPainterGame /></RequireAuth>} />,
    <Route key="matris-bulmaca" path="/games/matris-bulmaca" element={<RequireAuth><MatrixPuzzleGame /></RequireAuth>} />,
    <Route key="gorsel-cebir" path="/games/gorsel-cebir-dengesi" element={<RequireAuth><VisualAlgebraGame /></RequireAuth>} />,
    <Route key="patterniq" path="/games/patterniq-express" element={<RequireAuth><PatternIQGame /></RequireAuth>} />,
    <Route key="konum" path="/games/konum-bulmaca" element={<RequireAuth><PositionPuzzleGame /></RequireAuth>} />,
    <Route key="mindmatch" path="/games/mindmatch-oruntu" element={<RequireAuth><MindMatchGame /></RequireAuth>} />,
];
