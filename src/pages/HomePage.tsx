import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => (
  <div className="font-open-sans text-gray-800 dark:text-gray-100">
    {/* HERO */}
    <section className="flex flex-col-reverse md:flex-row items-center px-8 py-16 bg-[#FFF3B0] dark:bg-gray-800">
      <div className="md:w-1/2 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4">Bilsemc2’ye Hoş Geldin!</h1>
        <p className="text-lg mb-6">Yaratıcılığını Keşfet, Öğren, Eğlen.</p>
        <div className="space-x-4">
          <Link to="/atolyeler" className="px-6 py-3 bg-[#FFA726] text-white font-poppins font-semibold rounded-lg hover:bg-orange-500 transition">Başla →</Link>
          <Link to="/login" className="px-6 py-3 border-2 border-[#FFA726] text-[#FFA726] font-poppins font-semibold rounded-lg hover:bg-[#FFA726] hover:text-white transition">Giriş Yap</Link>
        </div>
      </div>
      <div className="md:w-1/2 mb-8 md:mb-0 flex justify-center">
        <img src="images/maskot.webp" alt="Maskot" className="w-64 h-auto"/>
      </div>
    </section>

    {/* ATÖLYELER KARTLARI */}
    <section className="px-8 py-16 bg-white dark:bg-gray-900">
      <h2 className="text-3xl font-poppins font-bold text-center mb-12">Atölyeler</h2>
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-lg text-center">
          <img src="images/gy.webp" alt="Genel Yetenek" className="w-64 h-64 mx-auto mb-6" />
          <h3 className="text-xl font-poppins font-semibold mb-4">Bilsem Genel Yetenek</h3>
          <a href="#" className="inline-block mt-auto px-4 py-2 bg-[#FFA726] text-white font-poppins rounded-md hover:bg-orange-500 transition" target="_blank" rel="noopener noreferrer">Atölyeye Git</a>
        </div>
        <div className="p-6 rounded-lg text-center">
          <img src="images/resim.webp" alt="Resim" className="w-64 h-64 mx-auto mb-6" />
          <h3 className="text-xl font-poppins font-semibold mb-4">Bilsem Resim</h3>
          <a href="https://bilsemresim.com/" className="inline-block mt-auto px-4 py-2 bg-[#FFA726] text-white font-poppins rounded-md hover:bg-orange-500 transition" target="_blank" rel="noopener noreferrer">Atölyeye Git</a>
        </div>
        <div className="p-6 rounded-lg text-center">
          <img src="images/music.webp" alt="Müzik" className="w-64 h-64 mx-auto mb-6" />
          <h3 className="text-xl font-poppins font-semibold mb-4">Bilsem Müzik</h3>
          <Link to="#" className="inline-block px-4 py-2 bg-[#FFA726] text-white font-poppins rounded-md hover:bg-orange-500 transition">Atölyeye Git</Link>
        </div>
      </div>
    </section>

    {/* HAKKIMIZDA */}
    <section className="px-8 py-16 bg-white flex flex-col md:flex-row items-center dark:bg-gray-900">
      <div className="md:w-1/2 mb-8 md:mb-0">
        <h2 className="text-3xl font-poppins font-bold mb-4">Hakkımızda</h2>
        <p className="font-open-sans text-lg mb-6">Bilsemc2, çocukların yaratıcılığını ve zekâ gelişimini desteklemek amacıyla tasarlanmış eğlenceli bir platformdur.</p>
        <Link to="/services" className="px-5 py-2 bg-[#FFA726] text-white font-poppins rounded-md hover:bg-orange-500 transition">Daha Fazla Oku</Link>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <img src="images/kurucu.webp" alt="Kurucu" className="w-48 h-auto rounded-full shadow-lg"/>
      </div>
    </section>
  </div>
);

export default HomePage;