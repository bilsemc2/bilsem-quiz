// NavBar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Chip from '@mui/material/Chip';

const NavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  // Kullanıcı ve çevrimiçi sayısını kontrol eden useEffect
  useEffect(() => {
    const checkUser = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.is_admin || false);
      } catch (error) {
        console.error("Admin kontrolü yapılırken hata:", error);
        setIsAdmin(false);
      }
    };

    checkUser();

    const updateOnlineCount = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('last_seen');
      if (profiles) {
        const now = Date.now();
        const onlineUsers = profiles.filter(profile =>
          profile.last_seen &&
          now - new Date(profile.last_seen).getTime() < 5 * 60 * 1000
        );
        setOnlineCount(onlineUsers.length);
      }
    };

    updateOnlineCount();
    const interval = setInterval(updateOnlineCount, 30000);

    const channel = supabase
      .channel('online-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          updateOnlineCount();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [user]);

  // Menü öğelerinin tanımı (ortak kullanım için)
  const menuItems = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Bilsem", path: "/bilsemc2" },
    { name: "İletişim", path: "/contact", showWhenNotAuth: true },
    { name: "Quizeka", path: "/quiz", showWhenAuth: true },
    { name: "Düello", path: "/duel", showWhenAuth: true },
    { name: "Admin", path: "/admin", showWhenAuth: true, adminOnly: true },
    { name: "Fiyatlandırma", path: "/pricing" },
    { name: "Öğretmenim", path: "/teacher-pricing" },
  ];

  // Desktop veya mobil menüde kullanılacak menü öğelerini render eden fonksiyon
  const renderMenuItems = () => {
    return menuItems.map(item => {
      if (item.showWhenNotAuth && user) return null;
      if (item.showWhenAuth && !user) return null;
      if (item.adminOnly && !isAdmin) return null;
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
            isActive(item.path)
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
              : "text-gray-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white"
          }`}
        >
          {item.name}
        </Link>
      );
    });
  };

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/bilsemc2.svg"
                alt="Bilsem Sınavı"
                className="w-10 h-10"
              />
              <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                BilsemC2
              </span>
            </Link>
          </div>

          {/* Desktop Menü */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {menuItems.map(item => {
              if (item.showWhenNotAuth && user) return null;
              if (item.showWhenAuth && !user) return null;
              if (item.adminOnly && !isAdmin) return null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-lg font-semibold px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className={`text-lg font-semibold px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive("/profile")
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white"
                  }`}
                >
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-lg font-semibold px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-lg font-semibold px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white"
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/signup"
                  className="text-lg font-semibold px-3 py-2 rounded-lg text-white bg-indigo-600 transition-colors duration-200 hover:bg-indigo-700"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
            <div className="hidden sm:flex items-center">
              <Chip
                icon={<FiberManualRecordIcon sx={{ fontSize: 12, color: 'success.main' }} />}
                label={`${onlineCount} Çevrimiçi`}
                size="small"
                sx={{
                  bgcolor: 'success.light',
                  color: 'success.dark',
                  '& .MuiChip-icon': { color: 'success.main' },
                }}
              />
            </div>
          </div>

          {/* Mobil Menü Butonu */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobil Menü */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-2">
          {renderMenuItems()}
          {user ? (
            <>
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive('/profile')
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white'
                }`}
              >
                Profil
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white"
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white"
              >
                Giriş Yap
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 transition-colors duration-200 hover:bg-indigo-700"
              >
                Kayıt Ol
              </Link>
            </>
          )}
          <Link
            to="/blog"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
              isActive('/blog')
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white'
            }`}
          >
            Blog
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
              isActive('/contact')
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white'
            }`}
          >
            İletişim
          </Link>
        </div>
      )}
    </nav>
  );
}

export default NavBar;