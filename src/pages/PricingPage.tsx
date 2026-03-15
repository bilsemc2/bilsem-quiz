import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Clock, Check, FileText, ExternalLink } from 'lucide-react';
import { loadActivePackages } from '@/features/content/model/packageUseCases';
import type { Package } from '../types/package';
import PackageCard from '../components/PackageCard';

// ═══════════════════════════════════════════════
// 💰 PricingPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

export default function PricingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [xpInput, setXpInput] = useState(10000);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setPackages(await loadActivePackages());
    } catch (error) {
      console.error('Paketler yüklenirken hata:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
  };

  return (
    <div className="min-h-screen overflow-hidden transition-colors duration-300">
      {/* Background pattern — dots */}
      <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10 pt-24 pb-12 px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 mb-16"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all"
          >
            <ChevronLeft size={14} strokeWidth={3} />
            Ana Sayfa
          </Link>

          <h1 className="text-4xl lg:text-6xl font-nunito font-black text-black dark:text-white tracking-tight uppercase leading-tight mt-6">
            Bireysel Değerlendirme <span className="text-cyber-pink">Paketleri</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-nunito font-bold">
            2. Aşama (Bireysel Değerlendirme) sınavına hazırlık için size uygun paketi seçin.
          </p>
        </motion.div>

        {/* Program Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg mb-14 max-w-5xl mx-auto"
        >
          <div className="h-2.5 bg-cyber-pink" />
          <div className="p-8 lg:p-10">
            <h2 className="text-xl lg:text-2xl font-nunito font-extrabold text-black dark:text-white mb-5 flex items-center gap-3 uppercase tracking-tight">
              <span className="p-2 bg-cyber-pink/10 border-2 border-cyber-pink/30 rounded-xl">
                <FileText className="w-5 h-5 text-cyber-pink" strokeWidth={2.5} />
              </span>
              Program Hakkında
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold leading-relaxed mb-8">
              Çocuklarımızın potansiyellerini keşfetmek ve onları geleceğe en donanımlı şekilde hazırlamak
              amacıyla hazırladığımız program, MEB BİLSEM tanılama süreçlerine paralel olarak öğrencilerin
              bilişsel yeteneklerini en üst seviyeye çıkarmayı hedeflemektedir.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { emoji: '🧠', title: 'Sözel & Sayısal', sub: 'Akıl Yürütme' },
                { emoji: '👁️', title: 'Görsel-Uzamsal', sub: 'İşlemleme' },
                { emoji: '🎯', title: 'Dikkat & Bellek', sub: 'Yönetimi' },
                { emoji: '💡', title: 'Problem Çözme', sub: 'Akışkan Zeka' },
              ].map((item) => (
                <motion.div key={item.title} whileHover={{ y: -3 }} className="text-center p-4 bg-gray-50 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-xl hover:shadow-neo-sm transition-all">
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <div className="text-black dark:text-white font-nunito font-extrabold uppercase tracking-wider text-xs">{item.title}</div>
                  <div className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs mt-0.5">{item.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Document Links */}
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t-2 border-dashed border-black/10 dark:border-white/10">
              <a
                href="https://drive.google.com/file/d/1trI97xFXCEYBxAkuohvey7nAAYk3PgFP/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyber-gold border-3 border-black/10 text-black font-nunito font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-neo-sm hover:shadow-neo-md hover:-translate-y-1 transition-all"
              >
                <ExternalLink strokeWidth={2.5} className="w-4 h-4" />
                2. Aşama Hakkında
              </a>
              <a
                href="https://drive.google.com/file/d/1wTWu1OkZokSDbWesKdmoLjbjBOIwLK_m/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyber-emerald border-3 border-black/10 text-black font-nunito font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-neo-sm hover:shadow-neo-md hover:-translate-y-1 transition-all"
              >
                <ExternalLink strokeWidth={2.5} className="w-4 h-4" />
                Ders İçeriği & Planlama
              </a>
            </div>
          </div>
        </motion.div>

        {/* Packages Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyber-emerald border-2 border-black/10 rounded-lg animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-4 h-4 bg-cyber-gold border-2 border-black/10 rounded-lg animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-4 h-4 bg-cyber-pink border-2 border-black/10 rounded-lg animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <>
            {/* Regular Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 lg:items-stretch">
              {packages.filter(p => !p.includes?.includes('ozel_ders') || p.includes.length > 1).map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  onContact={handleContact}
                  xpInput={pkg.type === 'xp_based' ? xpInput : undefined}
                  onXpChange={pkg.type === 'xp_based' ? setXpInput : undefined}
                />
              ))}
            </div>

            {/* ─── Premium Özel Ders Section ─── */}
            {packages.filter(p => p.includes?.includes('ozel_ders') && p.includes.length <= 1).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-16"
              >
                {/* Section Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.4 }}
                    className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 border-3 border-amber-300/50 dark:border-amber-700/40 rounded-2xl flex items-center justify-center shadow-neo-sm mb-4"
                  >
                    <span className="text-3xl">👨‍🏫</span>
                  </motion.div>
                  <h2 className="text-2xl lg:text-3xl font-nunito font-black text-black dark:text-white uppercase tracking-tight">
                    Birebir <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Özel Ders</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold text-sm mt-2 max-w-lg mx-auto">
                    Alanında uzman öğretmenlerle birebir online veya yüz yüze ders imkânı
                  </p>
                </div>

                {/* Özel Ders Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {packages.filter(p => p.includes?.includes('ozel_ders') && p.includes.length <= 1).map((pkg, index) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="relative"
                    >
                      <div className="bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-800/40 rounded-2xl overflow-hidden shadow-neo-md hover:shadow-neo-lg hover:-translate-y-1 transition-all">
                        {/* Gradient accent */}
                        <div className="h-2.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

                        <div className="p-6">
                          {/* Icon */}
                          <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-center justify-center">
                              <span className="text-2xl">📚</span>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-nunito font-extrabold text-center text-black dark:text-white mb-2 uppercase tracking-tight">
                            {pkg.name}
                          </h3>

                          {pkg.description && (
                            <p className="text-center text-slate-500 dark:text-slate-400 font-nunito font-bold text-xs leading-relaxed mb-4">
                              {pkg.description}
                            </p>
                          )}

                          {/* Features */}
                          <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-4 mb-4">
                            <ul className="space-y-2">
                              {pkg.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <Check strokeWidth={3} className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                                  <span className="text-slate-700 dark:text-slate-300 font-nunito font-bold text-xs leading-snug">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Price */}
                          <div className="text-center mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white">
                            <span className="text-3xl font-nunito font-black">
                              ₺{pkg.price.toLocaleString('tr-TR')}
                            </span>
                            <span className="font-nunito font-bold uppercase tracking-widest text-[10px] opacity-80 block mt-1">
                              {pkg.price_renewal ? '/ Aylık' : '/ Sınava Kadar'}
                            </span>
                          </div>

                          {/* CTA */}
                          <div className="space-y-2.5">
                            {pkg.payment_url && (
                              <motion.a
                                href={pkg.payment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex w-full py-3.5 bg-amber-500 text-white font-nunito font-extrabold uppercase tracking-wider text-sm border-2 border-amber-600 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all items-center justify-center gap-2"
                              >
                                💳 Hemen Öde
                              </motion.a>
                            )}
                            <motion.a
                              href={pkg.whatsapp_url || `https://api.whatsapp.com/send/?phone=905416150721&text=${encodeURIComponent(`Merhaba, "${pkg.name}" paketi hakkında bilgi almak istiyorum.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex w-full py-3.5 bg-white dark:bg-slate-700 text-black dark:text-white font-nunito font-extrabold uppercase tracking-wider text-sm border-2 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all items-center justify-center gap-2"
                            >
                              💬 Bilgi Al
                            </motion.a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg max-w-4xl mx-auto mb-14"
        >
          <div className="h-2.5 bg-cyber-gold" />
          <div className="p-8">
            <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white mb-5 uppercase tracking-wider inline-flex items-center gap-3">
              <span className="p-2 bg-cyber-gold/10 border-2 border-cyber-gold/30 rounded-xl">⚠️</span>
              Önemli Hizmet Koşulları
            </h3>
            <ul className="space-y-3 text-slate-600 dark:text-slate-400 font-nunito font-bold text-sm">
              <li className="flex items-start gap-3 bg-gray-50 dark:bg-slate-700 p-3 rounded-xl border border-black/5 dark:border-white/5">
                <span className="text-lg mt-0.5">📅</span>
                <span><strong className="text-black dark:text-white">Hizmet Süresi:</strong> Eğitim desteğimiz, öğrenciniz 2. aşama sınavına girene kadar devam eder.</span>
              </li>
              <li className="flex items-start gap-3 bg-gray-50 dark:bg-slate-700 p-3 rounded-xl border border-black/5 dark:border-white/5">
                <span className="text-lg mt-0.5">🔄</span>
                <span><strong className="text-black dark:text-white">İade Politikası:</strong> Programın temel amacı öğrenciyi sürece hazırlamaktır.</span>
              </li>
              <li className="flex items-start gap-3 bg-gray-50 dark:bg-slate-700 p-3 rounded-xl border border-black/5 dark:border-white/5">
                <span className="text-lg mt-0.5">📋</span>
                <span><strong className="text-black dark:text-white">2. Aşama Tarihi:</strong> 06 Nisan 2026'da başlayacak olan bireysel değerlendirme sürecine hazırlık.</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-12"
        >
          <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg max-w-xl mx-auto">
            <div className="h-2.5 bg-cyber-blue" />
            <div className="p-8">
              <h3 className="text-2xl font-nunito font-black text-black dark:text-white uppercase mb-3 tracking-tight">
                Aklınıza takılan sorular mı var? 🤔
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold mb-6">
                Size yardımcı olmaktan mutluluk duyarız!
              </p>
              <Link to="/contact">
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-cyber-pink text-black font-nunito font-extrabold uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all"
                >
                  💬 İletişime Geçin
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pb-12 flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: Shield, label: 'Güvenli Ödeme', color: 'text-cyber-emerald' },
            { icon: Clock, label: '09:00 - 21:00 Destek', color: 'text-cyber-blue' },
            { icon: Check, label: 'Anında Aktivasyon', color: 'text-cyber-pink' },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border-2 border-black/10 dark:border-white/10 font-nunito font-extrabold uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400">
              <badge.icon strokeWidth={2.5} className={`w-4 h-4 ${badge.color}`} />
              <span>{badge.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
