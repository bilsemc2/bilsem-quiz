import type { PropsWithChildren } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';

import AdminMessageNotification from '@/components/AdminMessageNotification';
import ErrorBoundary from '@/components/ErrorBoundary';
import GlobalXPTimer from '@/components/GlobalXPTimer';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import ScrollToTop from '@/components/ScrollToTop';
import UpdatePrompt from '@/components/UpdateNotification/UpdatePrompt';
import { ExamProvider } from '@/contexts/ExamContext';
import { SoundProvider } from '@/contexts/SoundContext';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <SoundProvider>
        <Toaster position="top-center" duration={4000} richColors closeButton />
        <Router>
          <ScrollToTop />
          <ExamProvider>
            <AdminMessageNotification />
            <UpdatePrompt />
            <GlobalXPTimer />
            <PushNotificationPrompt />
            {children}
          </ExamProvider>
        </Router>
      </SoundProvider>
    </ErrorBoundary>
  );
}
