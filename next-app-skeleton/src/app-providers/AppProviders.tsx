'use client';

import type { PropsWithChildren } from 'react';

import { WebVitalsReporter } from '@/shared/monitoring/WebVitalsReporter';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      <WebVitalsReporter />
      {children}
    </>
  );
}
