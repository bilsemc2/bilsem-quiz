import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const FAQPage = () => {
    const [openItem, setOpenItem] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('Genel');

    const faqItems: FAQItem[] = [
        {
            category: 'XP Sistemi',
            question: 'XP sistemi nasıl çalışır?',
            answer: 'BilsemC2\'de her etkinlik ve sayfa için belirli bir XP puanı gereklidir. Etkinliklere katıldıkça XP harcanır, bu yüzden başlangıçta yüksek XP ile başlamak önemlidir. Temel plan ile 5000 XP kazanır ve tüm temel özelliklere erişim sağlarsınız. XP\'niz bittiğinde yeni XP satın alabilir veya etkinliklerden XP kazanabilirsiniz.'
        },
        {
            category: 'XP Sistemi',
            question: 'Hangi sayfalarda ne kadar XP harcanır?',
            answer: 'Sayfaların XP maliyetleri şöyledir:\n\n- Quizeka: Her quizeka girişinde 10 XP\n- Düello: Her düello girişinde 10 XP\n- Hızlı Okuma: Her egzersiz için 0 XP\n- Hafıza Oyunu: Her Hafıza oyun girişinde 10 XP\n- Eksik Parça: Her sayfaya girişte 10 XP\n- Açık Küp: Her girişte 10 XP\n- Şekil Oyunu: Her giriş için 10 XP\n- Küp Sayma: Her giriş için 10 XP\n- Ayna Simetrisi: Her giriş için 10 XP\n- Döndürme: Her giriş için 10 XP\n\n'
        },
        {
            category: 'Genel',
            question: 'BilsemC2 nedir?',
            answer: 'BilsemC2, Bilim ve Sanat Merkezleri (BİLSEM) sınavlarına hazırlanan öğrenciler için özel olarak tasarlanmış bir online eğitim platformudur. Görsel-uzamsal zeka, mantıksal düşünme ve problem çözme becerilerini geliştirmeye yönelik interaktif alıştırmalar sunar.'
        },
        {
            category: 'Genel',
            question: 'BilsemC2 kimler için uygundur?',
            answer: 'BilsemC2, BİLSEM sınavlarına hazırlanan ilkokul öğrencileri için tasarlanmıştır. Ayrıca, çocuklarının zihinsel becerilerini geliştirmek isteyen veliler ve öğrencilerine farklı öğrenme yöntemleri sunmak isteyen öğretmenler de platformdan faydalanabilir.'
        },
        {
            category: 'Üyelik',
            question: 'BilsemC2\'ye nasıl üye olabilirim?',
            answer: 'Platformumuza üye olmak için ana sayfadaki "Ücretsiz Başla" butonuna tıklayarak kayıt formunu doldurabilirsiniz. Kayıt işlemi için geçerli bir e-posta adresi ve şifre belirlemeniz yeterlidir.'
        },
        {
            category: 'Üyelik',
            question: 'BilsemC2 ücretli mi?',
            answer: 'BilsemC2\'nin temel özellikleri ücretsizdir. Platform üzerindeki bazı özel içerik ve özellikler için premium üyelik gerekebilir. Premium üyelik hakkında detaylı bilgi için "Hizmetler" sayfamızı ziyaret edebilirsiniz.'
        },
        {
            category: 'İçerik',
            question: 'BilsemC2\'de hangi tür sorular bulunuyor?',
            answer: 'Platformumuzda şu kategorilerde sorular bulunmaktadır:\n- Görsel-uzamsal zeka soruları\n- Mantık ve muhakeme soruları\n- Şekil-zemin ilişkisi soruları\n- 3B düşünme ve döndürme soruları\n- Örüntü tamamlama soruları\n- Görsel hafıza geliştirme alıştırmaları'
        },
        {
            category: 'İçerik',
            question: 'Sorular gerçek BİLSEM sınavıyla uyumlu mu?',
            answer: 'Evet, platformumuzdaki tüm sorular ve alıştırmalar, BİLSEM sınavlarının formatına ve zorluk seviyesine uygun olarak hazırlanmıştır. Sürekli güncellenen soru havuzumuz, uzman eğitimciler tarafından oluşturulmakta ve denetlenmektedir.'
        },
        {
            category: 'Teknik',
            question: 'Hangi cihazlardan erişebilirim?',
            answer: 'BilsemC2\'ye bilgisayar, tablet ve akıllı telefonlar üzerinden erişebilirsiniz. Platform, tüm modern web tarayıcıları ile uyumlu çalışmaktadır.'
        },
        {
            category: 'Teknik',
            question: 'İnternet bağlantısı gerekli mi?',
            answer: 'Evet, BilsemC2\'yi kullanmak için internet bağlantısı gereklidir. Ancak bazı içerikler çevrimdışı kullanım için indirilebilir özelliktedir.'
        },
        {
            category: 'Destek',
            question: 'Teknik bir sorun yaşarsam ne yapmalıyım?',
            answer: 'Teknik sorunlar için destek@bilsemc2.com adresine e-posta gönderebilir veya platformdaki canlı destek özelliğini kullanabilirsiniz. Destek ekibimiz size en kısa sürede yardımcı olacaktır.'
        },
        {
            category: 'Destek',
            question: 'Geri bildirimde bulunabilir miyim?',
            answer: 'Evet, platformun geliştirilmesine katkıda bulunmak için geri bildirimlerinizi bizimle paylaşabilirsiniz. Önerilerinizi profil sayfanızdaki "Geri Bildirim" bölümünden veya destek@bilsemc2.com adresinden iletebilirsiniz.'
        }
    ];

    const categories = Array.from(new Set(faqItems.map(item => item.category)));

    const toggleItem = (index: number) => {
        setOpenItem(openItem === index ? null : index);
    };

    const filteredItems = faqItems.filter(item => item.category === activeCategory);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span className="block">Sıkça Sorulan</span>
                    <span className="block text-indigo-600">Sorular</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    BilsemC2 hakkında merak ettiğiniz tüm soruların cevapları burada.
                </p>
            </div>

            {/* Category Tabs */}
            <div className="max-w-3xl mx-auto mb-8">
                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                activeCategory === category
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* FAQ Items */}
            <div className="max-w-3xl mx-auto">
                <div className="space-y-4">
                    {filteredItems.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                        >
                            <button
                                className="w-full px-6 py-4 flex justify-between items-center focus:outline-none"
                                onClick={() => toggleItem(index)}
                            >
                                <span className="text-lg font-medium text-gray-900 text-left">
                                    {item.question}
                                </span>
                                {openItem === index ? (
                                    <ChevronUp className="w-5 h-5 text-indigo-600" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                            {openItem === index && (
                                <div className="px-6 pb-4">
                                    <p className="text-gray-600 whitespace-pre-line">
                                        {item.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Still Have Questions */}
            <div className="mt-16 text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">
                    Hala sorularınız mı var?
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                    Burada cevabını bulamadığınız sorularınız için bize ulaşın.
                </p>
                <div className="mt-8">
                    <Link
                        to="/contact"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        İletişime Geçin
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
