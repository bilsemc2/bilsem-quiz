import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Crown, Sparkles, Check, MessageCircle, Zap, Shield, Clock, Gift } from 'lucide-react';

export default function PricingPage() {
  const whatsappUrl = 'https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Profesyonel Plan Paket hakkında bilgi almak istiyorum.';

  const features = [
    { text: 'Sınırsız Quizizz Kodları', icon: Zap },
    { text: 'VIP Özel İçerikler', icon: Crown },
    { text: 'Öncelikli Destek', icon: Shield },
    { text: 'Tüm Oyunlara Erişim', icon: Sparkles },
    { text: 'Dönemlik Güncelleme', icon: Clock },
    { text: 'Bonus XP ve Ödüller', icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 pt-24 pb-12 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-purple-400 font-bold hover:text-purple-300 transition-colors mb-4 uppercase text-xs tracking-widest"
          >
            <ChevronLeft size={16} />
            Ana Sayfa
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
            👑 <span className="text-purple-400">VIP</span> Üyelik
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Sınav hazırlığında en iyi paketimizle planlı ve verimli ilerleyin.
          </p>
        </motion.div>

        {/* Main Pricing Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-lg mx-auto"
        >
          {/* Popular Badge */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 text-sm font-black px-6 py-2 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              En Popüler
            </motion.div>
          </div>

          {/* Card */}
          <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 rounded-3xl p-8 lg:p-10 border border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />

            {/* Crown Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/40"
            >
              <Crown className="w-10 h-10 text-slate-900" />
            </motion.div>

            <h2 className="text-2xl lg:text-3xl font-black text-white text-center mb-2">
              Profesyonel Plan Paket
            </h2>
            <p className="text-purple-200 text-center mb-6">
              Tüm özelliklere sınırsız erişim
            </p>

            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-5xl lg:text-6xl font-black text-white">₺9999</span>
                <span className="text-purple-200 text-lg">/Dönemlik</span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3"
                >
                  <feature.icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span className="text-white text-sm">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="block w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-black text-lg rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Plan Hakkında Bilgi Al
              </div>
            </motion.a>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-8 max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              Aklınıza takılan sorular mı var?
            </h3>
            <p className="text-slate-400 mb-6">
              Size yardımcı olmaktan mutluluk duyarız!
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-400 hover:to-indigo-500 transition-all"
            >
              💬 İletişime Geçin
            </Link>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-6"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Güvenli Ödeme</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>09:00 - 21:00 Destek</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Check className="w-5 h-5 text-purple-400" />
            <span>Anında Aktivasyon</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}