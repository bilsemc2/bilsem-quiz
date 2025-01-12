import { Package, Puzzle, BoxIcon, FlipHorizontal2, Shapes, RotateCw, KeyRound, FileText, Brain } from 'lucide-react';

const ServicesPage = () => {
    const services = [
        {
            icon: <Package className="w-12 h-12 text-indigo-500" />,
            title: "BilsemC2 Sınavına Hazırlık",
            description: "Bilsem sınavlarına özel hazırlanmış, interaktif sorular ve alıştırmalarla öğrencilerin zihinsel becerilerini geliştirin."
        },
        {
            icon: <Puzzle className="w-12 h-12 text-purple-500" />,
            title: "Eksik Parça Bulmacaları",
            description: "Görsel-uzamsal zekayı geliştiren, eksik parçaları bulma ve tamamlama egzersizleri."
        },
        {
            icon: <BoxIcon className="w-12 h-12 text-blue-500" />,
            title: "Açık Küp Problemleri",
            description: "3 boyutlu düşünme ve uzamsal algı yeteneklerini geliştiren açık küp soruları."
        },
        {
            icon: <FlipHorizontal2 className="w-12 h-12 text-green-500" />,
            title: "Ayna Simetrisi Çalışmaları",
            description: "Simetri algısını güçlendiren ve görsel zekayı geliştiren interaktif alıştırmalar."
        },
        {
            icon: <Shapes className="w-12 h-12 text-yellow-500" />,
            title: "Şekil Oyunları",
            description: "Geometrik düşünme ve şekil-zemin ilişkisini kavrama becerilerini geliştiren oyunlar."
        },
        {
            icon: <RotateCw className="w-12 h-12 text-red-500" />,
            title: "Döndürme Alıştırmaları",
            description: "Nesnelerin farklı açılardan görünümlerini anlama ve zihinsel döndürme yeteneklerini geliştirme."
        },
        {
            icon: <KeyRound className="w-12 h-12 text-pink-500" />,
            title: "Görsel Şifreleme",
            description: "Mantıksal düşünme ve problem çözme becerilerini geliştiren şifreleme aktiviteleri."
        },
        {
            icon: <FileText className="w-12 h-12 text-orange-500" />,
            title: "PDF Oluşturma",
            description: "Kendi soru ve alıştırma setlerinizi oluşturup PDF formatında kaydedin."
        },
        {
            icon: <Brain className="w-12 h-12 text-teal-500" />,
            title: "Hafıza Oyunları",
            description: "Görsel hafıza ve dikkat becerilerini geliştiren eğlenceli oyunlar."
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">BilsemC2 ile</span>
                    <span className="block text-indigo-600">Zihinsel Gelişim Yolculuğu</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Bilsem sınavlarına hazırlık sürecinde ihtiyacınız olan tüm araçlar ve alıştırmalar tek bir platformda.
                </p>
            </div>

            {/* Services Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="relative group bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                            <div className="relative">
                                <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-indigo-50 group-hover:bg-indigo-100 transition-colors duration-300">
                                    {service.icon}
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-lg font-medium text-gray-900 text-center group-hover:text-indigo-600 transition-colors duration-300">
                                        {service.title}
                                    </h3>
                                    <p className="mt-5 text-base text-gray-500 text-center">
                                        {service.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Call to Action */}
            <div className="mt-20 text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Hemen Başlayın
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                    Ücretsiz hesap oluşturarak tüm özelliklere erişim sağlayın.
                </p>
                <div className="mt-8 flex justify-center">
                    <div className="inline-flex rounded-md shadow">
                        <a
                            href="/signup"
                            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Ücretsiz Başla
                        </a>
                    </div>
                    <div className="ml-3 inline-flex">
                        <a
                            href="/login"
                            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                        >
                            Giriş Yap
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
