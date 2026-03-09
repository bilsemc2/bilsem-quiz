import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import { hideLoaderAfterRender } from '@/app/bootstrap/loader';
import { applyInitialTheme } from '@/app/bootstrap/theme';
import { RootProviders } from '@/app/providers/RootProviders';

import './index.css';
import App from './App.tsx';

applyInitialTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootProviders>
      <App />
    </RootProviders>
  </React.StrictMode>,
);

hideLoaderAfterRender();

const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent('pwa-refresh-available', {
        detail: () => updateSW(true),
      }),
    );
  },
  onOfflineReady() {
    return undefined;
  },
});
