import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Clock, Check, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Package } from '../types/package';
import PackageCard from '../components/PackageCard';

export default function PricingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [xpInput, setXpInput] = useState(10000);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Parse features from JSONB
      const parsed = (data || []).map(pkg => ({
        ...pkg,
        features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features || [],
        includes: pkg.includes || [],
      }));

      setPackages(parsed);
    } catch (error) {
      console.error('Paketler yüklenirken hata:', error);
      // Fallback to hardcoded packages if database not ready
      setPackages([
        {
          id: '1',
          slug: 'pro',
          name: 'Bireysel Değerlendirme - PRO',
          description: 'Genel Yetenek, Resim ve Müzik modüllerini kapsar. Tam kapsamlı hazırlık paketi.',
          price: 9999,
          price_renewal: null,
          type: 'bundle',
          initial_credits: null,
          xp_required: null,
          features: ['Genel Yetenek Simülatörleri', 'Resim Analizi (Sınırsız)', 'Müzik Eğitimi (Sınav Tarihine Kadar)', 'VIP Destek', 'Tüm Beyin Eğitimi Oyunları'],
          includes: ['genel_yetenek', 'resim', 'muzik'],
          payment_url: 'https://www.paytr.com/link/fHufWAE',
          whatsapp_url: 'https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Bireysel Değerlendirme PRO paketi hakkında bilgi almak istiyorum.',
          qr_code_url: '/images/qr_paytr.png',
          is_recommended: true,
          is_active: true,
          sort_order: 1,
        },
        {
          id: '2',
          slug: 'standard',
          name: 'Xp Paket - Standart',
          description: 'XP miktarınıza göre fiyatlandırma. En az 10.000 XP ile başlayın.',
          price: 1000,
          price_renewal: null,
          type: 'xp_based',
          initial_credits: null,
          xp_required: 10000,
          features: ['Genel Yetenek Simülatörleri', 'Bilsem Zeka Oyunları', 'XP Bitene Kadar Erişim'],
          includes: ['genel_yetenek'],
          payment_url: null,
          whatsapp_url: 'https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Bireysel Değerlendirme Standart paketi hakkında bilgi almak istiyorum.',
          qr_code_url: null,
          is_recommended: false,
          is_active: true,
          sort_order: 2,
        },
        {
          id: '3',
          slug: 'resim',
          name: 'Bireysel Değerlendirme - Resim',
          description: 'Resim analizi hakkı. 30 analiz ile başlayın, daha sonra ek hak satın alın.',
          price: 3000,
          price_renewal: 1500,
          type: 'credit_based',
          initial_credits: 30,
          xp_required: null,
          features: ['30 Resim Analizi Hakkı', 'Detaylı Geri Bildirim', 'İlerleme Takibi'],
          includes: ['resim'],
          payment_url: null,
          whatsapp_url: 'https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Bireysel Değerlendirme Resim paketi hakkında bilgi almak istiyorum.',
          qr_code_url: null,
          is_recommended: false,
          is_active: true,
          sort_order: 3,
        },
        {
          id: '4',
          slug: 'muzik',
          name: 'Bireysel Değerlendirme - Müzik',
          description: 'Müzik modülüne sınav tarihine kadar tam erişim.',
          price: 3000,
          price_renewal: null,
          type: 'time_based',
          initial_credits: null,
          xp_required: null,
          features: ['Ritim Eğitimi', 'Nota Tanıma', 'Melodi Eşleştirme', 'Sınav Tarihine Kadar Erişim'],
          includes: ['muzik'],
          payment_url: null,
          whatsapp_url: 'https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Bireysel Değerlendirme Müzik paketi hakkında bilgi almak istiyorum.',
          qr_code_url: null,
          is_recommended: false,
          is_active: true,
          sort_order: 4,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (pkg: Package) => {
    console.log('Contact for package:', pkg.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 pt-24 pb-12 px-4 sm:px-6">
      <div className="container mx-auto max-w-7xl">
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
          <h1 className="text-3xl lg:text-5xl font-black text-white mb-4">
            🎯 <span className="text-purple-400">Bireysel Değerlendirme</span> Paketleri
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto">
            2. Aşama (Bireysel Değerlendirme) sınavına hazırlık için size uygun paketi seçin.
          </p>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 mb-12 max-w-4xl mx-auto"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Program Hakkında
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Çocuklarımızın potansiyellerini keşfetmek ve onları geleceğe en donanımlı şekilde hazırlamak
            amacıyla hazırladığımız program, MEB BİLSEM tanılama süreçlerine paralel olarak öğrencilerin
            bilişsel yeteneklerini en üst seviyeye çıkarmayı hedeflemektedir.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <div className="text-2xl mb-1">🧠</div>
              <div className="text-white text-sm font-medium">Sözel & Sayısal</div>
              <div className="text-slate-400 text-xs">Akıl Yürütme</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <div className="text-2xl mb-1">👁️</div>
              <div className="text-white text-sm font-medium">Görsel-Uzamsal</div>
              <div className="text-slate-400 text-xs">İşlemleme</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-white text-sm font-medium">Dikkat & Bellek</div>
              <div className="text-slate-400 text-xs">Yönetimi</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-xl">
              <div className="text-2xl mb-1">💡</div>
              <div className="text-white text-sm font-medium">Problem Çözme</div>
              <div className="text-slate-400 text-xs">Akışkan Zeka</div>
            </div>
          </div>

          {/* Document Links */}
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-white/10">
            <a
              href="https://drive.google.com/file/d/1trI97xFXCEYBxAkuohvey7nAAYk3PgFP/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-lg text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              2. Aşama Hakkında
            </a>
            <a
              href="https://drive.google.com/file/d/1wTWu1OkZokSDbWesKdmoLjbjBOIwLK_m/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-lg text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ders İçeriği & Planlama
            </a>
          </div>
        </motion.div>

        {/* Packages Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {packages.map((pkg, index) => (
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
        )}

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-6 max-w-4xl mx-auto mb-12"
        >
          <h3 className="text-lg font-bold text-amber-400 mb-4">
            ⚠️ Önemli Hizmet Koşulları
          </h3>
          <ul className="space-y-3 text-slate-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>Hizmet Süresi:</strong> Eğitim desteğimiz, öğrenciniz 2. aşama sınavına girene kadar devam eder.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>İade Politikası:</strong> Programın temel amacı öğrenciyi sürece hazırlamaktır. 1. aşama sınavını kazanamaması durumunda ücret iadesi yapılmamaktadır.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span><strong>2. Aşama Tarihi:</strong> 06 Nisan 2026'da başlayacak olan bireysel değerlendirme sürecine hazırlık.</span>
            </li>
          </ul>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
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