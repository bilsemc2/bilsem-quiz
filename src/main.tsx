import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Tema başlangıcı: localStorage ve sistem tercihine göre dark sınıfı ekle/çıkar
const rootElement = document.documentElement;
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  rootElement.classList.add('dark');
} else {
  rootElement.classList.remove('dark');
}

import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
