import { Link } from 'react-router-dom';
import PricingCard from '../components/PricingCard';

export default function TeacherPricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Öğretmen ve VIP Üyelik Planları</h1>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Eğitimciler için özel hazırlanmış planlarımız ile öğrencilerinizin başarısını artırın. 
                            Ücretsiz başlayın, öğrenci sayınız arttıkça kazanın.
                        </p>
                    </div>
                    
                    {/* Ana Planlar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                        <PricingCard
                            title="Öğretmen Üyelik"
                            price="Ücretsiz"
                            description="Öğretmenler için özel üyelik planı. Öğrencilerinizle birlikte kullanmak için ideal."
                            features={[
                                'Sınırsız sınıf oluşturma',
                                'Ödev oluşturma ve takip',
                                'Canlı Ders oluşturma',
                                '2 öğrenci kadar ücretsiz',
                                'Öğretmenimize 5000 xp hediye',
                                '2 öğrencisine ayrı ayrı 2000 xp hediye',
                                'Ekstra öğrenciler için öğrenci başına ücret',
                                'Öğrenci sayısına göre artan soru görüntüleme limiti',
                                'Öğrenci performans raporları',
                                'Öğretmen danışma hattı'
                            ]}
                            buttonText="Öğretmen Kaydı Yap"
                            onClick={() => window.location.href = '/contact'}
                        />
                        
                        <PricingCard
                            title="VIP Üyelik"
                            price="₺7500/Ay"
                            description="VIP üyelere özel ayrıcalıklar ve sınırsız erişim. En yüksek seviye eğitim deneyimi."
                            features={[
                                '10 öğrenci kadar ücretsiz',
                                'Sınırsız soru seçim hakkı',
                                'Tüm sorulara erişim',
                                'Tüm sayfalara erişim',
                                'Özel VIP grubu',
                                '7/24 öncelikli destek',
                                'Özel eğitim ve danışmanlık',
                                'Kişiselleştirilmiş danışmanlık',
                                'Öğrenci başarı grafikleri',
                            ]}
                            isPopular
                            buttonText="VIP Üye Ol"
                            onClick={() => window.location.href = '/contact'}
                        />
                    </div>
                    
                    {/* Öğrenci Ekleme Ücretlendirme Tablosu */}
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto mb-16">
                        <h2 className="text-2xl font-bold text-center mb-6">Öğrenci Ekleme Ücretlendirmesi</h2>
                        <p className="text-gray-600 text-center mb-8">
                            Öğretmen üyeliğinize eklediğiniz her öğrenci için ekstra ücretlendirme tablosu.
                            Daha fazla öğrenci ekledikçe, öğrenci başına maliyet düşer!
                        </p>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-blue-50">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Öğrenci Aralığı</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Öğrenci Başına Ücret</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Görüntülenebilen Soru</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ek Avantajlar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-3 text-sm text-gray-800">1-2 Öğrenci</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">Ücretsiz</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">100 soru</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">-</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-sm text-gray-800">3-5 Öğrenci</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">₺1500/öğrenci</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">350 soru</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">İstatistik raporları</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-sm text-gray-800">6-10 Öğrenci</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">₺1250/öğrenci</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">600 soru</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">Performans analizi</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-sm text-gray-800">11-20 Öğrenci</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">₺1000/öğrenci</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">1100 soru</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">Canlı destek</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-sm text-gray-800">21+ Öğrenci</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">₺1000/öğrenci</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">Soru Havuzu</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">VIP danışmanlık</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-4">
                            * Görüntülenebilen soru sayısı = 100 + (öğrenci sayısı * 50)
                        </p>
                    </div>
                    
                    {/* Avantajlar */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 max-w-4xl mx-auto mb-16 text-white">
                        <h2 className="text-2xl font-bold text-center mb-6">Öğretmen Üyeliğinin Avantajları</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white bg-opacity-10 rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-3">Sınırsız İçerik Erişimi</h3>
                                <p>Öğrencilerinizin ihtiyaçlarına göre özelleştirilmiş içerikler oluşturun. Öğrenci sayınız arttıkça daha fazla soruya erişim kazanın.</p>
                            </div>
                            
                            <div className="bg-white bg-opacity-10 rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-3">Gelişmiş Analitik</h3>
                                <p>Öğrencilerinizin performansını detaylı olarak takip edin, güçlü ve zayıf yanlarını belirleyin, kişiselleştirilmiş çözümler sunun.</p>
                            </div>
                            
                            <div className="bg-white bg-opacity-10 rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-3">Artan Gelir Modeli</h3>
                                <p>Öğrenci sayınızı artırdıkça, platformumuzdan gelir elde etmeye başlayın. Her yeni öğrenci sizin ve platformumuzun büyümesine katkı sağlar.</p>
                            </div>
                            
                            <div className="bg-white bg-opacity-10 rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-3">Zaman Tasarrufu</h3>
                                <p>Otomatik değerlendirme ve raporlama sistemleri ile zaman kazanın, öğrencilerinize daha fazla odaklanın.</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-16">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            Daha fazla bilgi almak ister misiniz?
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                            Üyelik planları hakkında detaylı bilgi için bizimle iletişime geçin.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link 
                                to="/contact"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                            >
                                İletişime Geçin
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </Link>
                            <Link 
                                to="/pricing"
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-indigo-700 bg-white border-2 border-indigo-500 rounded-xl shadow-lg hover:bg-indigo-50 transition-all duration-200"
                            >
                                Öğrenci Planlarına Bak
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
