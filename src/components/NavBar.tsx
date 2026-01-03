// NavBar.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Sun, Moon, Menu, X, Circle, User, LogOut, Zap, ChevronDown, Crown, Sparkles } from 'lucide-react';
import { User as AuthUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

// Profile Dropdown Component
interface ProfileDropdownProps {
  isActive: (path: string) => boolean;
  handleLogout: () => void;
  user: AuthUser;
}

const ProfileDropdown = ({ isActive, handleLogout, user }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; avatar_url?: string; experience?: number; is_vip?: boolean } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url, experience, is_vip')
        .eq('id', user.id)
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1.5 pr-3 rounded-full transition-all duration-200 ${isOpen || isActive("/profile")
          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
          : "bg-slate-700/50 hover:bg-slate-600/50 text-white border border-white/10"
          }`}
      >
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm"
        />
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-white/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{profile?.name || 'Kullanıcı'}</p>
                  <p className="text-sm text-white/80 truncate">{user.email}</p>
                </div>
                {profile?.is_vip && (
                  <Crown className="w-5 h-5 text-yellow-300" />
                )}
              </div>
              {/* XP Badge */}
              <div className="mt-3 flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium text-white">{profile?.experience || 0} XP</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <User className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-white">Profilim</span>
              </Link>

              <button
                onClick={() => { setIsOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Çıkış Yap</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setTheme('dark');
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsVip(false);
        return;
      }
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, is_vip')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.is_admin || false);
        setIsVip(profile?.is_vip || false);
      } catch (error) {
        console.error("Kullanıcı bilgileri kontrol edilirken hata:", error);
        setIsAdmin(false);
        setIsVip(false);
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

  const menuItems = [
    { name: "Bilsem", path: "/bilsem" },
    { name: "İletişim", path: "/contact", showWhenNotAuth: true },
    { name: "Admin", path: "/admin", showWhenAuth: true, adminOnly: true },
    { name: "Fiyatlandırma", path: "/pricing", hideWhenVip: true },
  ];

  const shouldShowItem = (item: typeof menuItems[0]) => {
    if (item.showWhenNotAuth && user) return false;
    if (item.showWhenAuth && !user) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.hideWhenVip && isVip) return false;
    return true;
  };

  const linkClass = (path: string) =>
    `text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${isActive(path)
      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-purple-500/20"
      : "text-slate-300 hover:text-white hover:bg-white/10"
    }`;

  const mobileLinkClass = (path: string) =>
    `block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${isActive(path)
      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
      : "text-slate-300 hover:text-white hover:bg-white/10"
    }`;

  return (
    <nav className="bg-slate-900/95 backdrop-blur-xl border-b border-white/5 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img src="/images/logo2.webp" alt="Bilsemc2" className="h-12 w-auto" />
            </Link>
          </div>

          {/* Desktop Menü */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {menuItems.filter(shouldShowItem).map(item => (
              <Link key={item.path} to={item.path} className={linkClass(item.path)}>
                {item.name}
              </Link>
            ))}

            {user ? (
              <ProfileDropdown
                isActive={isActive}
                handleLogout={handleLogout}
                user={user}
              />
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className={linkClass('/login')}>Giriş Yap</Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold px-4 py-2 rounded-xl text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-200 flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  Kayıt Ol
                </Link>
              </div>
            )}

            {/* Online Count Badge */}
            <div className="hidden sm:flex items-center ml-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                {onlineCount} Çevrimiçi
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="ml-3 p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-all"
              aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Karanlık temaya geç'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Mobil Menü Butonu */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobil Menü */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-800/95 backdrop-blur-xl border-t border-white/5"
          >
            <div className="p-4 space-y-1">
              {menuItems.filter(shouldShowItem).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileLinkClass(item.path)}
                >
                  {item.name}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={mobileLinkClass('/profile')}
                  >
                    Profil
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className={mobileLinkClass('/login')}>
                    Giriş Yap
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-base font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}

              <div className="pt-2 border-t border-white/10 mt-2">
                <button
                  onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-white/5 transition-all"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  Tema Değiştir
                </button>

                <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className={mobileLinkClass('/blog')}>
                  Blog
                </Link>
                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className={mobileLinkClass('/contact')}>
                  İletişim
                </Link>
              </div>

              {/* Online Badge Mobile */}
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                  {onlineCount} Çevrimiçi
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavBar;