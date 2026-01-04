import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    ChevronLeft,
    MessageCircle,
    HelpCircle,
    Zap,
    CreditCard,
    BookOpen,
    Wrench,
    Headphones,
    Sparkles,
    Crown,
    Rocket,
    Gift,
    ShieldCheck
} from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const FAQPage: React.FC = () => {
    const [openItem, setOpenItem] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('Genel');

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

    const categories = [
        { name: 'Genel', icon: HelpCircle, color: 'from-blue-500 to-cyan-500' },
        { name: 'XP & Ekonomi', icon: Zap, color: 'from-amber-500 to-orange-500' },
        { name: 'Paketler', icon: Crown, color: 'from-purple-500 to-pink-500' },
        { name: 'Atölyeler', icon: Rocket, color: 'from-emerald-500 to-teal-500' },
        { name: 'Teknik', icon: Wrench, color: 'from-slate-500 to-gray-600' },
        { name: 'Destek', icon: Headphones, color: 'from-rose-500 to-pink-500' },
    ];

    const toggleItem = (index: number) => {
        setOpenItem(openItem === index ? null : index);
    };

    const filteredItems = faqItems.filter(item => item.category === activeCategory);

    return (
        <div className="min-h-screen bg-[#050816] pt-24 pb-20 px-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto max-w-4xl relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition-colors mb-6 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                            <ChevronLeft size={18} />
                        </div>
                        <span className="text-sm uppercase tracking-[0.2em] font-black">Geri Dön</span>
                    </Link>

                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-blue-500" />
                        <span className="text-blue-400 font-black tracking-widest text-sm uppercase">Bilgi Merkezi</span>
                        <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-blue-500" />
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 tracking-tight">
                        Aklınıza <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Takılan</span> Her Şey
                    </h1>
                    <p className="text-slate-400 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
                        BilsemC2 platformu ve eğitim sistemimiz hakkında en güncel bilgilere buradan ulaşabilirsiniz.
                    </p>
                </motion.div>

                {/* Category Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        const isActive = activeCategory === category.name;
                        return (
                            <motion.button
                                key={category.name}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setActiveCategory(category.name); setOpenItem(null); }}
                                className={`relative p-4 rounded-2xl transition-all duration-300 border h-full flex flex-col items-center justify-center gap-3 ${isActive
                                        ? `bg-gradient-to-br ${category.color} border-transparent shadow-xl shadow-blue-500/20 text-white`
                                        : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10 hover:bg-slate-800/60'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                                <span className="text-[11px] font-black uppercase tracking-wider text-center line-height-1">
                                    {category.name}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* FAQ Content */}
                <div className="space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {filteredItems.map((item, index) => (
                                <div
                                    key={index}
                                    className={`group rounded-3xl border transition-all duration-300 overflow-hidden ${openItem === index
                                            ? 'bg-slate-900/80 border-blue-500/30'
                                            : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <button
                                        className="w-full px-8 py-6 flex justify-between items-center text-left"
                                        onClick={() => toggleItem(index)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${openItem === index ? 'bg-blue-400 scale-125' : 'bg-slate-700'}`} />
                                            <span className={`text-lg font-bold transition-colors ${openItem === index ? 'text-white' : 'text-slate-300'}`}>
                                                {item.question}
                                            </span>
                                        </div>
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${openItem === index ? 'bg-blue-500 text-white rotate-180' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                            <ChevronDown className="w-6 h-6" />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {openItem === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                            >
                                                <div className="px-8 pb-8 pt-2">
                                                    <div className="h-[1px] w-full bg-gradient-to-r from-blue-500/20 to-transparent mb-6" />
                                                    <p className="text-slate-400 text-lg leading-relaxed whitespace-pre-line">
                                                        {item.answer}
                                                    </p>

                                                    {item.category === 'Paketler' && (
                                                        <div className="mt-6 flex gap-4">
                                                            <Link
                                                                to="/pricing"
                                                                className="flex items-center gap-2 text-blue-400 font-black text-sm uppercase tracking-widest hover:text-blue-300 transition-all"
                                                            >
                                                                Detaylı İncele <ChevronDown className="-rotate-90 w-4 h-4" />
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
                    className="mt-20 relative group"
                >
                    <div className="absolute inset-0 bg-blue-500/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="relative bg-gradient-to-br from-slate-900 to-blue-950 border border-white/10 rounded-[2.5rem] p-10 lg:p-14 overflow-hidden shadow-2xl">
                        {/* Decorative background labels */}
                        <div className="absolute top-10 right-10 text-8xl font-black text-white/5 select-none pointer-events-none uppercase italic">HELP</div>

                        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                            <div className="flex-1 text-center lg:text-left">
                                <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                                        <MessageCircle className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <span className="text-blue-400 font-black uppercase tracking-[0.3em] text-xs">Canlı Destek</span>
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight">
                                    Hala bir <span className="text-blue-400">sorunuz</span> mu var?
                                </h2>
                                <p className="text-slate-400 text-lg lg:text-xl leading-relaxed max-w-lg italic">
                                    "Eğitim her çocuğun hakkıdır. Biz bu hakkı en profesyonel şekilde sunmak için buradayız."
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <Link
                                    to="/contact"
                                    className="px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-blue-400 hover:text-white transition-all duration-300 shadow-xl"
                                >
                                    İletişime Geç
                                </Link>
                                <a
                                    href="https://wa.me/905416150721"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-10 py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 transition-all duration-300 shadow-xl flex items-center gap-3 shadow-emerald-500/20"
                                >
                                    <MessageCircle className="w-6 h-6" />
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Minimal info badges */}
                <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-40">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Güvenli Altyapı</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Rocket className="w-5 h-5 text-purple-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Hızlı Aktivasyon</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Sürekli Güncelleme</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
