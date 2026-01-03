import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Clock, CheckCircle, Mail, MapPin, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContactPage: React.FC = () => {
    const whatsappNumber = '+905416150721';
    const whatsappMessage = encodeURIComponent('Merhaba, BilsemC2 hakkında bilgi almak istiyorum.');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    const supportTopics = [
        { text: 'Teknik sorular ve sorunlar', icon: '🔧' },
        { text: 'Üyelik işlemleri', icon: '👤' },
        { text: 'Ödeme ve fatura işlemleri', icon: '💳' },
        { text: 'Genel bilgi ve sorular', icon: '❓' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-emerald-400 font-bold hover:text-emerald-300 transition-colors mb-4 uppercase text-xs tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Ana Sayfa
                    </Link>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
                        💬 <span className="text-emerald-400">İletişim</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Size yardımcı olmak için WhatsApp üzerinden 7/24 hizmet veriyoruz.
                    </p>
                </motion.div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* WhatsApp Section */}
                    <div className="p-8 lg:p-12 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
                        >
                            <MessageCircle className="w-10 h-10 text-white" />
                        </motion.div>

                        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                            WhatsApp Destek Hattı
                        </h2>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            Sorularınız ve destek talepleriniz için WhatsApp üzerinden bize ulaşabilirsiniz.
                        </p>

                        {/* Contact Info */}
                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            <div className="bg-slate-700/50 rounded-xl px-5 py-3 flex items-center gap-3">
                                <Phone className="w-5 h-5 text-emerald-400" />
                                <span className="text-white font-bold">0541 615 0721</span>
                            </div>
                            <div className="bg-slate-700/50 rounded-xl px-5 py-3 flex items-center gap-3">
                                <Clock className="w-5 h-5 text-amber-400" />
                                <span className="text-white">Her gün 09:00 - 21:00</span>
                            </div>
                        </div>

                        {/* WhatsApp Button */}
                        <motion.a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp'tan Mesaj Gönder
                        </motion.a>
                    </div>

                    {/* Support Topics */}
                    <div className="bg-slate-800/50 border-t border-white/5 p-8 lg:p-12">
                        <h3 className="text-xl font-bold text-white mb-6 text-center">
                            Destek Alabileceğiniz Konular
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {supportTopics.map((topic, index) => (
                                <motion.div
                                    key={topic.text}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className="flex items-center gap-3 bg-slate-700/30 rounded-xl p-4"
                                >
                                    <span className="text-2xl">{topic.icon}</span>
                                    <span className="text-slate-300">{topic.text}</span>
                                    <CheckCircle className="w-5 h-5 text-emerald-400 ml-auto" />
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
                    className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Mail className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">WhatsApp</p>
                            <p className="text-white font-bold">+90 541 615 0721</p>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Konum</p>
                            <p className="text-white font-bold">Pamukkale, Denizli, Türkiye</p>
                        </div>
                    </div>
                </motion.div>

                {/* FAQ Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center"
                >
                    <p className="text-slate-400 mb-4">Sıkça sorulan sorulara göz atmak ister misiniz?</p>
                    <Link
                        to="/faq"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 text-white font-bold rounded-xl hover:bg-slate-700 transition-all border border-white/10"
                    >
                        📋 SSS Sayfası
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default ContactPage;
