import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Zap, Activity, Info } from 'lucide-react';

const BeyinAntrenoruMerkezi: React.FC = () => {
    const activities = [
        {
            title: "Renk Algılama",
            description: "Görsel algı ve tepki hızınızı geliştirin. Kısa süreliğine gösterilen renkleri doğru tanımlayın.",
            icon: <Activity className="w-8 h-8 text-blue-500" />,
            link: "/beyin-antrenoru/renk-algilama",
            color: "from-blue-500/20 to-indigo-500/20",
            borderColor: "border-blue-200"
        },
        {
            title: "Renk Sekansı",
            description: "Hafıza ve dikkat becerilerinizi geliştirin. Ekranda beliren renk sırasını hatırlayarak tekrar edin.",
            icon: <Brain className="w-8 h-8 text-purple-500" />,
            link: "/beyin-antrenoru/renk-sekansi",
            color: "from-purple-500/20 to-pink-500/20",
            borderColor: "border-purple-200"
        },
        {
            title: "Hız Okuma",
            description: "Okuma hızınızı ve odaklanma becerinizi artırıcı egzersizler yapın.",
            icon: <Zap className="w-8 h-8 text-amber-500" />,
            link: "/speed-reading",
            color: "from-amber-500/20 to-orange-500/20",
            borderColor: "border-amber-200"
        }
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 pb-20">
            {/* Hero Section with requested images */}
            <section className="relative pt-24 pb-16 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-100 to-transparent dark:from-indigo-900/20 pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <h1 className="text-4xl lg:text-6xl font-poppins font-bold leading-tight">
                                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        Beyin Antrenörü
                                    </span>
                                    <br />
                                    <span className="text-gray-800 dark:text-white">Merkezine Hoş Geldin!</span>
                                </h1>
                                <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
                                    Bilişsel becerilerini üst seviyeye taşı. Dikkat, hafıza ve algı yeteneklerini eğlenceli egzersizlerle geliştir.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="flex flex-wrap gap-4 justify-center lg:justify-start"
                            >
                                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Günlük Egzersizler Hazır</span>
                                </div>
                            </motion.div>
                        </div>

                        <div className="lg:w-1/2 flex justify-center items-center">
                            <div className="relative">
                                {/* beyni.png - Main prominent image */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8 }}
                                    className="relative z-20 group"
                                >
                                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
                                    <img
                                        src="/images/beyni.png"
                                        alt="Beyin Gelişimi"
                                        className="w-full max-w-[450px] relative drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                    />
                                </motion.div>

                                {/* beyninikullan.png - Decorative/Supporting prominent image */}
                                <motion.div
                                    animate={{
                                        y: [0, -15, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute -bottom-10 -right-10 z-30 w-48 lg:w-64"
                                >
                                    <img
                                        src="/images/beyninikullan.png"
                                        alt="Beynini Kullan"
                                        className="w-full drop-shadow-xl"
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Activities Grid */}
            <section className="container mx-auto px-6 mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activities.map((activity, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link to={activity.link} className="block group">
                                <div className={`h-full p-8 rounded-3xl bg-gradient-to-br ${activity.color} border ${activity.borderColor} dark:border-gray-700 backdrop-blur-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}>
                                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        {activity.icon}
                                    </div>
                                    <h3 className="mt-6 text-2xl font-bold font-poppins text-gray-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                                        {activity.title}
                                    </h3>
                                    <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {activity.description}
                                    </p>
                                    <div className="mt-6 flex items-center text-indigo-600 font-semibold gap-2">
                                        Hemen Başla
                                        <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Info Section */}
            <section className="container mx-auto px-6 mt-24">
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 lg:p-16 border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                        <div className="lg:w-1/2">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold mb-6">
                                <Info size={16} />
                                Biliyor muydunuz?
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-poppins font-bold text-gray-800 dark:text-white leading-snug">
                                Düzenli Beyin Egzersizleri Bilişsel Esnekliği Artırır
                            </h2>
                            <p className="mt-6 text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                Nöroplastisite özelliği sayesinde beynimiz, yeni deneyimler ve egzersizlerle kendini sürekli yenileyebilir. Günlük 15 dakikalık antrenmanlar hafıza performansını %30'a kadar artırabilir.
                            </p>
                        </div>
                        <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl text-center">
                                <div className="text-3xl font-bold text-indigo-600 mb-2">%40</div>
                                <div className="text-sm text-gray-500 font-medium">Daha Hızlı Karar Verme</div>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl text-center">
                                <div className="text-3xl font-bold text-purple-600 mb-2">2X</div>
                                <div className="text-sm text-gray-500 font-medium">Odaklanma Süresi</div>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl text-center">
                                <div className="text-3xl font-bold text-pink-600 mb-2">30dk</div>
                                <div className="text-sm text-gray-500 font-medium">Günlük İdeal Pratik</div>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl text-center">
                                <div className="text-3xl font-bold text-amber-600 mb-2">∞</div>
                                <div className="text-sm text-gray-500 font-medium">Sınırsız Gelişim</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BeyinAntrenoruMerkezi;
