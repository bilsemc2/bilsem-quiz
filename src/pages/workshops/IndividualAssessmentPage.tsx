import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Star, ChevronLeft, Rocket, Zap, Trophy, Lightbulb, Radio, Search, Cpu, Hash, LayoutGrid, TrendingUp, ArrowLeftRight, Languages, Grid3X3, Eye, Compass, Smile, PenTool, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './bireysel.css';

const IndividualAssessmentPage: React.FC = () => {
    const modules = [
        {
            id: 'cosmic-memory',
            title: "Kozmik Hafıza",
            desc: "Görsel-uzamsal hafıza ve çalışma belleği simülatörü.",
            icon: <Star />,
            color: "indigo",
            difficulty: "Zor",
            link: "/games/kozmik-hafiza"
        },
        {
            id: 'n-back',
            title: "N-Geri Şifresi",
            desc: "Bilişsel bilimin en etkili zeka egzersizi. N-adım önceki şekli hatırla ve karşılaştır.",
            icon: <Radio />,
            color: "emerald",
            difficulty: "Uzman",
            link: "/games/n-geri-sifresi"
        },
        {
            id: 'shadow-detective',
            title: "Gölge Dedektifi",
            desc: "Karmaşık desenleri 3 saniyede hatırla. Birbirine çok benzeyen kanıtlar arasından gerçeği bul!",
            icon: <Search />,
            color: "amber",
            difficulty: "Uzman",
            link: "/games/golge-dedektifi"
        },
        {
            id: 'cross-match',
            title: "Çapraz Eşleşme",
            desc: "Sembol ve renk kombinasyonlarını hatırla. Dinamik karıştırma efektlerine karşı verileri takip et!",
            icon: <Cpu />,
            color: "rose",
            difficulty: "Uzman",
            link: "/games/capraz-eslesme"
        },
        {
            id: 'signal-sum',
            title: "Sinyal Toplamı",
            desc: "Neon sinyaller arasından doğru rengi filtrele ve zihninden topla. Üst düzey odaklanma gerektirir!",
            icon: <Hash />,
            color: "cyan",
            difficulty: "Uzman",
            link: "/games/sinyal-toplami"
        },
        {
            id: 'target-grid',
            title: "Bak ve Bul",
            desc: "Izgaradaki sayıları hafızana al ve hedef toplama ulaşmak için doğru kartları eşleştir. Hız ve hafıza bir arada!",
            icon: <LayoutGrid />,
            color: "purple",
            difficulty: "Uzman",
            link: "/games/hedef-sayi"
        },
        {
            id: 'stream-sum',
            title: "Akışkan Toplam",
            desc: "Sürekli akan sayıları takip et ve her yeni sayıyı bir öncekiyle topla. Odak ve hızını test et!",
            icon: <TrendingUp />,
            color: "sky",
            difficulty: "Uzman",
            link: "/games/akiskan-toplam"
        },
        {
            id: 'invisible-tower',
            title: "Görünmez Kule",
            desc: "Piramit katmanlarında yükselen sayıları hafızana al. Çarpanlar ve negatif sayılarla dinamik toplamı hesapla!",
            icon: <TrendingUp />,
            color: "amber",
            difficulty: "Uzman",
            link: "/games/gorunmez-kule"
        },
        {
            id: 'matrix-echo',
            title: "Matris Yankısı",
            desc: "3x3 matristeki sayıları takip et. Shuffling sonrası karmaşık mantıksal soruları yanıtla!",
            icon: <LayoutGrid />,
            color: "blue",
            difficulty: "Uzman",
            link: "/games/matris-yankisi"
        },
        {
            id: 'reflection-sum',
            title: "Yansıma Toplamı",
            desc: "Rakam dizisini izle. Hem geriye doğru hatırla hem de toplamı hesapla. Ayna efektine dikkat et!",
            icon: <ArrowLeftRight />,
            color: "purple",
            difficulty: "Uzman",
            link: "/games/yansima-toplami"
        },
        {
            id: 'idioms',
            title: "Deyimler Atölyesi",
            desc: "Sözsel zekanı ve kültürel birikimini test et. Deyimleri anlamlarıyla eşleştir ve yorumla!",
            icon: <Languages />,
            color: "pink",
            difficulty: "Orta",
            link: "/deyimler"
        },
        {
            id: 'maze',
            title: "Labirent Ustası",
            desc: "Duvarlara değmeden çıkışı bul! Görsel-uzamsal zeka ve motor koordinasyon becerini test et.",
            icon: <Grid3X3 />,
            color: "teal",
            difficulty: "Zor",
            link: "/games/labirent"
        },
        {
            id: 'stroop',
            title: "Stroop Etkisi",
            desc: "Yazının rengini seç, kelimeyi değil! Bilişsel esneklik ve dikkat kontrolü testi.",
            icon: <Eye />,
            color: "violet",
            difficulty: "Orta",
            link: "/games/stroop"
        },
        {
            id: 'direction-stroop',
            title: "Yön Stroop",
            desc: "Yazının konumunu seç, kelimeyi değil! Uzamsal dikkat ve bilişsel esneklik testi.",
            icon: <Compass />,
            color: "cyan",
            difficulty: "Orta",
            link: "/games/yon-stroop"
        },
        {
            id: 'emoji-stroop',
            title: "Emoji Stroop",
            desc: "Emojiyi tanı, yazıya aldanma! Çocuklar için eğlenceli dikkat ve algı testi.",
            icon: <Smile />,
            color: "pink",
            difficulty: "Kolay",
            link: "/games/emoji-stroop"
        },
        {
            id: 'pencil-stroop',
            title: "Renkli Kalemler",
            desc: "Yazının rengindeki kalemi seç! Görsel Stroop dikkat testi.",
            icon: <PenTool />,
            color: "amber",
            difficulty: "Orta",
            link: "/games/renkli-kalemler"
        },
        {
            id: 'symbol-match',
            title: "Şekil Hafızası",
            desc: "Renkli şekilleri ezberle! Hangi şekil hangi renkteydi? Görsel hafıza ve dikkat testi.",
            icon: <Lightbulb />,
            color: "violet",
            difficulty: "Orta",
            link: "/games/sekil-hafizasi"
        },
        {
            id: 'dual-bind',
            title: "Çift Mod Hafıza",
            desc: "Renk→Şekil ve Şekil→Renk çift yönlü hatırla! İleri düzey çalışma belleği testi.",
            icon: <Link2 />,
            color: "rose",
            difficulty: "Zor",
            link: "/games/cift-mod-hafiza"
        }
    ];

    return (
        <div className="bireysel-workshop-container pt-24 pb-12 px-6">
            {/* Background Blobs */}
            <div className="bireysel-bg-blobs">
                <div className="bireysel-blob bireysel-blob-1" />
                <div className="bireysel-blob bireysel-blob-2" />
                <div className="bireysel-blob bireysel-blob-3" />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <Link to="/atolyeler/genel-yetenek" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors mb-4 uppercase text-xs tracking-widest">
                            <ChevronLeft size={16} /> Genel Yetenek Atölyesi
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-500/20 rounded-[1.5rem] text-indigo-400 border border-indigo-500/30">
                                <Brain size={48} />
                            </div>
                            <div>
                                <h1 className="text-4xl lg:text-6xl font-poppins font-black text-white leading-tight tracking-tight">
                                    Bireysel <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Değerlendirme</span>
                                </h1>
                                <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-sm">2. Aşama Hazırlık Merkezi</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 flex items-center gap-8 shadow-2xl"
                    >
                        <div className="hidden md:block">
                            <div className="text-white font-black text-right text-xl">Zeka Ölçekleri</div>
                            <div className="text-indigo-400 text-sm font-bold uppercase tracking-widest text-right italic">TÜZÖ</div>
                        </div>
                        <div className="h-14 w-px bg-white/10 hidden md:block" />
                        <div className="flex -space-x-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 border-2 border-slate-950 flex items-center justify-center text-white text-sm font-black shadow-lg">
                                    {i}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Modüller Listesi */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {modules.map((mod, i) => (
                        <motion.div
                            key={mod.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -10 }}
                            className="group relative"
                        >
                            <div className="h-full bg-white/5 backdrop-blur-xl rounded-[3.5rem] p-10 border border-white/10 hover:border-indigo-500/30 transition-all duration-500 flex flex-col justify-between overflow-hidden relative shadow-2xl">
                                {/* Decorative Gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />

                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 text-3xl group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-xl group-hover:scale-110">
                                            {mod.icon}
                                        </div>
                                        <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                            {mod.difficulty}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-violet-400 transition-all duration-300 tracking-tight">{mod.title}</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed italic line-clamp-2">{mod.desc}</p>
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                                    <div className="text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:scale-105 transition-transform">
                                        <Zap size={14} fill="currentColor" className="animate-pulse" /> Simülatör Hazır
                                    </div>
                                    <Link
                                        to={mod.link}
                                        state={{ autoStart: true }}
                                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-black text-sm rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/40 transition-all flex items-center gap-3 group/btn"
                                    >
                                        BAŞLAT <Rocket size={18} fill="currentColor" className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Bilgi Kartı */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[3.5rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group border-4 border-white/10"
                    >
                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                                💡
                            </div>
                            <h3 className="text-3xl font-black tracking-tight">Neden 2. Aşama?</h3>
                            <p className="text-base text-indigo-100 font-medium leading-relaxed">
                                Tablet sınavını geçen öğrenciler, bireysel değerlendirmede zekalarını çok yönlü (sözsel, sayısal, performans) ispat ederler. Buradaki modüller, o mülakat ortamındaki bilişsel baskıyı ve soru tiplerini simüle etmek için tasarlanmıştır.
                            </p>
                        </div>
                        <div className="mt-10 relative z-10">
                            <div className="flex items-center gap-3 text-indigo-200 text-sm font-black uppercase tracking-widest">
                                <Trophy size={20} className="text-yellow-400" /> Üstün Başarı Hedefi
                            </div>
                        </div>

                        {/* Arka Plan Dekoru */}
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default IndividualAssessmentPage;
