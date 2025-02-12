import { Link } from 'react-router-dom';
import PricingCard from '../components/PricingCard';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Fiyatlandırma Planları</h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Size en uygun planı seçin ve BilsemC2 ile başarıya ulaşın
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        <PricingCard
                            title="Başlangıç"
                            price="Ücretsiz"
                            features={[
                                'Kayıt olduğunuzda 50 XP Hediye',
                                'Bilsemc2 deki etkinlikleri deneme fırsatı',
                                ' Genel Whatsapp grubu',
                                'Whatsapp grubunda XP kazanma fırsatı'
                            ]}
                            buttonText="Başla"
                            onClick={() => {}}
                        />
                        
                        <PricingCard
                            title="Temel"
                            price="₺1500"
                            description="Bilsemc2'ye ilk adımınızı atın ve temel özelliklere erişim kazanın. Başlangıç seviyesi için ideal plan."
                            features={[
                                'Tüm Başlangıç özellikleri',
                                '+5000 XP (Tüm etkinliklere katılım için)',
                                'XP kazanım fırsatları',
                                'Temel etkinliklere erişim',
                                'Puan tablosunda yer alma'
                            ]}
                            buttonText="Temel Plana Geç"
                            onClick={() => {}}
                        />
                        
                        <PricingCard
                            title="Standart Plan"
                            price="₺3000"
                            description="Daha fazla destek ve özel içeriklerle sınava hazırlanın. Özel Whatsapp grubu ve canlı denemelerle başarıya ulaşın."
                            features={[
                                'Tüm Temel özellikleri',
                                '+5000 XP',
                                ' Özel Whatsapp grubu',
                                'Canlı/cansız denemeler',
                                'Zor soruların çözümlü Videoları/Açıklamaları',
                                'Quizizz Özel İstatistik',
                                'Sınav gününüze kadar destek'
                            ]}
                            buttonText="Standart Plana Geç"
                            onClick={() => {}}
                        />

                        <PricingCard
                            title="Profesyonel Plan"
                            price="₺5000"
                            originalPrice="₺7000"
                            discountPercentage={40}
                            description="En kapsamlı hazırlık planı! Canlı dersler, günlük denemeler ve özel ödevlerle tam donanımlı bir hazırlık deneyimi."
                            features={[
                                'Tüm Standart özellikleri',
                                '+10000 XP',
                                'Sınıfa Atama',
                                'Ödevler',
                                'Hafta içi hergün 2 deneme',
                                'Haftada 2 gün Canlı Ders'
                            ]}
                            isPopular
                            buttonText="Profesyonel Plana Geç"
                            onClick={() => {}}
                        />

                    </div>

                    <div className="text-center mt-16">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            Aklınıza takılan sorular mı var?
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                            Size yardımcı olmaktan mutluluk duyarız!
                        </p>
                        <Link 
                            to="/contact"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                        >
                            İletişime Geçin
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
