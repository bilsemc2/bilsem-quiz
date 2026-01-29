import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const menuItems = [
  { path: 'single-note', label: 'Tek Nota', icon: '🎵' },
  { path: 'double-note', label: 'İki Nota', icon: '🎶' },
  { path: 'triple-note', label: 'Üç Nota', icon: '🎼' },
  { path: 'rhythm', label: 'Ritim Tekrarı', icon: '🥁' },
  { path: 'melody', label: 'Melodi Tekrarı', icon: '🎹' },
  { path: 'melody-difference', label: 'Melodi Farkı', icon: '🎸' },
  { path: 'rhythm-difference', label: 'Ritim Farkı', icon: '🎺' },
  { path: 'song-performance', label: 'Şarkı İcrası', icon: '🎤' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  // Aktif item'ı bul (progress bar için)
  const activeIndex = menuItems.findIndex(item =>
    location.pathname.includes(item.path)
  );
  const progress = activeIndex >= 0 ? ((activeIndex + 1) / menuItems.length) * 100 : 0;

  return (
    <aside className="w-64 bg-white border-r h-[calc(100vh-65px)] sticky top-[65px] p-4 hidden md:block overflow-y-auto">
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 p-4 bg-indigo-50 rounded-2xl">
        <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-2">
          İlerleme
        </h4>
        <div className="w-full bg-indigo-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-indigo-600 mt-2 font-medium">
          {activeIndex >= 0 ? `${activeIndex + 1}/${menuItems.length} Test` : '0 Test'}
        </p>
      </div>

      {/* Ana Sayfaya Dön */}
      <NavLink
        to="/atolyeler/muzik"
        end
        className="mt-4 flex items-center space-x-2 px-4 py-2 text-sm text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <span>←</span>
        <span>Ana Sayfaya Dön</span>
      </NavLink>
    </aside>
  );
};
