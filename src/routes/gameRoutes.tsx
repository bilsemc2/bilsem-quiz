import React from 'react';
import { Route } from 'react-router-dom';
import { protectElement } from '@/components/guards/protectElement';

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
const LogicPuzzleGame = React.lazy(() => import('@/components/BrainTrainer/LogicPuzzleGame'));
const LastLetterGame = React.lazy(() => import('@/components/BrainTrainer/LastLetterGame'));
const ConditionalLogicGame = React.lazy(() => import('@/components/BrainTrainer/ConditionalLogicGame'));
const CreatureLogicGame = React.lazy(() => import('@/components/BrainTrainer/CreatureLogicGame'));
const SymbolSearchGame = React.lazy(() => import('@/components/BrainTrainer/SymbolSearchGame'));
const AttentionCodingGame = React.lazy(() => import('@/components/BrainTrainer/AttentionCodingGame'));
const PerceptualSpeedGame = React.lazy(() => import('@/components/BrainTrainer/PerceptualSpeedGame'));
const LaserMazeGame = React.lazy(() => import('@/components/BrainTrainer/LaserMazeGame'));

const VisualMemoryGame = React.lazy(() => import('@/components/BrainTrainer/VisualMemoryGame'));
const MathGridGame = React.lazy(() => import('@/components/BrainTrainer/MathGridGame'));
const WordHuntGame = React.lazy(() => import('@/components/BrainTrainer/WordHuntGame'));
const SpotDifferenceGame = React.lazy(() => import('@/components/BrainTrainer/SpotDifferenceGame'));
const TimeExplorerGame = React.lazy(() => import('@/components/BrainTrainer/TimeExplorerGame'));
const ShapeAlgebraGame = React.lazy(() => import('@/components/BrainTrainer/ShapeAlgebraGame'));
const LazerHafizaGame = React.lazy(() => import('@/components/BrainTrainer/LazerHafizaGame'));
const MazeRunnerGame = React.lazy(() => import('@/components/BrainTrainer/MazeRunnerGame'));
const DeyimlerGame = React.lazy(() => import('@/components/BrainTrainer/DeyimlerGame'));

/**
 * Brain Trainer Game Routes
 * All /games/* routes - protected, require authentication
 */
export const gameRoutes = [
    <Route key="ball-game" path="/ball-game" element={protectElement(<BallGame />)} />,
    <Route key="parca-butun" path="/games/parca-butun" element={protectElement(<PartWholeGame />)} />,
    <Route key="rotasyon" path="/games/rotasyon-matrisi" element={protectElement(<RotationMatrixGame />)} />,
    <Route key="kupler" path="/games/sihirli-kupler" element={protectElement(<MagicCubeGame />)} />,
    <Route key="kozmik" path="/games/kozmik-hafiza" element={protectElement(<CosmicMemoryGame />)} />,
    <Route key="nback" path="/games/n-geri-sifresi" element={protectElement(<NBackGame />)} />,
    <Route key="golge" path="/games/golge-dedektifi" element={protectElement(<ShadowDetectiveGame />)} />,
    <Route key="capraz" path="/games/capraz-eslesme" element={protectElement(<CrossMatchGame />)} />,
    <Route key="hedef" path="/games/hedef-sayi" element={protectElement(<TargetGridGame />)} />,
    <Route key="akiskan" path="/games/akiskan-toplam" element={protectElement(<StreamSumGame />)} />,
    <Route key="sihirbaz" path="/games/sayi-sihirbazi" element={protectElement(<MathMagicGame />)} />,
    <Route key="kule" path="/games/gorunmez-kule" element={protectElement(<InvisibleTowerGame />)} />,
    <Route key="matris" path="/games/matris-yankisi" element={protectElement(<MatrixEchoGame />)} />,
    <Route key="yansima" path="/games/yansima-toplami" element={protectElement(<ReflectionSumGame />)} />,
    <Route key="stroop" path="/games/stroop" element={protectElement(<StroopGame />)} />,
    <Route key="yon" path="/games/yon-stroop" element={protectElement(<DirectionStroopGame />)} />,
    <Route key="sekil" path="/games/sekil-hafizasi" element={protectElement(<SymbolMatchGame />)} />,
    <Route key="cift" path="/games/cift-mod-hafiza" element={protectElement(<DualBindGame />)} />,
    <Route key="emoji" path="/games/emoji-stroop" element={protectElement(<EmojiStroopGame />)} />,
    <Route key="kalem" path="/games/renkli-kalemler" element={protectElement(<PencilStroopGame />)} />,
    <Route key="dizi" path="/games/sayisal-dizi" element={protectElement(<NumberSequenceGame />)} />,
    <Route key="analoji" path="/games/sozel-analoji" element={protectElement(<VerbalAnalogyGame />)} />,
    <Route key="es" path="/games/es-anlam" element={protectElement(<SynonymGame />)} />,
    <Route key="cumle" path="/games/cumle-ici-es-anlam" element={protectElement(<SentenceSynonymGame />)} />,
    <Route key="simge" path="/games/simge-kodlama" element={protectElement(<DigitSymbolGame />)} />,
    <Route key="tarama" path="/games/gorsel-tarama" element={protectElement(<VisualScanningGame />)} />,
    <Route key="isitsel" path="/games/isitsel-hafiza" element={protectElement(<AuditoryMemoryGame />)} />,
    <Route key="sayisal" path="/games/sayisal-hafiza" element={protectElement(<NumberMemoryGame />)} />,
    <Route key="tepki" path="/games/tepki-suresi" element={protectElement(<ReactionTimeGame />)} />,
    <Route key="yuz" path="/games/yuz-ifadesi" element={protectElement(<FaceExpressionGame />)} />,
    <Route key="bilgi" path="/games/bilgi-kartlari" element={protectElement(<KnowledgeCardGame />)} />,
    <Route key="puzzle" path="/games/puzzle-master" element={protectElement(<PuzzleMasterGame />)} />,
    <Route key="sifre" path="/games/sayisal-sifre" element={protectElement(<NumberCipherGame />)} />,
    <Route key="gurultu" path="/games/gurultu-filtresi" element={protectElement(<NoiseFilterGame />)} />,
    <Route key="desen" path="/games/desen-boyama" element={protectElement(<PatternPainterGame />)} />,
    <Route key="matris-bulmaca" path="/games/matris-bulmaca" element={protectElement(<MatrixPuzzleGame />)} />,
    <Route key="gorsel-cebir" path="/games/gorsel-cebir-dengesi" element={protectElement(<VisualAlgebraGame />)} />,
    <Route key="patterniq" path="/games/patterniq-express" element={protectElement(<PatternIQGame />)} />,
    <Route key="konum" path="/games/konum-bulmaca" element={protectElement(<PositionPuzzleGame />)} />,
    <Route key="mindmatch" path="/games/mindmatch-oruntu" element={protectElement(<MindMatchGame />)} />,
    <Route key="mantik-bulmaca" path="/games/mantik-bulmacasi" element={protectElement(<LogicPuzzleGame />)} />,
    <Route key="son-harf" path="/games/son-harf-ustasi" element={protectElement(<LastLetterGame />)} />,
    <Route key="kosullu-yonerge" path="/games/kosullu-yonerge" element={protectElement(<ConditionalLogicGame />)} />,
    <Route key="yaratik-mantigi" path="/games/yaratik-mantigi" element={protectElement(<CreatureLogicGame />)} />,
    <Route key="sembol-arama" path="/games/sembol-arama" element={protectElement(<SymbolSearchGame />)} />,
    <Route key="dikkat-ve-kodlama" path="/games/dikkat-ve-kodlama" element={protectElement(<AttentionCodingGame />)} />,
    <Route key="algisal-hiz" path="/games/algisal-hiz" element={protectElement(<PerceptualSpeedGame />)} />,
    <Route key="lazer-labirent" path="/games/lazer-labirent" element={protectElement(<LaserMazeGame />)} />,

    <Route key="gorsel-hafiza" path="/games/gorsel-hafiza" element={protectElement(<VisualMemoryGame />)} />,
    <Route key="matematik-grid" path="/games/matematik-grid" element={protectElement(<MathGridGame />)} />,
    <Route key="kelime-avi" path="/games/kelime-avi" element={protectElement(<WordHuntGame />)} />,
    <Route key="farki-bul" path="/games/farki-bul" element={protectElement(<SpotDifferenceGame />)} />,
    <Route key="zaman-gezgini" path="/games/zaman-gezgini" element={protectElement(<TimeExplorerGame />)} />,
    <Route key="sekil-cebiri" path="/games/sekil-cebiri" element={protectElement(<ShapeAlgebraGame />)} />,
    <Route key="lazer-hafiza" path="/games/lazer-hafiza" element={protectElement(<LazerHafizaGame />)} />,
    <Route key="labirent" path="/games/labirent" element={protectElement(<MazeRunnerGame />)} />,
    <Route key="deyimler-oyunu" path="/games/deyimler-oyunu" element={protectElement(<DeyimlerGame />)} />,
];
