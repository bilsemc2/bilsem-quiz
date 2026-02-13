import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { HelmetProvider } from 'react-helmet-async'

// Tema başlangıcı: localStorage ve sistem tercihine göre dark sınıfı ekle/çıkar
const rootElement = document.documentElement;
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  rootElement.classList.add('dark');
} else {
  rootElement.classList.remove('dark');
}

import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { XPProvider } from './contexts/XPContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <XPProvider>
          <App />
        </XPProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
)

// React yüklendikten sonra loading screen'i kaldır
const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('hidden');
    // Animasyon bittikten sonra DOM'dan kaldır
    setTimeout(() => loader.remove(), 400);
  }
};

// React render tamamlandığında çalıştır
requestAnimationFrame(() => {
  requestAnimationFrame(hideLoader);
});

// PWA Service Worker kaydı
const updateSW = registerSW({
  onNeedRefresh() {
    // Custom güncelleme banner'ı (native confirm() yerine)
    const existing = document.getElementById('pwa-update-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
      display: flex; align-items: center; justify-content: center; gap: 12px;
      padding: 14px 20px;
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
      box-shadow: 0 4px 20px rgba(99,102,241,0.4), inset 0 -2px 6px rgba(0,0,0,0.15);
      color: white; font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px; font-weight: 600;
      transform: translateY(-100%);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;
    banner.innerHTML = `
      <span style="flex:1;text-align:center;">🚀 Yeni güncelleme mevcut!</span>
      <button id="pwa-update-btn" style="
        padding: 8px 20px; border-radius: 12px; border: none; cursor: pointer;
        background: rgba(255,255,255,0.95); color: #6366F1;
        font-weight: 700; font-size: 13px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: transform 0.15s;
      ">Güncelle</button>
      <button id="pwa-dismiss-btn" style="
        padding: 6px; border-radius: 8px; border: none; cursor: pointer;
        background: rgba(255,255,255,0.2); color: white;
        font-size: 18px; line-height: 1; width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.15s;
      ">✕</button>
    `;
    document.body.appendChild(banner);

    // Slide in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { banner.style.transform = 'translateY(0)'; });
    });

    document.getElementById('pwa-update-btn')!.onclick = () => updateSW(true);
    document.getElementById('pwa-dismiss-btn')!.onclick = () => {
      banner.style.transform = 'translateY(-100%)';
      setTimeout(() => banner.remove(), 400);
    };
  },
  onOfflineReady() {
    console.log('Uygulama çevrimdışı kullanıma hazır!');
  }
});
