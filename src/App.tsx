import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import { AuthProvider } from './contexts/AuthContext';
import { ExamProvider } from './contexts/ExamContext';
import { SoundProvider } from './contexts/SoundContext';
import { Toaster, toast } from 'sonner';
import AdminMessageNotification from './components/AdminMessageNotification';
import GlobalXPTimer from './components/GlobalXPTimer';
import ErrorBoundary from './components/ErrorBoundary';

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
      <AuthProvider>
        <SoundProvider>
          <Toaster
            position="top-center"
            duration={4000}
            richColors
            closeButton
          />
          <Router>
            <ExamProvider>
              <AdminMessageNotification />
              <GlobalXPTimer />
              <LocationAwareRouter />
            </ExamProvider>
          </Router>
        </SoundProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
