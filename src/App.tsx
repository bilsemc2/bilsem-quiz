import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import { ExamProvider } from './contexts/ExamContext';
import { SoundProvider } from './contexts/SoundContext';
import { Toaster, toast } from 'sonner';
import AdminMessageNotification from './components/AdminMessageNotification';
import GlobalXPTimer from './components/GlobalXPTimer';
import PushNotificationPrompt from './components/PushNotificationPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import UpdatePrompt from './components/UpdateNotification/UpdatePrompt';
import ScrollToTop from './components/ScrollToTop';

// Route Modules
import {
  authRoutes,
  gameRoutes,
  arcadeRoutes,
  workshopRoutes,
  contentRoutes,
  infoRoutes,
  adminRoutes
} from './routes';

// ============================================
// LOADING FALLBACK COMPONENT
// ============================================
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-cyber-emerald border-2 border-black/10 rounded-lg animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-4 h-4 bg-cyber-gold border-2 border-black/10 rounded-lg animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-4 h-4 bg-cyber-pink border-2 border-black/10 rounded-lg animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <p className="text-slate-600 dark:text-slate-400 font-nunito font-extrabold uppercase tracking-wider text-sm">Yükleniyor... 🚀</p>
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
    <div className="min-h-screen bg-[#F8F6F0] dark:bg-slate-950 flex flex-col">
      <NavBar />
      <main className="flex-1 pt-16">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Ana Sayfa */}
            <Route path="/" element={<HomePage />} />

            {/* Auth Routes */}
            {authRoutes}

            {/* Info Routes (Public) */}
            {infoRoutes}

            {/* Content Routes */}
            {contentRoutes}

            {/* Admin Routes */}
            {adminRoutes}

            {/* Workshop Routes */}
            {workshopRoutes}

            {/* Brain Trainer Game Routes */}
            {gameRoutes}

            {/* Arcade (BİLSEM Zeka) Routes */}
            {arcadeRoutes}

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
    <ErrorBoundary>
      <SoundProvider>
        <Toaster
          position="top-center"
          duration={4000}
          richColors
          closeButton
        />
        <Router>
          <ScrollToTop />
          <ExamProvider>
            <AdminMessageNotification />
            <UpdatePrompt />
            <GlobalXPTimer />
            <PushNotificationPrompt />
            <LocationAwareRouter />
          </ExamProvider>
        </Router>
      </SoundProvider>
    </ErrorBoundary>
  );
}

export default App;
