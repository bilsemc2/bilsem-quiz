import { Link } from 'react-router-dom';
import {
    UserPlus,
    Target,
    Brain,
    Award,
    Users,
    Trophy,
    BookOpen,
    Clock
} from 'lucide-react';

const HowItWorksPage = () => {
    const steps = [
        {
            icon: <UserPlus className="w-12 h-12 text-indigo-500" aria-hidden="true" />,
            title: "1. Üye Olun",
            description: "Ücretsiz hesap oluşturarak BilsemC2'nin tüm özelliklerine erişim sağlayın."
        },
        {
            icon: <Target className="w-12 h-12 text-purple-500" aria-hidden="true" />,
            title: "2. Seviyenizi Belirleyin",
            description: "Kısa bir değerlendirme testi ile mevcut seviyenizi belirleyin."
        },
        {
            icon: <Brain className="w-12 h-12 text-blue-500" aria-hidden="true" />,
            title: "3. Alıştırmalara Başlayın",
            description: "Size özel hazırlanmış alıştırmalar ile zihinsel becerilerinizi geliştirin."
        },
        {
            icon: <Award className="w-12 h-12 text-green-500" aria-hidden="true" />,
            title: "4. İlerlemenizi Takip Edin",
            description: "Detaylı istatistikler ile gelişiminizi adım adım izleyin."
        }
    ];

    const features = [
        {
            icon: <Users className="w-8 h-8 text-indigo-500" aria-hidden="true" />,
            title: "Arkadaşlarınızla Yarışın",
            description: "Düello modunda arkadaşlarınızla yarışarak öğrenmeyi daha eğlenceli hale getirin."
        },
        {
            icon: <Trophy className="w-8 h-8 text-yellow-500" aria-hidden="true" />,
            title: "Başarıları Toplayın",
            description: "Hedeflerinize ulaştıkça rozetler ve ödüller kazanın."
        },
        {
            icon: <BookOpen className="w-8 h-8 text-purple-500" aria-hidden="true" />,
            title: "Özel İçerikler",
            description: "Bilsem sınavlarına özel hazırlanmış sorular ve alıştırmalarla pratik yapın."
        },
        {
            icon: <Clock className="w-8 h-8 text-blue-500" aria-hidden="true" />,
            title: "Esnek Çalışma",
            description: "İstediğiniz zaman, istediğiniz yerden çalışın."
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">BilsemC2'de</span>
                    <span className="block text-indigo-600">Başarıya Giden Yol</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Bilsem sınavlarına hazırlık sürecinde size rehberlik ediyoruz. İşte adım adım nasıl ilerleyeceğiniz:
                </p>
            </div>

            {/* Steps Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="relative group bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                            <div className="relative">
                                <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-indigo-50 group-hover:bg-indigo-100 transition-colors duration-300">
                                    {step.icon}
                                </div>
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-gray-900 text-center group-hover:text-indigo-600 transition-colors duration-300">
                                        {step.title}
                                    </h3>
                                    <p className="mt-4 text-base text-gray-500 text-center">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Neden BilsemC2?
                        </h2>
                        <p className="mt-4 text-lg text-gray-500">
                            Size en iyi öğrenme deneyimini sunmak için tasarlandı
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-indigo-50 mb-4" aria-hidden="true">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-base text-gray-500">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                    <div className="bg-indigo-600 rounded-lg shadow-xl overflow-hidden">
                        <div className="px-6 py-12 sm:px-12 lg:py-16 lg:px-16 flex flex-col lg:flex-row items-center justify-between">
                            <div className="text-center lg:text-left">
                                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                                    <span className="block">Hazır mısınız?</span>
                                    <span className="block text-indigo-200">Hemen başlayın!</span>
                                </h2>
                                <p className="mt-4 text-lg leading-6 text-indigo-100">
                                    Ücretsiz hesap oluşturarak BilsemC2'nin tüm özelliklerine erişin.
                                </p>
                            </div>
                            <div className="mt-8 lg:mt-0 lg:ml-8 flex flex-col sm:flex-row">
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors duration-300"
                                >
                                    Ücretsiz Başla
                                </Link>
                                <Link
                                    to="/login"
                                    className="mt-3 sm:mt-0 sm:ml-3 inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition-colors duration-300"
                                >
                                    Giriş Yap
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorksPage;
