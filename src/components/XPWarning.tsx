import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, Zap, ArrowLeft, Sparkles, Target, CreditCard, Check, MessageCircle } from 'lucide-react';

interface XPWarningProps {
  requiredXP: number;
  currentXP: number;
  title: string;
  onBack?: () => void;
}

const XPWarning = ({ requiredXP, currentXP, title, onBack }: XPWarningProps) => {
  const progress = Math.min((currentXP / requiredXP) * 100, 100);
  const hasEnoughXP = currentXP >= requiredXP;
  const remainingXP = requiredXP - currentXP;

  // XP Paket hesaplama
  const XP_RATE = 0.11; // 1 XP = 0.11 TL
  const MIN_XP = 10000;
  const calculatePrice = (xp: number) => Math.ceil(xp * XP_RATE);

  if (hasEnoughXP) {
    return null;
  }

  // Motivasyon mesajları
  const getMotivationMessage = () => {
    if (progress >= 75) return "Neredeyse başardın! 🔥";
    if (progress >= 50) return "Yarısını geçtin, devam et! 💪";
    if (progress >= 25) return "İyi gidiyorsun! ⚡";
    return "Macera seni bekliyor! 🚀";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-4xl w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Kart - XP Durumu */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Üst dekoratif çizgi */}
            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />

            <div className="p-8 text-center">
              {/* Kilit ikonu */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative mx-auto mb-6"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Başlık */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-white mb-2"
              >
                {title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/60 text-sm mb-6"
              >
                Bu özelliği açmak için XP kazanmalısın
              </motion.p>

              {/* Dairesel progress */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="relative w-28 h-28 mx-auto mb-4"
              >
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="56"
                    cy="56"
                    r="50"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 3.14} 314`}
                    initial={{ strokeDasharray: "0 314" }}
                    animate={{ strokeDasharray: `${progress * 3.14} 314` }}
                    transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="50%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                  <span className="text-[10px] text-white/60">tamamlandı</span>
                </div>
              </motion.div>

              {/* XP bilgisi */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/5 rounded-xl p-3 mb-4"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-lg font-bold text-white">{currentXP} / {requiredXP} XP</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Target className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-300">{remainingXP} XP daha gerekiyor</span>
                </div>
              </motion.div>

              {/* Motivasyon mesajı */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-2 mb-4"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-white/80 text-sm font-medium">{getMotivationMessage()}</span>
              </motion.div>

              {/* XP Kazanma Butonu */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-2"
              >
                <Link
                  to="/profile#referral"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-white/80 font-medium rounded-xl hover:bg-white/20 transition-all text-sm"
                >
                  🎁 Arkadaşını Davet Et
                </Link>
                <a
                  href="https://www.instagram.com/bilsemc2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-white/80 font-medium rounded-xl hover:bg-white/20 transition-all text-sm"
                >
                  📱 Sosyal Medyada Takip Et
                </a>
                <button
                  onClick={onBack || (() => window.history.back())}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white/60 font-medium rounded-xl hover:text-white/80 transition-all text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri Dön
                </button>
              </motion.div>
            </div>
          </div>

          {/* Sağ Kart - XP Satın Al */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden"
          >
            {/* Üst dekoratif çizgi */}
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

            <div className="p-8">
              {/* Başlık */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">XP Paket - Standart</h2>
                  <p className="text-emerald-300/80 text-xs">Hızlı erişim için XP satın alın</p>
                </div>
              </div>

              {/* Fiyat */}
              <div className="bg-white/5 rounded-2xl p-4 mb-4 text-center">
                <div className="text-3xl font-black text-white mb-1">
                  ₺{calculatePrice(MIN_XP).toLocaleString('tr-TR')}
                </div>
                <div className="text-emerald-300 text-sm">/ {MIN_XP.toLocaleString('tr-TR')} XP</div>
                <div className="text-white/40 text-xs mt-1">Min: 10.000 XP</div>
              </div>

              {/* Özellikler */}
              <div className="space-y-2 mb-6">
                {[
                  'Bireysel Değerlendirme Simülatörleri',
                  'Beyin Eğitimi Oyunları',
                  'XP Bitene Kadar Erişim',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Butonlar */}
              <div className="space-y-2">
                <a
                  href="https://www.paytr.com/link/E7upXbk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25"
                >
                  <CreditCard className="w-5 h-5" />
                  💳 Hemen Öde
                </a>
                <a
                  href="https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, XP Paket satın almak istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp ile İletişim
                </a>
              </div>

              {/* Alt not */}
              <p className="text-center text-white/40 text-[10px] mt-4">
                Güvenli ödeme • Anında aktivasyon
              </p>
            </div>
          </motion.div>
        </div>

        {/* Alt ipucu */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-white/40 text-xs mt-4"
        >
          Arkadaşlarını davet et, sosyal medyada takip et → XP kazan veya XP satın al!
        </motion.p>
      </motion.div>
    </div>
  );
};

export default XPWarning;

