import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Star, Users, Palette, Music, Lightbulb } from 'lucide-react';

const HomePage: React.FC = () => {
  const stats = [
    { label: "Aktif Öğrenci", value: "1000+", color: "text-purple-600", icon: <Users size={20} /> },
    { label: "Eğlenceli Aktivite", value: "Gelecekte 50+", color: "text-purple-600", icon: <Star size={20} /> },
    { label: "Kullanıcı Puanı", value: "4.9", color: "text-purple-600", icon: <Rocket size={20} /> },
  ];

  const workshops = [
    {
      title: "Bilsem Genel Yetenek",
      description: "Mantık, analiz ve problem çözme becerilerini en üst seviyeye taşı.",
      image: "images/gy.webp",
      link: "/atolyeler/genel-yetenek",
      color: "bg-[#7E30E1]",
      icon: <Lightbulb className="text-white" />,
    },
    {
      title: "Bilsem Resim",
      description: "Sanatsal yaratıcılığını keşfet ve görsel zekânı geliştirerek fark yarat.",
      image: "images/resim.webp",
      link: "/atolyeler/resim",
      color: "bg-pink-500",
      icon: <Palette className="text-white" />,
    },
    {
      title: "Bilsem Müzik",
      description: "Müzikal yeteneklerini keşfet, ritim ve kulak becerilerini geliştir.",
      image: "images/music.webp",
      link: "/atolyeler/muzik",
      color: "bg-blue-500",
      icon: <Music className="text-white" />,
    }
  ];

  return (
    <div className="font-open-sans text-gray-800 dark:text-gray-100 min-h-screen bg-[#F8F6FF] dark:bg-gray-900 overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Animated Background Blobs/Circles - Matching Design */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply opacity-70 animate-float-blob filter blur-xl" />
        <div className="absolute top-40 right-20 w-48 h-48 bg-purple-400 rounded-full mix-blend-multiply opacity-70 animate-float-blob filter blur-xl delay-700" />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply opacity-70 animate-float-blob filter blur-xl delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-yellow-200 rounded-full mix-blend-multiply opacity-70 animate-float-blob filter blur-xl delay-2000" />
        <div className="absolute top-20 left-1/2 w-24 h-24 bg-green-300 rounded-full mix-blend-multiply opacity-70 animate-float-blob filter blur-xl delay-1500" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center justify-center text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <div className="flex items-center justify-center gap-6">
                <img
                  src="images/beyni.webp"
                  alt="Beyin"
                  className="w-32 lg:w-48 drop-shadow-[0_20px_50px_rgba(126,48,225,0.4)] animate-float-blob"
                />
                <img
                  src="images/logo2.webp"
                  alt="Beynini Kullan!"
                  className="w-full max-w-[600px] drop-shadow-[0_20px_50px_rgba(126,48,225,0.3)]"
                />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-2xl lg:text-3xl font-poppins font-bold mt-8 text-purple-brand"
              >
                Eğlenceli mantık sorularıyla zekanı geliştir! 🚀
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link
                to="/beyin-antrenoru-merkezi"
                className="px-12 py-5 bg-purple-brand text-white font-poppins font-black text-xl rounded-full shadow-[0_15px_30px_-5px_rgba(126,48,225,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(126,48,225,0.6)] transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
              >
                Hemen Başla
                <Rocket size={24} />
              </Link>
              <Link
                to="/login"
                className="px-12 py-5 bg-transparent border-4 border-purple-brand text-purple-brand font-poppins font-black text-xl rounded-full hover:bg-purple-brand hover:text-white transform hover:-translate-y-1 transition-all duration-300 text-center"
              >
                Giriş Yap
              </Link>
            </motion.div>

            <div className="flex items-center gap-12 pt-10">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-black font-poppins text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ÖZELleştirilmiş DERS SECTİON - DersimVar.com */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-300 rounded-full opacity-30 blur-2xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-teal-300 rounded-full opacity-30 blur-2xl" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-100 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row items-center">
              {/* Left - Logo and branding */}
              <div className="lg:w-1/3 p-12 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <motion.img
                  src="/images/logoDv.webp"
                  alt="DersimVar.com"
                  className="w-48 lg:w-64 drop-shadow-2xl"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </div>

              {/* Right - Content */}
              <div className="lg:w-2/3 p-10 lg:p-16 space-y-6 text-center lg:text-left">
                <div className="space-y-3">
                  <span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-sm font-bold rounded-full uppercase tracking-wider">
                    Özel Ders
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-poppins font-black text-gray-900 dark:text-white">
                    Birebir Öğretmenle <span className="text-emerald-500">Öğren</span>
                  </h3>
                </div>

                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium max-w-xl">
                  Online veya yüz yüze özel ders almak, konularını daha detaylı öğrenmek istiyorsan <strong className="text-emerald-600">DersimVar.com</strong> tam sana göre! Alanında uzman öğretmenlerle tanış.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                  <a
                    href="https://dersimvar.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-poppins font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 inline-flex items-center justify-center gap-3"
                  >
                    Öğretmen Bul
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div className="pt-4 flex items-center gap-6 text-sm text-gray-500 justify-center lg:justify-start">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span>Online Dersler</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                    <span>Uzman Öğretmenler</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ATÖLYELER SECTION */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-5xl lg:text-6xl font-poppins font-black text-gray-900 dark:text-white">
              Eğlenceli <span className="text-purple-brand">Atölyeler</span>
            </h2>
            <div className="w-24 h-2 bg-purple-brand mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {workshops.map((workshop, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -15 }}
                className="group bg-white dark:bg-gray-800 rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full border-4 border-transparent hover:border-purple-brand/20"
              >
                <div className={`h-64 relative ${workshop.color} p-8 flex items-center justify-center`}>
                  <img
                    src={workshop.image}
                    alt={workshop.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                <div className="p-10 flex flex-col flex-grow items-center text-center space-y-6">
                  <h3 className="text-3xl font-poppins font-black text-gray-900 dark:text-white">
                    {workshop.title}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                    {workshop.description}
                  </p>

                  <div className="mt-auto pt-6">
                    <Link
                      to={workshop.link}
                      className="px-8 py-3 bg-purple-brand text-white font-black rounded-full hover:bg-gray-900 transition-colors inline-block"
                    >
                      Hemen Keşfet
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DİJİTAL KAYNAKLAR - Google Play Books */}
      <section className="py-24 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-orange-300 rounded-full opacity-30 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-amber-300 rounded-full opacity-30 blur-3xl" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <span className="inline-block px-4 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 text-sm font-bold rounded-full uppercase tracking-wider">
              📚 E-Kitaplar
            </span>
            <h2 className="text-4xl lg:text-5xl font-poppins font-black text-gray-900 dark:text-white">
              Dijital <span className="text-orange-500">Kaynaklar</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Google Play'de yayınlanan eğitim kitaplarımızla her an her yerde öğrenmeye devam et!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bilsem Sınavı Kitabı */}
            <motion.a
              href="https://play.google.com/store/books/series?id=P8CnGwAAABCZ2M"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-purple-500/30 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🧠</span>
              </div>
              <h3 className="text-xl font-poppins font-black text-gray-900 dark:text-white mb-3">
                Bilsem Sınavı
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-4 text-sm">
                Bilim ve Sanat Merkezi sınavlarına kapsamlı hazırlık kaynağı
              </p>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold rounded-full text-sm group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                Google Play'de İncele
              </span>
            </motion.a>

            {/* Görsel Analoji Kitabı */}
            <motion.a
              href="https://play.google.com/store/books/series?id=l5yQHAAAABAGgM"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-blue-500/30 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-xl font-poppins font-black text-gray-900 dark:text-white mb-3">
                Görsel Analoji
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-4 text-sm">
                Görsel düşünme ve analoji kurma becerilerini geliştir
              </p>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-full text-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                Google Play'de İncele
              </span>
            </motion.a>

            {/* Türkçe Deyimler Kitabı */}
            <motion.a
              href="https://play.google.com/store/books/series?id=XIDDGwAAABCemM"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-amber-500/30 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <span className="text-4xl">📖</span>
              </div>
              <h3 className="text-xl font-poppins font-black text-gray-900 dark:text-white mb-3">
                Türkçe Deyimler
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-4 text-sm">
                Türkçe deyimleri eğlenceli bir şekilde öğren ve pekiştir
              </p>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold rounded-full text-sm group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                Google Play'de İncele
              </span>
            </motion.a>
          </div>
        </div>
      </section>

      {/* WHY US / VALUES */}
      <section className="py-20 bg-purple-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-400 rounded-full translate-x-1/2 translate-y-1/2 blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-poppins font-black mb-16">Neden Bilsemc2?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { label: "Kişiselleştirilmiş Öğrenme", icon: <Star /> },
              { label: "Eğlenceli Aktiviteler", icon: <Rocket /> },
              { label: "Uzman Rehberliği", icon: <Users /> },
              { label: "Bilimsel Metotlar", icon: <Lightbulb /> }
            ].map((item, i) => (
              <div key={i} className="space-y-4 flex flex-col items-center">
                <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-3xl border border-white/30 backdrop-blur-md">
                  {item.icon}
                </div>
                <span className="font-bold text-xl">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;