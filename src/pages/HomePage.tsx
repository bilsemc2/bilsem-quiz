import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket, Star, Users, Palette, Music, Lightbulb, Brain,
  Sparkles, Target, TrendingUp, Zap, MessageSquare,
  Gamepad2, Award, BookOpen, ArrowRight, Play
} from 'lucide-react';
import { KidButton, KidCard, KidBadge } from '../components/kid-ui';
import { loadStudentCountLabel } from '@/features/content/model/homeUseCases';

// ═══════════════════════════════════════════════
// Floating decoration component
// ═══════════════════════════════════════════════
const FloatingShape: React.FC<{
  className?: string;
  delay?: number;
  duration?: number;
}> = ({ className = '', delay = 0, duration = 4 }) => (
  <motion.div
    animate={{
      y: [0, -15, 0],
      rotate: [0, 5, -5, 0],
    }}
    transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    className={`absolute pointer-events-none ${className}`}
  />
);

// ═══════════════════════════════════════════════
// Section wrapper
// ═══════════════════════════════════════════════
const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = '', id }) => (
  <section id={id} className={`py-20 lg:py-28 relative overflow-hidden ${className}`}>
    <div className="container mx-auto px-5 lg:px-8 relative z-10">
      {children}
    </div>
  </section>
);

const SectionTitle: React.FC<{
  children: React.ReactNode;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
}> = ({ children, subtitle, badge, badgeColor }) => (
  <div className="text-center mb-14 lg:mb-20 space-y-4">
    {badge && (
      <KidBadge variant="custom" className={`${badgeColor || 'bg-cyber-yellow'} mb-2`}>
        {badge}
      </KidBadge>
    )}
    <h2 className="text-4xl lg:text-6xl font-nunito font-extrabold text-black dark:text-white leading-tight">
      {children}
    </h2>
    {subtitle && (
      <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-nunito font-semibold">
        {subtitle}
      </p>
    )}
    <div className="flex items-center justify-center gap-2 pt-2">
      <div className="w-3 h-3 bg-cyber-pink rounded-full border-2 border-black/10" />
      <div className="w-12 h-1.5 bg-cyber-emerald rounded-full border border-black/10" />
      <div className="w-3 h-3 bg-cyber-yellow rounded-full border-2 border-black/10" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

const HomePage: React.FC = () => {
  const [studentCount, setStudentCount] = useState('1000+');

  useEffect(() => {
    let isActive = true;

    loadStudentCountLabel().then((countLabel) => {
      if (isActive) {
        setStudentCount(countLabel);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const workshops = [
    {
      title: 'Genel Yetenek',
      description: 'Mantık, analiz ve problem çözme becerilerini geliştir!',
      image: 'images/gy.webp',
      link: '/atolyeler/genel-yetenek',
      color: 'purple',
      icon: Lightbulb,
      bg: 'bg-cyber-purple',
    },
    {
      title: 'Resim',
      description: 'Sanatsal yaratıcılığını keşfet, görsel zekânı geliştir!',
      image: 'images/resim.webp',
      link: '/atolyeler/resim',
      color: 'pink',
      icon: Palette,
      bg: 'bg-cyber-pink',
    },
    {
      title: 'Müzik',
      description: 'Ritim ve kulak becerilerini müzikle geliştir!',
      image: 'images/music.webp',
      link: '/atolyeler/muzik',
      color: 'blue',
      icon: Music,
      bg: 'bg-cyber-blue',
    },
  ];

  const containerAnim = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="font-nunito min-h-screen overflow-x-hidden bg-cyber-paper dark:bg-slate-900">

      {/* ═══════════════════════════════════════════ */}
      {/* 🚀 HERO SECTION                            */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center pt-20 pb-12 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#dcf12620_2px,transparent_2px)] [background-size:32px_32px] dark:bg-[radial-gradient(#dcf12610_2px,transparent_2px)]" />

        {/* Floating decorations */}
        <FloatingShape delay={0} className="top-24 left-[8%] w-12 h-12 bg-cyber-yellow border-2 border-black/10 rounded-2xl rotate-12" />
        <FloatingShape delay={0.5} className="top-40 right-[12%] w-8 h-8 bg-cyber-pink border-3 border-black/10 rounded-full" />
        <FloatingShape delay={1} className="bottom-32 left-[15%] w-10 h-10 bg-cyber-emerald border-2 border-black/10 rounded-xl rotate-45" />
        <FloatingShape delay={1.5} className="top-[60%] right-[8%] w-6 h-6 bg-cyber-purple border-3 border-black/10 rounded-lg" />

        <div className="container mx-auto px-5 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left max-w-2xl"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-6"
              >
                <KidBadge variant="tuzo">
                  <Sparkles size={14} className="mr-1" />
                  TÜZÖ Uyumlu
                </KidBadge>
              </motion.div>

              <div className="flex items-end gap-3 lg:gap-5 justify-center lg:justify-start">
                <motion.img
                  src="images/beyni.webp"
                  alt="Beyni Maskot"
                  width={80}
                  height={100}
                  loading="eager"
                  initial={{ opacity: 0, y: 20, rotate: -10 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 120 }}
                  className="w-16 lg:w-20 flex-shrink-0 drop-shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
                />
                <h1 className="text-5xl lg:text-7xl font-nunito font-extrabold text-black dark:text-white leading-[1.05]">
                  Eğlenerek{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10">Zekanı</span>
                    <span className="absolute bottom-1 left-0 right-0 h-4 bg-cyber-yellow/60 -rotate-1 rounded" />
                  </span>{' '}
                  <span className="text-cyber-blue dark:text-cyber-emerald">Geliştir!</span>{' '}
                  <motion.span
                    animate={{ rotate: [0, 14, -8, 14, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="inline-block origin-bottom-right"
                  >
                    🚀
                  </motion.span>
                </h1>
              </div>

              <p className="mt-6 text-xl text-slate-600 dark:text-slate-300 font-nunito font-semibold max-w-xl mx-auto lg:mx-0">
                57+ zeka oyunu ve sınav simülasyonu ile BİLSEM hazırlığında en eğlenceli yol!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center lg:justify-start">
                <Link to="/beyin-antrenoru-merkezi">
                  <KidButton variant="primary" size="xl" icon={Play}>
                    Hemen Başla
                  </KidButton>
                </Link>
                <Link to="/login">
                  <KidButton variant="ghost" size="lg" icon={ArrowRight}>
                    Giriş Yap
                  </KidButton>
                </Link>
              </div>

              {/* AI Assistant */}
              <motion.a
                href="https://notebooklm.google.com/notebook/bb1c2a85-28f9-4e35-964b-d8bf2720554e"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-cyber-obsidian text-cyber-yellow border-3 border-black/10 rounded-2xl font-bold text-sm shadow-neo-md hover:-translate-y-1 hover:shadow-neo-lg transition-all cursor-pointer"
              >
                <MessageSquare size={18} className="animate-pulse" />
                AI Asistan ile Konuş
                <span className="px-2 py-0.5 bg-cyber-pink text-white text-[10px] font-extrabold rounded-lg rotate-3">YENİ</span>
              </motion.a>
            </motion.div>

            {/* Right mascot area */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.7, type: 'spring', stiffness: 100 }}
              className="relative"
            >
              <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                <img
                  src="images/logo2.webp"
                  alt="Beynini Kullan!"
                  width={400}
                  height={400}
                  loading="eager"
                  className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(126,48,225,0.3)]"
                />

                {/* Floating badges around logo */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute -top-4 -right-4"
                >
                  <KidBadge variant="xp">⭐ {studentCount} Öğrenci</KidBadge>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-2 -left-4"
                >
                  <KidBadge variant="level">🎮 57+ Oyun</KidBadge>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          >
            {[
              { value: studentCount, label: 'Aktif Öğrenci', icon: Users, color: 'emerald' },
              { value: '57+', label: 'Zeka Oyunu', icon: Gamepad2, color: 'gold' },
              { value: '4.9', label: 'Puan', icon: Star, color: 'pink' },
            ].map((stat) => (
              <KidCard key={stat.label} className="!p-4 text-center" animate={false}>
                <stat.icon size={24} className="mx-auto mb-2 text-cyber-blue dark:text-cyber-emerald" strokeWidth={2.5} />
                <div className="text-2xl lg:text-3xl font-nunito font-extrabold text-black dark:text-white">{stat.value}</div>
                <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</div>
              </KidCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 🧠 SINAV SİMÜLASYONU                       */}
      {/* ═══════════════════════════════════════════ */}
      <Section className="bg-cyber-obsidian dark:bg-[#0a0b0d] border-y-4 border-black/10">
        {/* Animated bg */}
        <div className="absolute inset-0 overflow-hidden opacity-15">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 left-[10%] text-white/20"
          >
            <Brain size={60} />
          </motion.div>
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute bottom-10 right-[15%] text-white/20"
          >
            <Target size={50} />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 right-[5%] text-yellow-300/20"
          >
            <Sparkles size={40} />
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-center lg:text-left space-y-6 lg:max-w-xl"
          >
            <KidBadge variant="difficulty" className="!bg-cyber-pink !text-white">
              <Zap size={14} className="mr-1" /> YENİ ÖZELLİK
            </KidBadge>

            <h2 className="text-4xl lg:text-6xl font-nunito font-extrabold text-white leading-tight">
              BİLSEM Sınav{' '}
              <span className="text-cyber-yellow drop-shadow-lg">Simülasyonu</span>
            </h2>

            <p className="text-lg text-slate-300 font-nunito font-semibold">
              25 farklı modülle gerçek sınav deneyimi yaşa!{' '}
              <strong className="text-cyber-yellow">BZP (Bilsemc2 Zeka Puanı)</strong> ile kendini değerlendir.
            </p>

            <Link to="/atolyeler/sinav-simulasyonu">
              <KidButton variant="success" size="lg" icon={Brain}>
                Simülasyona Başla
              </KidButton>
            </Link>
          </motion.div>

          {/* Right — BZP Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-sm"
          >
            <KidCard accentColor="gold" className="!bg-[#1a1c23] !border-cyber-yellow rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cyber-yellow border-2 border-black/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">Senin Potansiyelin</p>
                  <p className="text-white font-nunito font-extrabold text-xl">BZP Skoru</p>
                </div>
              </div>

              <div className="text-center py-6 border-y-4 border-dashed border-slate-700 my-4">
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="block text-7xl font-nunito font-extrabold text-white drop-shadow-lg"
                >
                  ???
                </motion.span>
                <p className="text-cyber-yellow text-sm font-bold mt-4 uppercase tracking-widest">
                  Simülasyonu tamamla ve öğren!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6 text-center">
                {[
                  { value: '25', label: 'Modül', color: 'text-white' },
                  { value: '6', label: 'Kategori', color: 'text-cyber-yellow' },
                  { value: '45m', label: 'Süre', color: 'text-cyber-pink' },
                ].map((s) => (
                  <div key={s.label} className="bg-cyber-obsidian p-2 border-2 border-slate-700 rounded-xl">
                    <p className={`text-2xl font-nunito font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </KidCard>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 🎨 ATÖLYELER                                */}
      {/* ═══════════════════════════════════════════ */}
      <Section className="bg-cyber-paper dark:bg-slate-900 border-b-4 border-black/10 dark:border-slate-700">
        <SectionTitle subtitle="TÜZÖ standartlarına uygun olarak hazırlanmış yetenek geliştirme atölyeleri">
          Eğlenceli <span className="text-cyber-blue">Atölyeler</span>
        </SectionTitle>

        <motion.div
          variants={containerAnim}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {workshops.map((w, i) => (
            <motion.div key={w.link} variants={itemAnim}>
              <KidCard
                className={`h-full group ${i === 1 ? 'md:-rotate-1' : i === 2 ? 'md:rotate-1' : ''} hover:!rotate-0 transition-transform`}
                onClick={() => { window.location.href = w.link; }}
              >
                {/* Number badge */}
                <div className="absolute top-4 right-4 w-10 h-10 bg-white border-2 border-black/10 rounded-xl flex items-center justify-center font-nunito font-extrabold text-lg shadow-neo-sm z-10">
                  0{i + 1}
                </div>

                {/* Image area */}
                <div className={`${w.bg} -mx-6 -mt-6 mb-5 p-8 flex items-center justify-center rounded-t-xl border-b-4 border-black/10 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_2px,transparent_2px)] [background-size:16px_16px]" />
                  <img
                    src={w.image}
                    alt={w.title}
                    width={250}
                    height={180}
                    loading="lazy"
                    className="w-full h-48 object-contain relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]"
                  />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <w.icon size={22} className="text-cyber-blue dark:text-cyber-emerald" strokeWidth={2.5} />
                  <h3 className="text-xl font-nunito font-extrabold text-black dark:text-white uppercase">{w.title}</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm mb-5">{w.description}</p>

                <Link to={w.link} className="block">
                  <KidButton variant="secondary" size="md" fullWidth iconRight={ArrowRight}>
                    Keşfet
                  </KidButton>
                </Link>
              </KidCard>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 📚 PARTNER PROMOTIONS (DersimVar + BeyniniKullan) */}
      {/* ═══════════════════════════════════════════ */}
      <Section className="bg-cyber-yellow dark:bg-[#1a1c23] border-b-4 border-black/10 dark:border-slate-700">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f172a 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* DersimVar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <KidCard accentColor="blue" className="h-full">
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="w-full bg-cyber-blue -mx-6 -mt-8 mb-2 p-6 border-b-4 border-black/10 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[size:20px_20px]" />
                  <motion.img
                    src="/images/logoDv.webp"
                    alt="DersimVar.com"
                    width={180}
                    height={180}
                    loading="lazy"
                    className="w-36 lg:w-44 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    whileHover={{ scale: 1.05 }}
                  />
                </div>
                <KidBadge variant="level">Özel Ders</KidBadge>
                <h3 className="text-2xl font-nunito font-extrabold text-black dark:text-white">
                  Birebir Öğretmenle Öğren
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  Online veya yüz yüze özel ders. Alanında uzman öğretmenlerle tanış!
                </p>
                <a href="https://dersimvar.com" target="_blank" rel="noopener noreferrer" className="w-full">
                  <KidButton variant="secondary" size="md" fullWidth iconRight={ArrowRight}>
                    Öğretmen Bul
                  </KidButton>
                </a>
              </div>
            </KidCard>
          </motion.div>

          {/* BeyniniKullan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <KidCard accentColor="pink" className="h-full">
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="w-full bg-cyber-pink -mx-6 -mt-8 mb-2 p-6 border-b-4 border-black/10 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]" />
                  <motion.img
                    src="/images/beyninikullan.webp"
                    alt="BeyniniKullan.com"
                    width={180}
                    height={180}
                    loading="lazy"
                    className="w-36 lg:w-44 relative z-10 bg-white p-3 border-2 border-black/10 rounded-2xl shadow-neo-md rotate-3"
                    whileHover={{ scale: 1.05, rotate: 0 }}
                  />
                </div>
                <KidBadge variant="tuzo">🧠 Yapay Zeka Destekli</KidBadge>
                <h3 className="text-2xl font-nunito font-extrabold text-black dark:text-white">
                  Çocuğunuza Özel Zeka Kitabı
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  Gemini AI ile benzersiz mantık bulmacaları üretin. Baskıya hazır PDF!
                </p>

                <div className="flex gap-3 justify-center">
                  {[
                    { value: '100', label: 'Kural' },
                    { value: '1.5M+', label: 'İskelet' },
                    { value: '3', label: 'Seviye' },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-100 dark:bg-slate-700 px-3 py-1.5 border-2 border-black/10 rounded-xl">
                      <span className="text-lg font-nunito font-extrabold text-black dark:text-white">{s.value}</span>
                      <span className="text-[9px] block uppercase font-bold text-slate-400 tracking-wider">{s.label}</span>
                    </div>
                  ))}
                </div>

                <a href="https://beyninikullan.com" target="_blank" rel="noopener noreferrer" className="w-full">
                  <KidButton variant="danger" size="md" fullWidth iconRight={ArrowRight}>
                    Hemen Dene
                  </KidButton>
                </a>
              </div>
            </KidCard>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 📖 E-KİTAPLAR                              */}
      {/* ═══════════════════════════════════════════ */}
      <Section className="bg-cyber-paper dark:bg-slate-800 border-b-4 border-black/10 dark:border-slate-700">
        <SectionTitle
          badge="📚 E-Kitaplar"
          badgeColor="bg-white"
          subtitle="Google Play'de yayınlanan eğitim kitaplarımızla her an her yerde öğren!"
        >
          Dijital <span className="text-cyber-pink">Kaynaklar</span>
        </SectionTitle>

        <motion.div
          variants={containerAnim}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {[
            { title: 'Bilsem Sınavı', image: '/images/bsm.webp', href: 'https://play.google.com/store/books/series?id=P8CnGwAAABCZ2M', color: 'pink' },
            { title: 'Görsel Analoji', image: '/images/ga.webp', href: 'https://play.google.com/store/books/series?id=l5yQHAAAABAGgM', color: 'blue' },
            { title: 'Türkçe Deyimler', image: '/images/td.webp', href: 'https://play.google.com/store/books/series?id=XIDDGwAAABCemM', color: 'gold' },
          ].map((book) => (
            <motion.a
              key={book.title}
              href={book.href}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemAnim}
              className="group"
            >
              <KidCard accentColor={book.color} className="h-full text-center hover:-translate-y-2 transition-transform">
                <div className="w-36 h-48 mx-auto overflow-hidden mb-5 border-2 border-black/10 rounded-xl shadow-neo-md">
                  <img
                    src={book.image}
                    alt={book.title}
                    width={144}
                    height={192}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-lg font-nunito font-extrabold text-black dark:text-white uppercase mb-2">{book.title}</h3>
                <KidBadge variant="status" className="!bg-cyber-blue !text-white group-hover:!bg-cyber-gold group-hover:!text-black transition-colors">
                  <BookOpen size={12} className="mr-1" /> Google Play'de İncele
                </KidBadge>
              </KidCard>
            </motion.a>
          ))}
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 💎 NEDEN BİLSEMC2                           */}
      {/* ═══════════════════════════════════════════ */}
      <Section className="bg-cyber-pink dark:bg-slate-900 border-b-4 border-black/10">
        <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#000_20px,#000_40px)]" />

        <h2 className="text-center text-4xl lg:text-6xl font-nunito font-extrabold mb-16 uppercase text-black dark:text-white drop-shadow-sm dark:drop-shadow-none">
          Neden Bilsemc2?
        </h2>

        <motion.div
          variants={containerAnim}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
        >
          {[
            { label: 'Kişiselleştirilmiş Öğrenme', icon: Star, color: 'emerald' },
            { label: 'Eğlenceli Aktiviteler', icon: Rocket, color: 'gold' },
            { label: 'Uzman Rehberliği', icon: Users, color: 'blue' },
            { label: 'Bilimsel Metotlar', icon: Award, color: 'purple' },
          ].map((item) => (
            <motion.div key={item.label} variants={itemAnim}>
              <KidCard accentColor={item.color} className="text-center h-full hover:-translate-y-2 transition-transform">
                <div className="w-16 h-16 mx-auto mb-4 bg-cyber-yellow border-2 border-black/10 rounded-2xl flex items-center justify-center shadow-neo-md -rotate-3">
                  <item.icon size={28} className="text-black" strokeWidth={2.5} />
                </div>
                <span className="font-nunito font-extrabold text-lg text-black dark:text-white uppercase leading-tight block">{item.label}</span>
              </KidCard>
            </motion.div>
          ))}
        </motion.div>
      </Section>
    </div>
  );
};

export default HomePage;
