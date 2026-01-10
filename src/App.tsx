import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';
import { SoundProvider } from './contexts/SoundContext';
import RequireAuth from './components/RequireAuth';
import { Toaster } from 'react-hot-toast';
import AdminMessageNotification from './components/AdminMessageNotification';
import GlobalXPTimer from './components/GlobalXPTimer';
import toast from 'react-hot-toast';

// Muzik Workshop Routes (Lazy)
const MuzikWorkshopRoutes = React.lazy(() => import('./pages/workshops/muzik/MuzikWorkshopRoutes'));

// ============================================
// LAZY LOADED PAGES - Code Splitting
// ============================================

// Auth Pages
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignUpPage = React.lazy(() => import('./pages/SignUpPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));

// Admin Pages
const AdminPage = React.lazy(() => import('./pages/AdminPage'));

// Content Pages
const CreatePdfPage = React.lazy(() => import('./pages/CreatePdfPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const BilsemPage = React.lazy(() => import('./pages/BilsemPage'));
const HomeworkPage = React.lazy(() => import('./pages/HomeworkPage'));
const DeyimlerPage = React.lazy(() => import('./pages/DeyimlerPage'));
const QuizizzCodesPage = React.lazy(() => import('./pages/QuizizzCodesPage'));

// Info Pages
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'));
const HowItWorksPage = React.lazy(() => import('./pages/HowItWorksPage'));
const FAQPage = React.lazy(() => import('./pages/FAQPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));

// Story Pages
const StoryListPage = React.lazy(() => import('./pages/Story/StoryListPage'));
const StoryDetailPage = React.lazy(() => import('./pages/Story/StoryDetailPage'));
const StoryQuizGame = React.lazy(() => import('./pages/Story/StoryQuizGame'));

// Workshop Pages
const GenelYetenekPage = React.lazy(() => import('./pages/workshops/GenelYetenekPage'));
const ResimPage = React.lazy(() => import('./pages/workshops/ResimPage'));
const TabletAssessmentPage = React.lazy(() => import('./pages/workshops/TabletAssessmentPage'));
const IndividualAssessmentPage = React.lazy(() => import('./pages/workshops/IndividualAssessmentPage'));

// Music Workshop Sub-pages are now handled in MuzikWorkshopRoutes.tsx

// Games
const BallGame = React.lazy(() => import('./pages/BallGame'));
const PartWholeGame = React.lazy(() => import('./components/BrainTrainer/PartWholeGame'));
const RotationMatrixGame = React.lazy(() => import('./components/BrainTrainer/RotationMatrixGame'));
const MagicCubeGame = React.lazy(() => import('./components/BrainTrainer/MagicCubeGame'));
const CosmicMemoryGame = React.lazy(() => import('./components/BrainTrainer/CosmicMemoryGame'));
const NBackGame = React.lazy(() => import('./components/BrainTrainer/NBackGame'));
const ShadowDetectiveGame = React.lazy(() => import('./components/BrainTrainer/ShadowDetectiveGame'));
const CrossMatchGame = React.lazy(() => import('./components/BrainTrainer/CrossMatchGame'));
const SignalSumGame = React.lazy(() => import('./components/BrainTrainer/SignalSumGame'));
const TargetGridGame = React.lazy(() => import('./components/BrainTrainer/TargetGridGame'));
const StreamSumGame = React.lazy(() => import('./components/BrainTrainer/StreamSumGame'));
const InvisibleTowerGame = React.lazy(() => import('./components/BrainTrainer/InvisibleTowerGame'));
const MatrixEchoGame = React.lazy(() => import('./components/BrainTrainer/MatrixEchoGame'));
const ReflectionSumGame = React.lazy(() => import('./components/BrainTrainer/ReflectionSumGame'));
const MazeGame = React.lazy(() => import('./components/BrainTrainer/MazeGame'));
const StroopGame = React.lazy(() => import('./components/BrainTrainer/StroopGame'));
const DirectionStroopGame = React.lazy(() => import('./components/BrainTrainer/DirectionStroopGame'));
const EmojiStroopGame = React.lazy(() => import('./components/BrainTrainer/EmojiStroopGame'));
const PencilStroopGame = React.lazy(() => import('./components/BrainTrainer/PencilStroopGame'));
const SymbolMatchGame = React.lazy(() => import('./components/BrainTrainer/SymbolMatchGame'));
const DualBindGame = React.lazy(() => import('./components/BrainTrainer/DualBindGame'));
const NumberSequenceGame = React.lazy(() => import('./components/BrainTrainer/NumberSequenceGame'));
const VerbalAnalogyGame = React.lazy(() => import('./components/BrainTrainer/VerbalAnalogyGame'));
const SynonymGame = React.lazy(() => import('./components/BrainTrainer/SynonymGame'));
const SentenceSynonymGame = React.lazy(() => import('./components/BrainTrainer/SentenceSynonymGame'));
const DigitSymbolGame = React.lazy(() => import('./components/BrainTrainer/DigitSymbolGame'));
const VisualScanningGame = React.lazy(() => import('./components/BrainTrainer/VisualScanningGame'));
const AuditoryMemoryGame = React.lazy(() => import('./components/BrainTrainer/AuditoryMemoryGame'));
const ReactionTimeGame = React.lazy(() => import('./components/BrainTrainer/ReactionTimeGame'));
const FaceExpressionGame = React.lazy(() => import('./components/BrainTrainer/FaceExpressionGame'));
const KnowledgeCardGame = React.lazy(() => import('./components/BrainTrainer/KnowledgeCardGame'));

// ============================================
// LOADING FALLBACK COMPONENT
// ============================================
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-slate-500 dark:text-slate-400 font-medium">Yükleniyor...</p>
    </div>
  </div>
);

// ============================================
// LOCATION AWARE ROUTER
// ============================================
const LocationAwareRouter: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (location?.state?.error) {
      toast.error(location.state.error);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <NavBar />
      <main className="flex-1 pt-16">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Ana Sayfa - Lazy değil, hızlı yüklenmeli */}
            <Route path="/" element={<HomePage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Info Pages */}
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/bilsem" element={<BilsemPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPage />} />

            {/* Protected Routes */}
            <Route path="/deyimler" element={<RequireAuth><DeyimlerPage /></RequireAuth>} />
            <Route path="/create-pdf" element={<RequireAuth><CreatePdfPage /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth skipXPCheck><ProfilePage /></RequireAuth>} />
            <Route path="/homework" element={<RequireAuth><HomeworkPage /></RequireAuth>} />
            <Route path="/quizizz-kodlari" element={<RequireAuth><QuizizzCodesPage /></RequireAuth>} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={<RequireAuth requireAdmin><AdminPage /></RequireAuth>} />

            {/* Story Routes */}
            <Route path="/stories" element={<RequireAuth><StoryListPage /></RequireAuth>} />
            <Route path="/stories/:id" element={<RequireAuth><StoryDetailPage /></RequireAuth>} />
            <Route path="/stories/quiz-game" element={<RequireAuth><StoryQuizGame /></RequireAuth>} />

            {/* Workshop Routes */}
            <Route path="/atolyeler/genel-yetenek" element={<RequireAuth><GenelYetenekPage /></RequireAuth>} />
            <Route path="/atolyeler/resim" element={<RequireAuth><ResimPage /></RequireAuth>} />

            <Route path="/atolyeler/muzik/*" element={<RequireAuth requiredTalent="Müzik"><MuzikWorkshopRoutes /></RequireAuth>} />
            <Route path="/atolyeler/tablet-degerlendirme" element={<RequireAuth><TabletAssessmentPage /></RequireAuth>} />
            <Route path="/atolyeler/bireysel-degerlendirme" element={<RequireAuth><IndividualAssessmentPage /></RequireAuth>} />

            {/* Game Routes */}
            <Route path="/ball-game" element={<RequireAuth><BallGame /></RequireAuth>} />
            <Route path="/games/parca-butun" element={<RequireAuth><PartWholeGame /></RequireAuth>} />
            <Route path="/games/rotasyon-matrisi" element={<RequireAuth><RotationMatrixGame /></RequireAuth>} />
            <Route path="/games/sihirli-kupler" element={<RequireAuth><MagicCubeGame /></RequireAuth>} />
            <Route path="/games/kozmik-hafiza" element={<RequireAuth><CosmicMemoryGame /></RequireAuth>} />
            <Route path="/games/n-geri-sifresi" element={<RequireAuth><NBackGame /></RequireAuth>} />
            <Route path="/games/golge-dedektifi" element={<RequireAuth><ShadowDetectiveGame /></RequireAuth>} />
            <Route path="/games/capraz-eslesme" element={<RequireAuth><CrossMatchGame /></RequireAuth>} />
            <Route path="/games/sinyal-toplami" element={<RequireAuth><SignalSumGame /></RequireAuth>} />
            <Route path="/games/hedef-sayi" element={<RequireAuth><TargetGridGame /></RequireAuth>} />
            <Route path="/games/akiskan-toplam" element={<RequireAuth><StreamSumGame /></RequireAuth>} />
            <Route path="/games/gorunmez-kule" element={<RequireAuth><InvisibleTowerGame /></RequireAuth>} />
            <Route path="/games/matris-yankisi" element={<RequireAuth><MatrixEchoGame /></RequireAuth>} />
            <Route path="/games/yansima-toplami" element={<RequireAuth><ReflectionSumGame /></RequireAuth>} />
            <Route path="/games/labirent" element={<RequireAuth><MazeGame /></RequireAuth>} />
            <Route path="/games/stroop" element={<RequireAuth><StroopGame /></RequireAuth>} />
            <Route path="/games/yon-stroop" element={<RequireAuth><DirectionStroopGame /></RequireAuth>} />
            <Route path="/games/sekil-hafizasi" element={<RequireAuth><SymbolMatchGame /></RequireAuth>} />
            <Route path="/games/cift-mod-hafiza" element={<RequireAuth><DualBindGame /></RequireAuth>} />
            <Route path="/games/emoji-stroop" element={<RequireAuth><EmojiStroopGame /></RequireAuth>} />
            <Route path="/games/renkli-kalemler" element={<RequireAuth><PencilStroopGame /></RequireAuth>} />
            <Route path="/games/sayisal-dizi" element={<RequireAuth><NumberSequenceGame /></RequireAuth>} />
            <Route path="/games/sozel-analoji" element={<RequireAuth><VerbalAnalogyGame /></RequireAuth>} />
            <Route path="/games/es-anlam" element={<RequireAuth><SynonymGame /></RequireAuth>} />
            <Route path="/games/cumle-ici-es-anlam" element={<RequireAuth><SentenceSynonymGame /></RequireAuth>} />
            <Route path="/games/simge-kodlama" element={<RequireAuth><DigitSymbolGame /></RequireAuth>} />
            <Route path="/games/gorsel-tarama" element={<RequireAuth><VisualScanningGame /></RequireAuth>} />
            <Route path="/games/isitsel-hafiza" element={<RequireAuth><AuditoryMemoryGame /></RequireAuth>} />
            <Route path="/games/tepki-suresi" element={<RequireAuth><ReactionTimeGame /></RequireAuth>} />
            <Route path="/games/yuz-ifadesi" element={<RequireAuth><FaceExpressionGame /></RequireAuth>} />
            <Route path="/games/bilgi-kartlari" element={<RequireAuth><KnowledgeCardGame /></RequireAuth>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            className: 'modern-toast',
            success: {
              className: 'modern-toast modern-toast-success',
              iconTheme: { primary: '#10b981', secondary: '#fff' }
            },
            error: {
              className: 'modern-toast modern-toast-error',
              iconTheme: { primary: '#ef4444', secondary: '#fff' }
            }
          }}
        />
        <Router>
          <AdminMessageNotification />
          <GlobalXPTimer />
          <LocationAwareRouter />
        </Router>
      </SoundProvider>
    </AuthProvider>
  );
}

export default App;
