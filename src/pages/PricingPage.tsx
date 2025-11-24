import { Link } from 'react-router-dom';
import PricingCard from '../components/PricingCard';

export default function PricingPage() {
  const go = (path: string) => () => {
    // SPA yönlendirme kullanmıyorsanız, burada window.location.assign(path) de kullanabilirsiniz.
    // Örn: window.location.assign(path);
    // Projede react-router varsa, bu onClick yerine <Link> ile de yönlendirebilirsiniz.
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Fiyatlandırma Planları</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sınav hazırlığında size en uygun paketi seçin. BilsemC2 ile planlı ve verimli ilerleyin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Temel Paket */}
            <PricingCard
              title="Temel Paket"
              price="₺1.000/Dönem"
              description="Temel hazırlık için ihtiyacınız olan düzen ve destek."
              features={[
                'Hafta içi her gün sınıf seviyesine uygun 2 deneme kodu',
                'Sınıfına göre WhatsApp VIP grubu',
                'Her Pazar 19:30’da Genel Deneme',
                'Bilsemce.com 1 aylık ücretsiz üyelik',
                'Son hafta grubu: Motivasyon konuşmaları, oyun & eğlence',
              ]}
              buttonText="Plana ait sorularım var"
              onClick={go('https://api.whatsapp.com/send/?phone=05416150721')}
            />

            {/* Standart Paket */}
            <PricingCard
              title="Standart Paket"
              price="₺1.500/Aylık"
              description="Daha fazla içerik, canlı ders saatleri ve ek platform erişimi."
              features={[
                'Tüm Temel özellikleri',
                'bilsemc2.com VIP üyeliği ve 5000 XP',
                'Dönemlik yetenekvezeka.com kullanım hakkı',
                'Salı & Perşembe canlı dersler:',
                '• 1. Sınıf 19:30 • 2. Sınıf 20:00 • 3. Sınıf 20:30',
                'Hediye kitaplar',
              ]}
              buttonText="Plana ait sorularım var"
              onClick={go('https://api.whatsapp.com/send/?phone=05416150721')}
            />

            {/* Profesyonel Plan Paket */}
            <PricingCard
              title="Profesyonel Plan Paket"
              price="₺2.500/Aylık"
              description="En kapsamlı paket: ek canlı dersler, özel uygulamalar ve VIP erişim."
              features={[
                'Tüm Standart özellikleri',
                'Hafta içi her gün sınıf seviyesine uygun 2 deneme kodu',
                'Sınıfına göre WhatsApp VIP grubu',
                'Her Pazar 19:30’da Genel Deneme',
                'Bilsemce.com 1 aylık ücretsiz üyelik',
                'Son hafta grubu: Motivasyon, oyun & eğlence',
                'Salı & Perşembe canlı dersler:',
                '• 1. Sınıf 19:30 • 2. Sınıf 20:00 • 3. Sınıf 20:30',
                'bilsemc2.com VIP üyeliği ve 5000 XP',
                'Dönemlik yetenekvezeka.com kullanım hakkı',
                'Gruba özel soru uygulamaları',
                'Hediye kitaplar',
              ]}
              isPopular
              buttonText="Plana ait sorularım var"
              onClick={go('https://api.whatsapp.com/send/?phone=05416150721')}
            />
          </div>

          {/* Ek CTA’lar */}
          <div className="text-center mt-12">
            <Link
              to="/teacher-pricing"
              className="inline-block px-8 py-4 mb-10 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              Öğretmen ve VIP Üyelik Planlarını Görüntüle
              <span className="ml-2">→</span>
            </Link>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}