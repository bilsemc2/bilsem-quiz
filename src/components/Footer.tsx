// Footer.tsx — Faz 3: Kid-UI Çocuk Dostu Tasarım
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, MapPin } from 'lucide-react';
import { XOutlined, InstagramOutlined, YoutubeOutlined } from '@ant-design/icons';

// ═══════════════════════════════════════════════
// 🦶 Footer — Kid-UI Style
// ═══════════════════════════════════════════════

const footerLinks = [
    { to: '/about', label: 'Hakkımızda' },
    { to: '/services', label: 'Hizmetler' },
    { to: '/bilsem-rehberi', label: 'BİLSEM Rehberi' },
    { to: '/contact', label: 'İletişim' },
    { to: '/faq', label: 'SSS' },
    { to: '/blog', label: 'Blog' },
];

const socialLinks = [
    { href: 'https://x.com/BilsemSinavi', icon: XOutlined, label: 'Twitter', hoverColor: 'hover:bg-black hover:text-white' },
    { href: 'https://www.instagram.com/bilsemc2/', icon: InstagramOutlined, label: 'Instagram', hoverColor: 'hover:bg-[#E1306C] hover:text-white hover:border-[#E1306C]' },
    { href: 'https://www.youtube.com/@ersanicoz', icon: YoutubeOutlined, label: 'Youtube', hoverColor: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]' },
];

export default function Footer() {
    return (
        <footer className="relative overflow-hidden transition-colors">
            {/* Dalga Kenarı SVG */}
            <div className="w-full -mb-1">
                <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-[60px]" preserveAspectRatio="none">
                    <path
                        d="M0 40C120 20 240 60 360 40C480 20 600 60 720 40C840 20 960 60 1080 40C1200 20 1320 60 1440 40V80H0V40Z"
                        className="fill-[#14F195] dark:fill-slate-950"
                    />
                </svg>
            </div>

            {/* Ana İçerik */}
            <div className="bg-[#14F195] dark:bg-slate-950 text-black dark:text-white border-t-0">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-5 bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:20px_20px]" />

                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
                    {/* Logo */}
                    <motion.div
                        whileHover={{ rotate: [-3, 3, -3, 0], scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10 bg-white dark:bg-slate-800 border-3 border-black/10 rounded-2xl p-4 shadow-neo-lg cursor-default"
                    >
                        <img src="/images/beyninikullan.webp" alt="Bilsemc2 Logo" width={96} height={96} loading="lazy" className="h-20 w-auto drop-shadow-md" />
                    </motion.div>

                    {/* Nav Linkleri — Pill Butonlar */}
                    <nav className="flex flex-wrap justify-center gap-3 mb-10">
                        {footerLinks.map((link, i) => (
                            <motion.div
                                key={link.to}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    to={link.to}
                                    className="block bg-white dark:bg-slate-800 text-black dark:text-white px-5 py-2.5 border-2 border-black/10 rounded-xl font-nunito font-extrabold uppercase text-xs tracking-widest shadow-neo-sm hover:shadow-neo-md hover:bg-cyber-gold hover:text-black transition-all"
                                >
                                    {link.label}
                                </Link>
                            </motion.div>
                        ))}
                    </nav>

                    {/* Divider */}
                    <div className="w-full max-w-4xl border-t-4 border-dashed border-black/15 dark:border-white/10 mb-10" />

                    {/* İletişim + Sosyal Medya Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                        {/* İletişim */}
                        <div className="bg-white dark:bg-slate-900 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md">
                            <div className="h-2 bg-cyber-pink" />
                            <div className="p-6">
                                <h3 className="text-lg font-nunito font-extrabold mb-5 uppercase tracking-wider text-black dark:text-white">İletişim</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-cyber-pink/10 border-2 border-cyber-pink/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-cyber-pink" />
                                        </div>
                                        <span className="font-nunito font-bold text-black/80 dark:text-white/80">+90 (541) 615 0721</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-cyber-blue/10 border-2 border-cyber-blue/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-cyber-blue" />
                                        </div>
                                        <span className="font-nunito font-bold text-black/80 dark:text-white/80">Pamukkale, Denizli, Türkiye</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Sosyal Medya */}
                        <div className="bg-white dark:bg-slate-900 border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md">
                            <div className="h-2 bg-cyber-blue" />
                            <div className="p-6">
                                <h3 className="text-lg font-nunito font-extrabold mb-5 uppercase tracking-wider text-black dark:text-white">Bizi Takip Edin</h3>
                                <div className="flex gap-3">
                                    {socialLinks.map(social => (
                                        <motion.a
                                            key={social.label}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.1, y: -3 }}
                                            whileTap={{ scale: 0.9 }}
                                            className={`w-14 h-14 bg-white dark:bg-slate-800 border-2 border-black/10 rounded-xl flex items-center justify-center shadow-neo-sm hover:shadow-neo-md transition-all text-black dark:text-white ${social.hoverColor}`}
                                            aria-label={social.label}
                                        >
                                            <social.icon className="text-2xl" aria-hidden="true" />
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Güvenli Ödeme */}
                    <div className="mt-10 w-full max-w-2xl">
                        <p className="text-xs font-nunito font-extrabold uppercase tracking-widest text-black/60 dark:text-white/60 mb-4 flex items-center gap-4 w-full">
                            <span className="h-0.5 bg-black/20 flex-grow rounded-full" />
                            Güvenli Ödeme Çözümleri
                            <span className="h-0.5 bg-black/20 flex-grow rounded-full" />
                        </p>
                        <div className="bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl px-8 py-5 shadow-neo-sm flex flex-wrap justify-center items-center gap-6">
                            <img src="https://www.paytr.com/oos-assets/logo/link-page/verified-visa.svg" alt="Verified by Visa" width={80} height={32} loading="lazy" className="h-7 w-auto transition-transform hover:scale-110" />
                            <img src="https://www.paytr.com/oos-assets/logo/link-page/mastercard.svg" alt="Mastercard SecureCode" width={60} height={32} loading="lazy" className="h-7 w-auto transition-transform hover:scale-110" />
                            <img src="https://www.paytr.com/oos-assets/logo/link-page/troy-gray.svg" alt="Troy" width={48} height={32} loading="lazy" className="h-7 w-auto transition-transform hover:scale-110 grayscale" />
                            <img src="https://www.paytr.com/oos-assets/logo/link-page/pci.svg" alt="PCI DSS Compliant" width={48} height={32} loading="lazy" className="h-7 w-auto transition-transform hover:scale-110" />
                            <img src="https://www.paytr.com/oos-assets/logo/paytr-logo-footer-light.svg" alt="PayTR" width={60} height={24} loading="lazy" className="h-5 w-auto transition-transform hover:scale-110 hidden dark:block" />
                            <img src="https://www.paytr.com/oos-assets/logo/paytr-logo-footer-dark.svg" alt="PayTR" width={60} height={24} loading="lazy" className="h-5 w-auto transition-transform hover:scale-110 block dark:hidden" />
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="mt-10 bg-white dark:bg-slate-900 border-2 border-black/10 px-6 py-2.5 rounded-xl shadow-neo-sm text-center">
                        <p className="text-xs font-nunito font-extrabold uppercase tracking-wider text-black/70 dark:text-white/70">
                            © {new Date().getFullYear()} BilsemC2. Tüm hakları <span className="text-cyber-pink">saklıdır</span>.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
