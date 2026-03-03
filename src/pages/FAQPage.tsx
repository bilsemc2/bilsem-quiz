import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    ChevronLeft,
    MessageCircle,
    HelpCircle,
    Zap,
    Wrench,
    Headphones,
    Crown,
    Rocket,
    Gift,
    ShieldCheck
} from 'lucide-react';

// ═══════════════════════════════════════════════
// ❓ FAQPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqItems: FAQItem[] = [
    {
        category: 'Genel',
        question: 'BilsemC2 nedir?',
        answer: 'BilsemC2, BİLSEM sınavlarına (1. ve 2. aşama) hazırlanan öğrenciler için geliştirilmiş, yapay zeka destekli Türkiye\'nin en kapsamlı dijital eğitim platformudur. 150\'den fazla kural seti, interaktif oyunlar ve profesyonel atölyelerle çocukların potansiyelini zirveye taşır.'
    },
    {
        category: 'Genel',
        question: 'Sınav formatına uygun mu?',
        answer: 'Kesinlikle! Tüm içeriklerimiz güncel BİLSEM, ASIS ve WISC-R zeka testleri standartlarına uygun olarak uzman bir ekip tarafından hazırlanmıştır. Gerçek sınav simülasyonları ile çocuğunuzu sınav atmosferine hazırlar.'
    },
    {
        category: 'XP & Ekonomi',
        question: 'XP sistemi nasıl çalışır?',
        answer: 'BilsemC2\'de XP, öğrencinin platformdaki "yakıtı"dır. Etkinliklere katıldıkça harcanır. \n\n✨ Yenilik: Artık platformda aktif kaldığınız her saniye için XP kazanırsınız! Sitede geçirdiğiniz her 1 dakika için hesabınıza otomatik olarak 1 XP eklenir.'
    },
    {
        category: 'XP & Ekonomi',
        question: 'Promo kodları nasıl kullanılır?',
        answer: 'Özel günlerde veya öğretmenlerinizden aldığınız promo kodları, Profil sayfanızdaki "Promo Kodu Gir" bölümünden kullanabilirsiniz. Kodlar size anında toplu XP kazandırır. Unutmayın, her kod bir kez kullanılabilir!'
    },
    {
        category: 'Paketler',
        question: 'Profesyonel Plan Paket neleri kapsar?',
        answer: 'En kapsamlı paketimiz olan Profesyonel Plan (₺9999/Dönemlik);\n- Sınırsız Quizizz kodları\n- VIP içeriklere tam erişim\n- Öncelikli teknik destek\n- Bonus XP paketleri\n- Tüm mülakat hazırlık materyallerini kapsar.'
    },
    {
        category: 'Paketler',
        question: 'Nasıl satın alabilirim?',
        answer: 'Üyelik paketlerini Fiyatlandırma sayfamızdan inceleyebilir, satın alma işlemleri için WhatsApp destek hattımız üzerinden bizimle doğrudan iletişime geçebilirsiniz. Aktivasyon işleminiz anında gerçekleştirilir.'
    },
    {
        category: 'Atölyeler',
        question: 'Hangi atölyeler bulunuyor?',
        answer: 'Üç ana uzmanlık alanımız mevcuttur:\n🎨 Resim Atölyesi: Görsel sanatsal yetenekleri geliştirir.\n🎵 Müzik Atölyesi: İşitsel hafıza ve melodi algısını ölçer.\n🧠 Bireysel Değerlendirme: Mülakat teknikleri ve genel zeka oyunlarını içerir.'
    },
    {
        category: 'Atölyeler',
        question: 'Deyimler Atölyesi ücretli mi?',
        answer: 'Deyimler Atölyesi tüm öğrencilerimiz için açıktır ancak giriş için belirli bir XP gerektirir. Burada hem eğlenir hem de dil becerilerinizi geliştirerek XP kazanabilirsiniz.'
    },
    {
        category: 'Teknik',
        question: 'İlerlemem kaydediliyor mu?',
        answer: 'Evet! Google tabanlı bulut sistemimiz sayesinde tüm XP kazançlarınız, oyun skorlarınız ve ilerlemeleriniz anlık olarak kaydedilir. Hesabınıza herhangi bir cihazdan girerek kaldığınız yerden devam edebilirsiniz.'
    },
    {
        category: 'Teknik',
        question: 'Sayfayı yenileyince XP sürem sıfırlanır mı?',
        answer: 'Hayır. Yeni geliştirdiğimiz kalıcı sayaç sistemi sayesinde sayfayı yenileseniz bile "Aktif XP" süreniz kaldığı yerden devam eder, emeğiniz asla kaybolmaz.'
    },
    {
        category: 'Destek',
        question: 'Size nasıl ulaşabilirim?',
        answer: 'Bize her gün 09:00 - 21:00 saatleri arasında WhatsApp hattımızdan (0541 615 0721) ulaşabilirsiniz. Ayrıca platform içindeki mesaj paneli üzerinden öğretmenlerinize soru sorabilirsiniz.'
    }
];

const categoryConfig = [
    { name: 'Genel', icon: HelpCircle, color: 'bg-cyber-blue' },
    { name: 'XP & Ekonomi', icon: Zap, color: 'bg-cyber-gold' },
    { name: 'Paketler', icon: Crown, color: 'bg-cyber-pink' },
    { name: 'Atölyeler', icon: Rocket, color: 'bg-cyber-emerald' },
    { name: 'Teknik', icon: Wrench, color: 'bg-slate-200 dark:bg-slate-700' },
    { name: 'Destek', icon: Headphones, color: 'bg-white dark:bg-slate-800' },
];

const FAQPage: React.FC = () => {
    const [openItem, setOpenItem] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('Genel');

    const toggleItem = (index: number) => {
        setOpenItem(openItem === index ? null : index);
    };

    const filteredItems = faqItems.filter(item => item.category === activeCategory);

    return (
        <div className="min-h-screen overflow-hidden transition-colors duration-300">
            {/* FAQPage Schema for Rich Results */}
            <Helmet>
                <title>Sık Sorulan Sorular | BilsemC2 - BİLSEM Sınavı Hazırlık</title>
                <meta name="description" content="BilsemC2 platformu hakkında sık sorulan sorular. XP sistemi, paketler, atölyeler ve teknik destek hakkında bilgi alın." />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faqItems.map(item => ({
                            "@type": "Question",
                            "name": item.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": item.answer
                            }
                        }))
                    })}
                </script>
            </Helmet>

            {/* Background pattern — dots */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto max-w-4xl relative z-10 pt-24 pb-20 px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-14"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all mb-8"
                    >
                        <ChevronLeft size={14} strokeWidth={3} />
                        Geri Dön
                    </Link>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyber-blue/10 border-2 border-cyber-blue/30 rounded-lg font-nunito font-extrabold text-cyber-blue text-xs uppercase tracking-widest mb-5">
                        Bilgi Merkezi
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-nunito font-black text-black dark:text-white mb-5 tracking-tight uppercase leading-tight">
                        Aklınıza <span className="text-cyber-blue">Takılan</span> Her Şey
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mx-auto font-nunito font-bold">
                        BilsemC2 platformu ve eğitim sistemimiz hakkında en güncel bilgilere buradan ulaşabilirsiniz.
                    </p>
                </motion.div>

                {/* Category Tabs */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-10">
                    {categoryConfig.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.name;
                        return (
                            <motion.button
                                key={cat.name}
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setActiveCategory(cat.name); setOpenItem(null); }}
                                className={`p-3 border-3 border-black/10 rounded-xl transition-all flex flex-col items-center gap-2 ${isActive
                                    ? `${cat.color} shadow-neo-md -translate-y-1 text-black`
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-neo-sm hover:shadow-neo-md'
                                    }`}
                            >
                                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-nunito font-extrabold uppercase tracking-wider text-center leading-tight">
                                    {cat.name}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-3"
                        >
                            {filteredItems.map((item, index) => (
                                <div
                                    key={index}
                                    className={`bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl overflow-hidden transition-all duration-300 ${openItem === index
                                        ? 'shadow-neo-lg -translate-y-1'
                                        : 'shadow-neo-sm hover:shadow-neo-md hover:-translate-y-0.5'
                                        }`}
                                >
                                    <button
                                        className="w-full px-5 py-4 flex justify-between items-center text-left focus:outline-none"
                                        onClick={() => toggleItem(index)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full border-2 border-black/10 transition-all duration-300 ${openItem === index ? 'bg-cyber-blue scale-125' : 'bg-gray-200 dark:bg-slate-600'}`} />
                                            <span className={`text-base md:text-lg font-nunito font-extrabold uppercase tracking-tight transition-colors ${openItem === index ? 'text-cyber-blue' : 'text-black dark:text-white'}`}>
                                                {item.question}
                                            </span>
                                        </div>
                                        <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center transition-all border-2 border-black/10 rounded-lg ${openItem === index ? 'bg-cyber-blue text-white rotate-180' : 'bg-gray-50 dark:bg-slate-700 text-black dark:text-white'
                                            }`}>
                                            <ChevronDown className="w-4 h-4" strokeWidth={3} />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {openItem === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                            >
                                                <div className="px-5 pb-5 pt-1">
                                                    <div className="h-0.5 w-full bg-black/5 dark:bg-white/5 mb-4 rounded-full" />
                                                    <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold text-sm leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-slate-900 border-2 border-black/5 dark:border-white/5 rounded-xl p-4">
                                                        {item.answer}
                                                    </p>

                                                    {item.category === 'Paketler' && (
                                                        <div className="mt-4">
                                                            <Link to="/pricing">
                                                                <motion.div
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    className="inline-flex items-center gap-2 bg-cyber-pink text-black font-nunito font-extrabold uppercase text-xs tracking-widest px-5 py-2.5 border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all"
                                                                >
                                                                    Detaylı İncele <ChevronDown className="-rotate-90 w-3 h-3" strokeWidth={3} />
                                                                </motion.div>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Support Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20"
                >
                    <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-lg">
                        <div className="h-2.5 bg-cyber-gold" />
                        <div className="p-8 md:p-10">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                                <div className="flex-1 text-center lg:text-left">
                                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                                        <div className="w-12 h-12 bg-cyber-gold/10 border-2 border-cyber-gold/30 rounded-xl flex items-center justify-center">
                                            <MessageCircle className="w-6 h-6 text-cyber-gold" strokeWidth={2.5} />
                                        </div>
                                        <span className="bg-cyber-gold/10 text-cyber-gold font-nunito font-extrabold uppercase tracking-widest text-xs px-3 py-1 rounded-lg border border-cyber-gold/30">Canlı Destek</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-nunito font-black text-black dark:text-white mb-3 uppercase tracking-tight">
                                        Daha Fazla Yardıma mı İhtiyacınız Var?
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400 font-nunito font-bold italic max-w-md">
                                        "Eğitim her çocuğun hakkıdır. Biz bu hakkı en profesyonel şekilde sunmak için buradayız."
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link to="/contact">
                                        <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} className="px-6 py-3 bg-white dark:bg-slate-700 text-black dark:text-white border-3 border-black/10 font-nunito font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all text-center">
                                            İletişime Geç
                                        </motion.div>
                                    </Link>
                                    <a href="https://wa.me/905416150721" target="_blank" rel="noopener noreferrer">
                                        <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} className="px-6 py-3 bg-cyber-emerald text-black border-3 border-black/10 font-nunito font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all flex items-center justify-center gap-2">
                                            <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
                                            WhatsApp
                                        </motion.div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Trust Badges */}
                <div className="mt-12 flex flex-wrap justify-center gap-3">
                    {[
                        { icon: ShieldCheck, label: 'Güvenli Altyapı', color: 'text-cyber-blue' },
                        { icon: Rocket, label: 'Hızlı Aktivasyon', color: 'text-cyber-pink' },
                        { icon: Gift, label: 'Sürekli Güncelleme', color: 'text-cyber-emerald' },
                    ].map((badge) => (
                        <div key={badge.label} className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border-2 border-black/10 dark:border-white/10">
                            <badge.icon className={`w-4 h-4 ${badge.color}`} strokeWidth={2.5} />
                            <span className="text-xs font-nunito font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{badge.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
