// NavBar.tsx — Faz 3: Kid-UI Çocuk Dostu Tasarım
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Menu, X, User, LogOut, Zap, ChevronDown, Crown, Sparkles, Gamepad2 } from 'lucide-react';
import { User as AuthUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { authRepository } from '@/server/repositories/authRepository';

// ═══════════════════════════════════════════════
// 🎮 Profile Dropdown — Kid-UI Style
// ═══════════════════════════════════════════════

interface ProfileDropdownProps {
  isActive: (path: string) => boolean;
  handleLogout: () => void;
  user: AuthUser;
  profile: { name?: string; avatar_url?: string; experience?: number; is_vip?: boolean } | null;
}

const ProfileDropdown = ({ isActive, handleLogout, user, profile }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1.5 pr-3 rounded-2xl border-2 border-black/10 transition-all duration-200 ${isOpen || isActive("/profile")
            ? "bg-cyber-gold shadow-neo-sm"
            : "bg-white dark:bg-slate-800 hover:bg-cyber-yellow/10 shadow-neo-sm"
          }`}
      >
        <div className="relative">
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-9 h-9 rounded-xl border-2 border-black/10"
          />
          {profile?.is_vip && (
            <Crown className="absolute -top-1.5 -right-1.5 w-4 h-4 text-cyber-gold drop-shadow-md" />
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-black dark:text-white transition-transform font-bold ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl shadow-neo-lg overflow-hidden z-50"
          >
            {/* Header — accent strip */}
            <div className="bg-gradient-to-r from-cyber-pink to-cyber-purple p-5 border-b-4 border-black/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-14 h-14 rounded-xl border-3 border-white/30"
                  />
                  {profile?.is_vip && (
                    <div className="absolute -top-1 -right-1 bg-cyber-gold border-2 border-black/10 rounded-lg p-0.5">
                      <Crown className="w-3 h-3 text-black" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-nunito font-extrabold text-white truncate text-base">{profile?.name || 'Kullanıcı'}</p>
                  <p className="text-sm text-white/70 truncate font-medium">{user.email}</p>
                </div>
              </div>
              {/* XP Badge */}
              <div className="mt-3 inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-white/20">
                <Zap className="w-4 h-4 text-cyber-gold" />
                <span className="text-sm font-nunito font-extrabold text-white">{profile?.experience || 0} XP</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-nunito font-bold text-sm tracking-wide text-black dark:text-white hover:bg-cyber-emerald/10 hover:border-cyber-emerald transition-colors group"
              >
                <div className="w-9 h-9 bg-cyber-emerald/10 border-2 border-cyber-emerald/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-4 h-4 text-cyber-emerald" />
                </div>
                <span className="uppercase">Profilim</span>
              </Link>

              <Link
                to="/bilsem-zeka"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-nunito font-bold text-sm tracking-wide text-black dark:text-white hover:bg-cyber-blue/10 transition-colors group"
              >
                <div className="w-9 h-9 bg-cyber-blue/10 border-2 border-cyber-blue/30 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Gamepad2 className="w-4 h-4 text-cyber-blue" />
                </div>
                <span className="uppercase">BİLSEM Zeka</span>
                <Sparkles className="w-3 h-3 text-cyber-gold animate-pulse ml-auto" />
              </Link>

              <div className="my-1 border-t-2 border-dashed border-black/10 dark:border-white/10" />

              <button
                onClick={() => { setIsOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-nunito font-bold text-sm tracking-wide text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
              >
                <div className="w-9 h-9 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="uppercase">Çıkış Yap</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ═══════════════════════════════════════════════
// 🧭 NavBar — Kid-UI Style
// ═══════════════════════════════════════════════

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await authRepository.signOut();
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
        const profile = await authRepository.getProfileByUserId(user.id);
        setIsAdmin(profile?.is_admin || false);
        setIsVip(profile?.is_vip || false);
      } catch (error) {
        console.error("Kullanıcı bilgileri kontrol edilirken hata:", error);
        setIsAdmin(false);
        setIsVip(false);
      }
    };

    checkUser();

    return () => { };
  }, [user]);


  const menuItems = [
    { name: "Bilsem", path: "/bilsem" },
    { name: "BİLSEM Zeka", path: "/bilsem-zeka", showWhenAuth: true },
    { name: "Hakkımızda", path: "/about" },
    { name: "İletişim", path: "/contact" },
    { name: "Admin", path: "/admin", showWhenAuth: true, adminOnly: true },
    { name: "Fiyatlandırma", path: "/pricing", hideWhenVip: true },
  ];

  const shouldShowItem = (item: typeof menuItems[0]) => {
    if (item.showWhenAuth && !user) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.hideWhenVip && isVip) return false;
    return true;
  };

  return (
    <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-4 border-black/10 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="flex justify-between items-center h-[72px]">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: [-2, 2, -2, 0], scale: 1.05 }}
                transition={{ duration: 0.4 }}
                className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl p-1.5 shadow-neo-sm hover:shadow-neo-md transition-shadow"
              >
                <img src="/images/beyninikullan.webp" alt="Bilsemc2" width={48} height={48} className="h-10 w-auto" />
              </motion.div>
            </Link>
          </div>

          {/* Desktop Menü */}
          <div className="hidden md:flex md:items-center md:space-x-1.5">
            {menuItems.filter(shouldShowItem).map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-nunito font-extrabold uppercase tracking-wider px-4 py-2 rounded-xl border-2 transition-all duration-200 ${isActive(item.path)
                    ? "bg-cyber-gold text-black border-black/10 shadow-neo-sm"
                    : "border-transparent text-slate-700 dark:text-slate-300 hover:bg-cyber-yellow/10 hover:border-black/20 dark:hover:border-white/20"
                  }`}
              >
                {item.name}
              </Link>
            ))}

            {user ? (
              <ProfileDropdown
                isActive={isActive}
                handleLogout={handleLogout}
                user={user}
                profile={profile}
              />
            ) : (
              <div className="flex items-center gap-2 ml-3">
                <Link
                  to="/login"
                  className="px-5 py-2 font-nunito font-extrabold uppercase tracking-wider text-sm text-black dark:text-white border-2 border-dashed border-black/10 dark:border-white/40 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  Giriş Yap
                </Link>
                <Link to="/signup">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-5 py-2 bg-cyber-pink text-white font-nunito font-extrabold uppercase tracking-wider text-sm border-2 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Kayıt Ol
                  </motion.div>
                </Link>
              </div>
            )}

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="ml-2 w-10 h-10 flex items-center justify-center rounded-xl border-2 border-black/20 dark:border-white/20 text-slate-500 dark:text-slate-400 hover:bg-cyber-gold/10 hover:text-amber-500 hover:border-black transition-all"
              aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Karanlık temaya geç'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>
          </div>

          {/* Mobil Menü Butonu */}
          <div className="flex md:hidden items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-black/20 dark:border-white/20 text-slate-500"
              aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Karanlık temaya geç'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMobileMenu}
              className="w-11 h-11 flex items-center justify-center rounded-xl border-2 border-black/10 bg-white dark:bg-slate-800 shadow-neo-sm text-black dark:text-white"
              aria-label="Menüyü aç"
            >
              {isMobileMenuOpen ? <X size={22} strokeWidth={3} /> : <Menu size={22} strokeWidth={3} />}
            </motion.button>
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden bg-white dark:bg-slate-900 border-b-4 border-black/10 absolute top-full left-0 right-0 max-h-[calc(100vh-72px)] overflow-y-auto"
          >
            <div className="p-4 space-y-2">
              {menuItems.filter(shouldShowItem).map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-5 py-3.5 rounded-xl font-nunito font-extrabold uppercase tracking-wider text-sm transition-all duration-200 ${isActive(item.path)
                        ? "bg-cyber-gold text-black border-2 border-black/10 shadow-neo-sm"
                        : "bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-transparent hover:border-black/20"
                      }`}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}

              {user ? (
                <div className="pt-3 mt-3 border-t-3 border-dashed border-black/10 dark:border-white/10 space-y-2">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                  >
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-5 py-3.5 rounded-xl font-nunito font-extrabold uppercase tracking-wider text-sm ${isActive('/profile')
                          ? "bg-cyber-gold text-black border-2 border-black/10 shadow-neo-sm"
                          : "bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-transparent"
                        }`}
                    >
                      Profil
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.2 }}
                  >
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-5 py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800 font-nunito font-extrabold uppercase tracking-wider text-sm"
                    >
                      Çıkış Yap
                    </button>
                  </motion.div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t-3 border-dashed border-black/10 dark:border-white/10">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                  >
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-4 text-center border-2 border-black/10 rounded-xl font-nunito font-extrabold uppercase tracking-wider bg-white dark:bg-slate-800 text-black dark:text-white shadow-neo-sm"
                    >
                      Giriş Yap
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.2 }}
                  >
                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-4 text-center bg-cyber-pink text-white border-2 border-black/10 rounded-xl font-nunito font-extrabold uppercase tracking-wider shadow-neo-sm"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Kayıt Ol
                      </span>
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavBar;
