import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Star, Users, ArrowRight, Palette, Music, Lightbulb, ChevronRight } from 'lucide-react';

const HomePage: React.FC = () => {
  const stats = [
    { label: "Aktif Öğrenci", value: "1000+", color: "text-indigo-600", icon: <Users size={20} /> },
    { label: "Eğlenceli Aktivite", value: "50+", color: "text-pink-600", icon: <Star size={20} /> },
    { label: "Kullanıcı Puanı", value: "4.9", color: "text-purple-600", icon: <Rocket size={20} /> },
  ];

  const workshops = [
    {
      title: "Bilsem Genel Yetenek",
      description: "Mantık, analiz ve problem çözme becerilerini en üst seviyeye taşı.",
      image: "images/gy.webp",
      link: "https://yetenekvezeka.com/",
      color: "from-blue-600 to-indigo-600",
      icon: <Lightbulb className="text-white" />,
      external: true
    },
    {
      title: "Bilsem Resim",
      description: "Sanatsal yaratıcılığını keşfet ve görsel zekânı geliştirerek fark yarat.",
      image: "images/resim.webp",
      link: "https://bilsemresim.com/",
      color: "from-pink-600 to-rose-600",
      icon: <Palette className="text-white" />,
      external: true
    },
    {
      title: "Bilsem Müzik",
      description: "Müzikal yeteneklerini keşfet, ritim ve kulak becerilerini geliştir.",
      image: "images/music.webp",
      link: "#",
      color: "from-purple-600 to-violet-600",
      icon: <Music className="text-white" />,
      comingSoon: true
    }
  ];

  return (
    <div className="font-open-sans text-gray-800 dark:text-gray-100 min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 -trindigo-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-indigo-200/50 dark:bg-indigo-900/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-pink-200/50 dark:bg-pink-900/20 rounded-full blur-[100px] animate-pulse delay-1000" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 text-center lg:text-left space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  Yeni Nesil Eğitim Başlıyor
                </motion.div>

                <h1 className="text-5xl lg:text-7xl font-poppins font-bold leading-tight">
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Bilsemc2
                  </span>
                  <span className="text-gray-900 dark:text-white block">Geleceği Tasarla</span>
                </h1>

                <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Yaratıcılığını keşfet, eğlenerek öğren ve bilişsel yeteneklerini <span className="text-indigo-600 font-bold">bilimsel yöntemlerle</span> geliştir! 🚀
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                <Link
                  to="/beyin-antrenoru-merkezi"
                  className="group px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-poppins font-bold rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.5)] transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  Hemen Başla
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <Link
                  to="/login"
                  className="px-10 py-5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white font-poppins font-bold rounded-2xl hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-center"
                >
                  Giriş Yap
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-10 pt-10 border-t border-gray-100 dark:border-gray-800">
                {stats.map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <div className={`text-3xl font-bold font-poppins ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      {stat.icon}
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, type: "spring" }}
              className="lg:w-1/2 relative flex justify-center"
            >
              <div className="relative group">
                {/* Modern background shapes */}
                <div className="absolute inset-x-0 bottom-0 top-1/4 bg-gradient-to-t from-indigo-500/20 to-transparent rounded-[4rem] -rotate-6 scale-110 blur-2xl" />
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-[4rem] rotate-3 scale-105" />

                {/* BEYNİNİ KULLAN - Primary Image */}
                <motion.img
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  src="images/beyninikullan.png"
                  alt="Bilsemc2 Beynini Kullan"
                  className="relative w-full max-w-[500px] z-10 drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-700"
                />

                {/* Floating decor symbols */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-10 -right-10 w-24 h-24 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl z-20"
                >
                  <Rocket className="text-indigo-600" size={40} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ATÖLYELER SECTION */}
      <section className="py-32 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl lg:text-5xl font-poppins font-bold">
                Eğlenceli <br />
                <span className="bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">Atölyelerimiz</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Her yaş grubuna göre özel tasarlanmış, gelişim odaklı içerikler.
              </p>
            </div>
            <Link to="/services" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all">
              Tümünü Gör <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {workshops.map((workshop, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="group relative bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <div className="h-56 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent z-10`} />
                  <img
                    src={workshop.image}
                    alt={workshop.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {workshop.comingSoon && (
                    <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-white/90 dark:bg-black/50 backdrop-blur text-xs font-black uppercase tracking-widest rounded-full">
                      Yakında
                    </div>
                  )}
                  <div className={`absolute bottom-6 left-6 z-20 w-12 h-12 rounded-xl bg-gradient-to-br ${workshop.color} flex items-center justify-center shadow-lg`}>
                    {workshop.icon}
                  </div>
                </div>

                <div className="p-8 space-y-4">
                  <h3 className="text-2xl font-poppins font-bold group-hover:text-indigo-600 transition-colors">
                    {workshop.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {workshop.description}
                  </p>

                  {workshop.external ? (
                    <a
                      href={workshop.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-bold text-indigo-600 group-hover:gap-3 transition-all"
                    >
                      İncele <ArrowRight size={18} />
                    </a>
                  ) : workshop.comingSoon ? (
                    <span className="inline-flex items-center gap-2 font-bold text-gray-400">
                      Hazırlanıyor <Music size={18} />
                    </span>
                  ) : (
                    <Link to={workshop.link} className="inline-flex items-center gap-2 font-bold text-indigo-600 group-hover:gap-3 transition-all">
                      Hemen Keşfet <ArrowRight size={18} />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HAKKIMIZDA SECTION */}
      <section className="py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="bg-indigo-600 rounded-[3rem] p-12 lg:p-24 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-[60px] -translate-x-1/4 translate-y-1/4" />

            <div className="flex flex-col lg:flex-row items-center gap-20 relative z-10">
              <div className="lg:w-1/2 space-y-10">
                <div className="space-y-6">
                  <h2 className="text-4xl lg:text-6xl font-poppins font-bold text-white leading-tight">
                    Neden <br /> Bilsemc2?
                  </h2>
                  <p className="text-xl lg:text-2xl text-indigo-100 leading-relaxed">
                    Yenilikçi eğitim anlayışımızla çocukların <span className="text-white font-bold italic">potansiyellerini gerçeğe</span> dönüştürüyoruz.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    "Kişiselleştirilmiş Öğrenme",
                    "Eğlenceli Aktiviteler",
                    "Uzman Rehberliği",
                    "Bilimsel Metotlar"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 bg-white/10 group-hover:bg-white/20 transition-colors rounded-xl flex items-center justify-center border border-white/20">
                        <ChevronRight className="text-white" size={20} />
                      </div>
                      <span className="font-bold text-white text-lg">{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/services"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-white text-indigo-600 font-poppins font-black rounded-2xl hover:bg-indigo-50 transform hover:scale-105 transition-all shadow-2xl"
                >
                  Daha Fazla Keşfet
                  <ArrowRight size={22} />
                </Link>
              </div>

              <div className="lg:w-1/2 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl scale-110" />
                  <motion.img
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    src="images/kurucu.webp"
                    alt="Bilsemc2 Kurucusu"
                    className="relative w-72 h-72 lg:w-96 lg:h-96 rounded-full object-cover shadow-2xl border-[10px] border-white/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;