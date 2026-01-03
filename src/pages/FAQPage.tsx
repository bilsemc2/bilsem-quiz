import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, MessageCircle, HelpCircle, Zap, CreditCard, BookOpen, Wrench, Headphones } from 'lucide-react';

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
            category: 'XP Sistemi',
            question: 'XP sistemi nasıl çalışır?',
            answer: 'BilsemC2\'de her etkinlik ve sayfa için belirli bir XP puanı gereklidir. Etkinliklere katıldıkça XP harcanır, bu yüzden başlangıçta yüksek XP ile başlamak önemlidir. Temel plan ile XP kazanır ve tüm temel özelliklere erişim sağlarsınız. XP\'niz bittiğinde yeni XP satın alabilir veya etkinliklerden XP kazanabilirsiniz.'
        },
        {
            category: 'XP Sistemi',
            question: 'Hangi sayfalarda ne kadar XP harcanır?',
            answer: 'Sayfaların XP maliyetleri şöyledir:\n\n- Düello: Her düello girişinde 10 XP\n- Hızlı Okuma: Her egzersiz için 0 XP\n- Hafıza Oyunu: Her oyun girişinde 10 XP\n- Eksik Parça: Her sayfaya girişte 10 XP\n- Açık Küp: Her girişte 10 XP\n- Şekil Oyunu: Her giriş için 10 XP\n- Ayna Simetrisi: Her giriş için 10 XP\n- Döndürme: Her giriş için 10 XP'
        },
        {
            category: 'Genel',
            question: 'BilsemC2 nedir?',
            answer: 'BilsemC2, Bilim ve Sanat Merkezleri (BİLSEM) sınavlarına hazırlanan öğrenciler için özel olarak tasarlanmış bir online eğitim platformudur. Görsel-uzamsal zeka, mantıksal düşünme ve problem çözme becerilerini geliştirmeye yönelik gelecekte 150+ interaktif oyun ve alıştırma sunar.'
        },
        {
            category: 'Genel',
            question: 'BilsemC2 kimler için uygundur?',
            answer: 'BilsemC2, BİLSEM sınavlarına hazırlanan ilkokul öğrencileri için tasarlanmıştır. Ayrıca, çocuklarının zihinsel becerilerini geliştirmek isteyen veliler ve öğrencilerine farklı öğrenme yöntemleri sunmak isteyen öğretmenler de platformdan faydalanabilir.'
        },
        {
            category: 'Üyelik',
            question: 'BilsemC2\'ye nasıl üye olabilirim?',
            answer: 'Platformumuza üye olmak için ana sayfadaki "Ücretsiz Başla" butonuna tıklayarak kayıt formunu doldurabilirsiniz. Kayıt işlemi için geçerli bir e-posta adresi ve şifre belirlemeniz yeterlidir. Kayıt olduğunuzda 50 XP başlangıç bonusu kazanırsınız!'
        },
        {
            category: 'Üyelik',
            question: 'VIP üyelik nedir ve avantajları nelerdir?',
            answer: 'VIP üyelik ile özel içeriklere erişim, Quizizz kodları, reklamsız deneyim, öncelikli destek ve bonus XP kazanımı gibi ayrıcalıklardan faydalanabilirsiniz. VIP üyelik hakkında detaylı bilgi için Fiyatlandırma sayfamızı ziyaret edebilirsiniz.'
        },
        {
            category: 'İçerik',
            question: 'BilsemC2\'de hangi tür sorular bulunuyor?',
            answer: 'Platformumuzda şu kategorilerde sorular bulunmaktadır:\n\n- Matris soruları (150+ kural)\n- Stroop efekti oyunları (4 mod)\n- Labirent çözme\n- Görsel hafıza oyunları\n- 3B düşünme ve döndürme\n- Simetri ve örüntü\n- Eksik parça bulmaca\n- Deyimler atölyesi'
        },
        {
            category: 'İçerik',
            question: 'Sorular gerçek BİLSEM sınavıyla uyumlu mu?',
            answer: 'Evet, platformumuzdaki tüm sorular ve alıştırmalar, BİLSEM 1. ve 2. aşama sınavlarının formatına ve zorluk seviyesine uygun olarak hazırlanmıştır. Sürekli güncellenen soru havuzumuz, uzman eğitimciler tarafından oluşturulmakta ve denetlenmektedir.'
        },
        {
            category: 'Teknik',
            question: 'Hangi cihazlardan erişebilirim?',
            answer: 'BilsemC2\'ye bilgisayar, tablet ve akıllı telefonlar üzerinden erişebilirsiniz. Platform tüm modern web tarayıcıları (Chrome, Safari, Firefox, Edge) ile uyumlu çalışmaktadır. Tablet deneyimi için optimize edilmiş oyunlarımız da mevcuttur.'
        },
        {
            category: 'Teknik',
            question: 'İnternet bağlantısı gerekli mi?',
            answer: 'Evet, BilsemC2\'yi kullanmak için internet bağlantısı gereklidir. İlerlemeniz ve XP\'niz anlık olarak kaydedilir, böylece farklı cihazlardan kaldığınız yerden devam edebilirsiniz.'
        },
        {
            category: 'Destek',
            question: 'Teknik bir sorun yaşarsam ne yapmalıyım?',
            answer: 'Teknik sorunlar için WhatsApp destek hattımızdan (0541 615 0721) bize ulaşabilirsiniz. Destek saatlerimiz: Her gün 09:00 - 21:00. Ayrıca İletişim sayfamızdan da mesaj gönderebilirsiniz.'
        },
        {
            category: 'Destek',
            question: 'Geri bildirimde bulunabilir miyim?',
            answer: 'Evet, platformun geliştirilmesine katkıda bulunmak için geri bildirimlerinizi bizimle paylaşabilirsiniz. Önerilerinizi WhatsApp üzerinden veya İletişim sayfamızdan iletebilirsiniz. Her görüş bizim için değerlidir!'
        }
    ];

    const categories = [
        { name: 'Genel', icon: HelpCircle, color: 'from-blue-500 to-cyan-500' },
        { name: 'XP Sistemi', icon: Zap, color: 'from-amber-500 to-orange-500' },
        { name: 'Üyelik', icon: CreditCard, color: 'from-purple-500 to-pink-500' },
        { name: 'İçerik', icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
        { name: 'Teknik', icon: Wrench, color: 'from-slate-500 to-gray-600' },
        { name: 'Destek', icon: Headphones, color: 'from-rose-500 to-pink-500' },
    ];

    const toggleItem = (index: number) => {
        setOpenItem(openItem === index ? null : index);
    };

    const filteredItems = faqItems.filter(item => item.category === activeCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Ana Sayfa
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
                        ❓ <span className="text-blue-400">Sıkça Sorulan</span> Sorular
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        BilsemC2 hakkında merak ettiğiniz tüm soruların cevapları burada.
                    </p>
                </motion.div>

                {/* Category Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <button
                                    key={category.name}
                                    onClick={() => { setActiveCategory(category.name); setOpenItem(null); }}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeCategory === category.name
                                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-white/5'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {category.name}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* FAQ Items */}
                <div className="space-y-3">
                    {filteredItems.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
                        >
                            <button
                                className="w-full px-6 py-5 flex justify-between items-center text-left"
                                onClick={() => toggleItem(index)}
                            >
                                <span className="text-lg font-medium text-white pr-4">
                                    {item.question}
                                </span>
                                <motion.div
                                    animate={{ rotate: openItem === index ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${openItem === index
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-slate-700/50 text-slate-400'
                                        }`}
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {openItem === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-5 border-t border-white/5 pt-4">
                                            <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                                                {item.answer}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Still Have Questions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-16"
                >
                    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
                            <MessageCircle className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Hala sorularınız mı var?
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Burada cevabını bulamadığınız sorularınız için bize ulaşın.
                        </p>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105"
                        >
                            <MessageCircle className="w-5 h-5" />
                            İletişime Geçin
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FAQPage;
