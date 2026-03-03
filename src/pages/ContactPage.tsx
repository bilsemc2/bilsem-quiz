import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Clock, CheckCircle, Mail, MapPin, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// ═══════════════════════════════════════════════
// 📞 ContactPage — Kid-UI Çocuk Dostu Tasarım
// ═══════════════════════════════════════════════

const supportTopics = [
    { text: 'Teknik sorular ve sorunlar', icon: '🔧' },
    { text: 'Üyelik işlemleri', icon: '👤' },
    { text: 'Ödeme ve fatura işlemleri', icon: '💳' },
    { text: 'Genel bilgi ve sorular', icon: '❓' },
];

const ContactPage: React.FC = () => {
    const whatsappNumber = '+905416150721';
    const whatsappMessage = encodeURIComponent('Merhaba, BilsemC2 hakkında bilgi almak istiyorum.');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    return (
        <div className="min-h-screen overflow-hidden transition-colors duration-300">
            {/* Background pattern — dots */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto max-w-4xl relative z-10 pt-24 pb-12 px-6">
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
                        Ana Sayfa
                    </Link>
                    <h1 className="text-5xl lg:text-7xl font-nunito font-black text-black dark:text-white mb-5 uppercase tracking-tight leading-none">
                        💬 <span className="text-cyber-emerald">İletişim</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-xl mx-auto font-nunito font-bold">
                        Size yardımcı olmak için WhatsApp üzerinden 7/24 hizmet veriyoruz.
                    </p>
                </motion.div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl shadow-neo-lg overflow-hidden"
                >
                    {/* WhatsApp Section */}
                    <div className="p-8 lg:p-12 text-center border-b-4 border-dashed border-black/15 dark:border-white/10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-20 h-20 bg-cyber-emerald border-3 border-black/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-neo-md"
                        >
                            <MessageCircle className="w-10 h-10 text-black" strokeWidth={2.5} />
                        </motion.div>

                        <h2 className="text-3xl lg:text-4xl font-nunito font-black text-black dark:text-white mb-3 uppercase tracking-tight">
                            WhatsApp Destek
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto font-nunito font-bold">
                            Sorularınız ve destek talepleriniz için bize ulaşabilirsiniz.
                        </p>

                        {/* Contact Info Pills */}
                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            <div className="bg-gray-50 dark:bg-slate-700 border-2 border-black/15 dark:border-white/10 rounded-xl px-5 py-3 flex items-center gap-2.5">
                                <Phone className="w-5 h-5 text-cyber-emerald" strokeWidth={2.5} />
                                <span className="text-black dark:text-white font-nunito font-extrabold">0541 615 0721</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-700 border-2 border-black/15 dark:border-white/10 rounded-xl px-5 py-3 flex items-center gap-2.5">
                                <Clock className="w-5 h-5 text-cyber-gold" strokeWidth={2.5} />
                                <span className="text-black dark:text-white font-nunito font-extrabold">09:00 - 21:00</span>
                            </div>
                        </div>

                        {/* WhatsApp CTA */}
                        <motion.a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-cyber-emerald text-black font-nunito font-extrabold text-lg uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-md hover:shadow-neo-lg transition-all"
                        >
                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Mesaj Gönder
                        </motion.a>
                    </div>

                    {/* Support Topics */}
                    <div className="p-8 lg:p-12">
                        <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white mb-6 text-center uppercase tracking-wider">
                            Destek Alabileceğiniz Konular
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {supportTopics.map((topic, index) => (
                                <motion.div
                                    key={topic.text}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.08 }}
                                    className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700 border-2 border-black/10 dark:border-white/10 rounded-xl p-4 hover:-translate-y-1 hover:shadow-neo-sm transition-all"
                                >
                                    <span className="text-2xl">{topic.icon}</span>
                                    <span className="text-black dark:text-white font-nunito font-bold text-sm uppercase tracking-wide flex-grow">{topic.text}</span>
                                    <CheckCircle className="w-5 h-5 text-cyber-emerald stroke-[2.5] flex-shrink-0" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Additional Contact Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5"
                >
                    <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md">
                        <div className="h-2 bg-cyber-blue" />
                        <div className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-cyber-blue/10 border-2 border-cyber-blue/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Mail className="w-6 h-6 text-cyber-blue" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold uppercase tracking-widest text-xs mb-0.5">E-Posta</p>
                                <p className="text-black dark:text-white font-nunito font-extrabold">destek@bilsemc2.com</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md">
                        <div className="h-2 bg-cyber-pink" />
                        <div className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-cyber-pink/10 border-2 border-cyber-pink/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-6 h-6 text-cyber-pink" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 font-nunito font-bold uppercase tracking-widest text-xs mb-0.5">Konum</p>
                                <p className="text-black dark:text-white font-nunito font-extrabold">Pamukkale, Denizli</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* FAQ Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-14 text-center"
                >
                    <p className="text-slate-600 dark:text-slate-400 font-nunito font-extrabold text-lg mb-5 uppercase tracking-wide">
                        Sıkça sorulan sorulara göz atmak ister misiniz?
                    </p>
                    <Link to="/faq">
                        <motion.div
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-3 px-7 py-3.5 bg-cyber-gold text-black font-nunito font-extrabold text-base uppercase tracking-wider border-3 border-black/10 rounded-xl shadow-neo-sm hover:shadow-neo-md transition-all"
                        >
                            <span className="text-xl">📋</span>
                            SSS Sayfası
                        </motion.div>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default ContactPage;
