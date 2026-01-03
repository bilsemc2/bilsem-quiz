import { Link } from 'react-router-dom';
import { TwitterOutlined, InstagramOutlined, YoutubeOutlined } from '@ant-design/icons';

export default function Footer() {
    return (
        <footer className="bg-purple-brand text-white/90">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                <div className="mb-10">
                    <img src="/images/beyninikullan.webp" alt="Bilsemc2 Logo" className="h-24 w-auto drop-shadow-lg" />
                </div>

                <nav className="flex flex-wrap justify-center gap-x-12 gap-y-4 mb-10 font-bold">
                    <Link to="/about" className="hover:text-white transition-colors">Hakkımızda</Link>
                    <Link to="/services" className="hover:text-white transition-colors">Hizmetler</Link>
                    <Link to="/contact" className="hover:text-white transition-colors">İletişim</Link>
                    <Link to="/faq" className="hover:text-white transition-colors">SSS</Link>
                    <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
                </nav>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full pt-10 border-t border-white/10">
                    {/* İletişim */}
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold mb-4">İletişim</h3>
                        <ul className="space-y-2 opacity-80">

                            <li>Whatsapp: +90 (541) 615 0721</li>
                            <li>Adres: Pamukkale, Denizli, Türkiye</li>
                        </ul>
                    </div>

                    {/* Sosyal Medya */}
                    <div className="text-center md:text-right">
                        <h3 className="text-xl font-bold mb-4">Bizi Takip Edin</h3>
                        <div className="flex justify-center md:justify-end space-x-6">
                            <a href="https://x.com/BilsemSinavi" className="hover:text-white transition-colors" aria-label="Twitter">
                                <TwitterOutlined className="text-3xl" aria-hidden="true" />
                            </a>
                            <a href="https://www.instagram.com/bilsemc2/" className="hover:text-white transition-colors" aria-label="Instagram">
                                <InstagramOutlined className="text-3xl" aria-hidden="true" />
                            </a>
                            <a href="https://www.youtube.com/@bilsemce" className="hover:text-white transition-colors" aria-label="Youtube">
                                <YoutubeOutlined className="text-3xl" aria-hidden="true" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center opacity-60 text-sm">
                    <p>© {new Date().getFullYear()} BilsemC2. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </footer>
    );
}
