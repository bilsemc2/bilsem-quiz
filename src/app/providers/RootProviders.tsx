import type { PropsWithChildren } from 'react';
import { HelmetProvider } from 'react-helmet-async';

import { AuthProvider } from '@/contexts/AuthContext';
import { XPProvider } from '@/contexts/XPContext';

export function RootProviders({ children }: PropsWithChildren) {
  return (
    <HelmetProvider>
      <AuthProvider>
        <XPProvider>{children}</XPProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
