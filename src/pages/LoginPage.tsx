import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Brain,
  Sparkles,
} from "lucide-react";

// ═══════════════════════════════════════════════
// 🔐 LoginPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email veya şifre hatalı");
        }
        throw new Error("Giriş yapılamadı: " + error.message);
      }

      navigate("/bilsem");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Giriş yapılamadı");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetLoading(true);
    setError(null);
    setResetSuccess(false);

    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${siteUrl}/reset-password?type=recovery`,
      });

      if (error) throw error;

      setResetSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Şifre sıfırlama isteği gönderilemedi",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
    setResetEmail("");
    setResetSuccess(false);
    setError(null);
  };

  /* ── Shared input class ── */
  const inputCls =
    "w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-700/50 border-2 border-black/10 dark:border-white/10 rounded-xl text-black dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyber-blue/40 focus:border-cyber-blue/40 transition-all font-nunito font-bold text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dot Pattern */}
      <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 relative z-10"
        >
          <motion.div
            className="w-16 h-16 bg-cyber-blue/10 border-2 border-cyber-blue/30 rounded-2xl flex items-center justify-center mx-auto mb-5"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Brain className="w-8 h-8 text-cyber-blue" strokeWidth={2} />
          </motion.div>
          <h1 className="text-3xl font-nunito font-black text-black dark:text-white mb-1.5 tracking-tight">
            Hoş Geldiniz! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm">
            Hesabınıza giriş yapın
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg relative z-10"
        >
          {/* Accent Strip */}
          <div className="h-2 bg-cyber-blue" />

          <form onSubmit={handleLogin} className="p-7 space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-nunito font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="ornek@email.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-nunito font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                Şifre
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl"
                >
                  <AlertCircle
                    className="w-4 h-4 text-red-500 flex-shrink-0"
                    strokeWidth={2}
                  />
                  <p className="text-red-600 dark:text-red-400 font-nunito font-bold text-xs">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01, y: -1 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full py-3.5 mt-1 bg-cyber-blue text-white font-nunito font-extrabold text-base uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" strokeWidth={2.5} />
                  Giriş Yap
                </>
              )}
            </motion.button>

            {/* Forgot Password */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setResetDialogOpen(true)}
                className="text-slate-400 hover:text-cyber-blue font-nunito font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Şifremi Unuttum
              </button>
            </div>
          </form>
        </motion.div>

        {/* Register Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 relative z-10"
        >
          <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm">
            Hesabınız yok mu?{" "}
            <Link
              to="/signup"
              className="text-cyber-blue font-extrabold hover:underline decoration-2 underline-offset-4"
            >
              Kayıt Ol
            </Link>
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex justify-center gap-3 relative z-10"
        >
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 font-nunito font-extrabold text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3 h-3 text-cyber-gold" strokeWidth={2.5} />
            50+ Oyun
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 font-nunito font-extrabold text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <Brain className="w-3 h-3 text-cyber-pink" strokeWidth={2.5} />
            Zeka Egzersizi
          </div>
        </motion.div>
      </div>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {resetDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={handleCloseResetDialog}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden max-w-md w-full shadow-neo-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal accent */}
              <div className="h-2 bg-cyber-pink" />

              <div className="p-7">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-nunito font-extrabold uppercase tracking-tight text-black dark:text-white">
                    Şifre Sıfırlama
                  </h3>
                  <button
                    onClick={handleCloseResetDialog}
                    className="p-1.5 border-2 border-black/10 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                  >
                    <X
                      className="w-4 h-4 text-black dark:text-white"
                      strokeWidth={2.5}
                    />
                  </button>
                </div>

                {resetSuccess ? (
                  <div className="flex items-start gap-2.5 p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
                    <CheckCircle
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      strokeWidth={2}
                    />
                    <p className="text-green-700 dark:text-green-400 font-nunito font-bold text-xs">
                      Şifre sıfırlama bağlantısı gönderildi. Lütfen email kutunuzu
                      kontrol edin.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs mb-5">
                      Sistemdeki email adresinizi girin. Size bir bağlantı
                      göndereceğiz.
                    </p>
                    <div className="relative mb-5">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                        strokeWidth={2}
                      />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className={inputCls}
                        placeholder="ornek@email.com"
                        autoFocus
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl mb-5">
                        <AlertCircle
                          className="w-4 h-4 text-red-500 flex-shrink-0"
                          strokeWidth={2}
                        />
                        <p className="text-red-600 dark:text-red-400 font-nunito font-bold text-xs">{error}</p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCloseResetDialog}
                    className="w-1/3 py-3 bg-gray-100 dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold uppercase tracking-wider text-xs border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all"
                  >
                    Kapat
                  </button>
                  {!resetSuccess && (
                    <button
                      onClick={handlePasswordReset}
                      disabled={resetLoading || !resetEmail}
                      className="flex-1 py-3 bg-cyber-pink text-black font-nunito font-extrabold uppercase tracking-wider text-xs border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {resetLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        "Bağlantı Gönder"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
