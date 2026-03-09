import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import Footer from '@/components/Footer';
import NavBar from '@/components/NavBar';
import HomePage from '@/pages/HomePage';
import {
  adminRoutes,
  arcadeRoutes,
  authRoutes,
  contentRoutes,
  gameRoutes,
  infoRoutes,
  workshopRoutes,
} from '@/routes';

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 bg-cyber-emerald border-2 border-black/10 rounded-lg animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-4 h-4 bg-cyber-gold border-2 border-black/10 rounded-lg animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="w-4 h-4 bg-cyber-pink border-2 border-black/10 rounded-lg animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <p className="text-slate-600 dark:text-slate-400 font-nunito font-extrabold uppercase tracking-wider text-sm">
        Yukleniyor... 🚀
      </p>
    </div>
  </div>
);

function LocationAwareRouter() {
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
            <Route path="/" element={<HomePage />} />
            {authRoutes}
            {infoRoutes}
            {contentRoutes}
            {adminRoutes}
            {workshopRoutes}
            {gameRoutes}
            {arcadeRoutes}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export function AppRouter() {
  return <LocationAwareRouter />;
}
