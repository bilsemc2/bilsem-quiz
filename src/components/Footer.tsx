import { Link } from 'react-router-dom';
import { TwitterOutlined, InstagramOutlined, YoutubeOutlined } from '@ant-design/icons';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Hakkımızda */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">BilsemC2</h3>
                        <p className="text-sm">
                            BilsemC2, öğrencilerin Bilsem sınavlarına hazırlanmasına yardımcı olan yenilikçi bir eğitim platformudur.
                        </p>
                    </div>

                    {/* Hızlı Linkler */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">Hızlı Linkler</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/blog" className="text-sm hover:text-white transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link to="/services" className="text-sm hover:text-white transition-colors">
                                    Hizmetler
                                </Link>
                            </li>
                            <li>
                                <Link to="/how-it-works" className="text-sm hover:text-white transition-colors">
                                    Nasıl Çalışır?
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-sm hover:text-white transition-colors">
                                    SSS
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* İletişim */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">İletişim</h3>
                        <ul className="space-y-2 text-sm">
                            <li>Email: bilgi@bilsemc2.com</li>
                            <li>Whatsapp Mesaj: +90 (541) 615 0721</li>
                            <li>Adres: Pamukkale, Denizli, Türkiye</li>
                        </ul>
                    </div>

                    {/* Sosyal Medya */}
                    <div>
                        <h3 className="text-white text-lg font-semibold mb-4">Bizi Takip Edin</h3>
                        <div className="flex space-x-4">
                            <a href="https://x.com/BilsemSinavi" className="text-gray-400 hover:text-white transition-colors">
                                <TwitterOutlined className="text-2xl" />
                            </a>
                            <a href="https://www.instagram.com/bilsemc2/" className="text-gray-400 hover:text-white transition-colors">
                                <InstagramOutlined className="text-2xl" />
                            </a>
                            <a href="https://www.youtube.com/@yetenekvezeka" className="text-gray-400 hover:text-white transition-colors">
                                <YoutubeOutlined className="text-2xl" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-gray-800 pt-8">
                    <p className="text-center text-sm">
                        © {new Date().getFullYear()} BilsemC2. Tüm hakları saklıdır.
                    </p>
                </div>
            </div>
        </footer>
    );
}
