import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  School,
  GraduationCap,
  Gift,
  AlertCircle,
  Loader2,
  Brain,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// ═══════════════════════════════════════════════
// 📝 SignUpPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

const INITIAL_XP = 50;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    school: "",
    grade: "1",
    password: "",
    confirmPassword: "",
    referralCode: searchParams.get("ref") || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Şifreler eşleşmiyor");
      }

      if (formData.password.length < 6) {
        throw new Error("Şifre en az 6 karakter olmalıdır");
      }

      let referrerId = null;
      if (formData.referralCode) {
        const { data: referrer, error: refError } = await supabase
          .from("profiles")
          .select("id")
          .eq("referral_code", formData.referralCode)
          .single();

        if (refError || !referrer) {
          throw new Error("Geçersiz referans kodu");
        }
        referrerId = referrer.id;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            school: formData.school,
            grade: parseInt(formData.grade),
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: formData.name,
            email: formData.email,
            school: formData.school,
            grade: parseInt(formData.grade),
            referred_by: formData.referralCode || null,
            avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${formData.name}&backgroundColor=b6e3f4,c0aede,d1d4f9&mood=happy`,
            points: 0,
            experience: INITIAL_XP,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        if (referrerId) {
          const { error: referrerError } = await supabase.rpc("increment_xp", {
            user_id: referrerId,
            amount: INITIAL_XP,
          });

          if (referrerError) {
            console.error("Referans XP hatası:", referrerError);
          }
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;

        const successMessage = formData.referralCode
          ? `🎉 ${INITIAL_XP} XP ile başlıyorsun ve arkadaşın da ${INITIAL_XP} XP kazandı!`
          : `🎉 Hoş geldin! ${INITIAL_XP} XP ile başlıyorsun!`;

        toast.success(successMessage);
        navigate("/bilsem");
      }
    } catch (err: unknown) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "Kayıt yapılamadı");
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared input class ── */
  const inputCls =
    "w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-700/50 border-2 border-black/10 dark:border-white/10 rounded-xl text-black dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyber-emerald/40 focus:border-cyber-emerald/40 transition-all font-nunito font-bold text-sm";

  const labelCls =
    "block text-xs font-nunito font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dot Pattern */}
      <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 relative z-10"
        >
          <motion.div
            className="w-16 h-16 bg-cyber-emerald/10 border-2 border-cyber-emerald/30 rounded-2xl flex items-center justify-center mx-auto mb-5"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Brain className="w-8 h-8 text-cyber-emerald" strokeWidth={2} />
          </motion.div>
          <h1 className="text-3xl font-nunito font-black text-black dark:text-white mb-1.5 tracking-tight">
            Hesap Oluştur 🎉
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm">
            Ücretsiz kayıt ol ve öğrenmeye başla
          </p>
        </motion.div>

        {/* Signup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg relative z-10"
        >
          {/* Accent Strip */}
          <div className="h-2 bg-cyber-emerald" />

          <form onSubmit={handleSubmit} className="p-7 space-y-4">
            {/* Email */}
            <div>
              <label className={labelCls}>Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            {/* Ad Soyad */}
            <div>
              <label className={labelCls}>Ad Soyad</label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Adın ve soyadın"
                />
              </div>
            </div>

            {/* Okul ve Sınıf */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Okul</label>
                <div className="relative">
                  <School
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    strokeWidth={2}
                  />
                  <input
                    type="text"
                    name="school"
                    required
                    value={formData.school}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="Okul adı"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Sınıf</label>
                <div className="relative">
                  <GraduationCap
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    strokeWidth={2}
                  />
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className={`${inputCls} appearance-none cursor-pointer`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                      <option
                        key={grade}
                        value={grade}
                        className="bg-white dark:bg-slate-800 text-black dark:text-white"
                      >
                        {grade}. Sınıf
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg
                      className="fill-current h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Şifreler */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Şifre</label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    strokeWidth={2}
                  />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="••••••"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Tekrar</label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    strokeWidth={2}
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="••••••"
                  />
                </div>
              </div>
            </div>

            {/* Referans Kodu */}
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5">
                  <Gift
                    className="w-3.5 h-3.5 text-cyber-gold"
                    strokeWidth={2.5}
                  />
                  Referans Kodu (İsteğe bağlı)
                </span>
              </label>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-700/50 border-2 border-black/10 dark:border-white/10 rounded-xl text-black dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyber-gold/40 focus:border-cyber-gold/40 transition-all font-nunito font-bold text-sm"
                placeholder="Arkadaşının kodu"
              />
              {formData.referralCode && (
                <div className="mt-2 flex items-center gap-2 p-2.5 bg-cyber-gold/10 border-2 border-cyber-gold/30 rounded-xl">
                  <Zap
                    className="w-4 h-4 text-cyber-gold flex-shrink-0"
                    strokeWidth={2.5}
                  />
                  <p className="text-xs font-nunito font-bold text-cyber-gold">
                    Sen ve arkadaşın {INITIAL_XP} XP kazanacaksınız!
                  </p>
                </div>
              )}
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

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01, y: -1 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full py-3.5 mt-2 bg-cyber-emerald text-black font-nunito font-extrabold text-base uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Kayıt Yapılıyor...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" strokeWidth={2.5} />
                  Kayıt Ol
                </>
              )}
            </motion.button>

            {/* Login Link */}
            <div className="text-center mt-4">
              <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm">
                Zaten hesabın var mı?{" "}
                <Link
                  to="/login"
                  className="text-cyber-blue font-extrabold hover:underline decoration-2 underline-offset-4"
                >
                  Giriş Yap
                </Link>
              </p>
            </div>
          </form>
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
            {INITIAL_XP} XP Başlangıç
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border-2 border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 font-nunito font-extrabold text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <Brain className="w-3 h-3 text-cyber-emerald" strokeWidth={2.5} />
            Ücretsiz Erişim
          </div>
        </motion.div>
      </div>
    </div>
  );
}
