import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => (
  <div className="font-open-sans text-gray-800 dark:text-gray-100 min-h-screen">
    {/* HERO SECTION */}
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF3B0] via-[#FFEB9C] to-[#FFE066] dark:from-gray-800 dark:via-gray-700 dark:to-gray-600">
      <div className="container mx-auto px-6 py-20 lg:py-32">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between">
          <div className="lg:w-1/2 text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-poppins font-bold leading-tight">
                <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  Bilsemc2'ye
                </span>
                <br />
                <span className="text-gray-800 dark:text-white">Hoş Geldin!</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-md mx-auto lg:mx-0">
                Yaratıcılığını keşfet, öğren ve eğlenirken büyü! 🚀
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                to="/atolyeler" 
                className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-poppins font-semibold rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center justify-center gap-2">
                  Hemen Başla
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </Link>
              <Link 
                to="/login" 
                className="px-8 py-4 border-2 border-orange-500 text-orange-500 font-poppins font-semibold rounded-xl hover:bg-orange-500 hover:text-white transition-all duration-300 backdrop-blur-sm"
              >
                Giriş Yap
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">1000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Aktif Öğrenci</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-500">50+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Eğlenceli Aktivite</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">⭐ 4.9</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Kullanıcı Puanı</div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 mb-12 lg:mb-0 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <img 
                src="images/maskot.webp" 
                alt="Bilsemc2 Maskotu" 
                className="relative w-80 h-auto hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ATÖLYELER SECTION */}
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-poppins font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Atölyelerimiz
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Her yaş grubuna uygun, eğlenceli ve öğretici atölyeler ile yeteneklerini geliştir!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Genel Yetenek Kartı */}
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <img 
                  src="images/gy.webp" 
                  alt="Genel Yetenek" 
                  className="relative w-48 h-48 mx-auto rounded-xl object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-poppins font-bold text-gray-800 dark:text-white">
                  Bilsem Genel Yetenek
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Mantık, analiz ve problem çözme becerilerini geliştir
                </p>
              </div>
              <a 
                href="https://yetenekvezeka.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-poppins font-semibold rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Atölyeye Git
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </a>
            </div>
          </div>

          {/* Resim Kartı */}
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-red-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <img 
                  src="images/resim.webp" 
                  alt="Resim" 
                  className="relative w-48 h-48 mx-auto rounded-xl object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-poppins font-bold text-gray-800 dark:text-white">
                  Bilsem Resim
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Sanatsal yaratıcılığını keşfet ve görsel zekânı geliştir
                </p>
              </div>
              <a 
                href="https://bilsemresim.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-poppins font-semibold rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Atölyeye Git
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </a>
            </div>
          </div>

          {/* Müzik Kartı */}
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <img 
                  src="images/music.webp" 
                  alt="Müzik" 
                  className="relative w-48 h-48 mx-auto rounded-xl object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-poppins font-bold text-gray-800 dark:text-white">
                  Bilsem Müzik
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Müzikal yeteneklerini keşfet ve ritim duygunu geliştir
                </p>
              </div>
              <Link 
                to="#" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-poppins font-semibold rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Yakında Gelecek
                <span className="text-lg">🎵</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* HAKKIMIZDA SECTION */}
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-poppins font-bold">
                <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  Hakkımızda
                </span>
              </h2>
              <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed">
                Bilsemc2, çocukların yaratıcılığını ve zekâ gelişimini desteklemek amacıyla tasarlanmış 
                <span className="font-semibold text-orange-500"> yenilikçi bir eğitim platformudur.</span>
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white">Kişiselleştirilmiş Öğrenme</h4>
                  <p className="text-gray-600 dark:text-gray-400">Her çocuğun öğrenme hızına uygun içerikler</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white">Eğlenceli Aktiviteler</h4>
                  <p className="text-gray-600 dark:text-gray-400">Oyunlaştırılmış eğitim deneyimi</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white">Uzman Rehberliği</h4>
                  <p className="text-gray-600 dark:text-gray-400">Alanında uzman eğitmenlerden destek</p>
                </div>
              </div>
            </div>

            <Link 
              to="/services" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-poppins font-semibold rounded-xl hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Daha Fazla Keşfet
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>
          
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full blur-3xl opacity-20"></div>
              <img 
                src="images/kurucu.webp" 
                alt="Bilsemc2 Kurucusu" 
                className="relative w-80 h-80 rounded-full object-cover shadow-2xl border-4 border-white dark:border-gray-700 hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default HomePage;