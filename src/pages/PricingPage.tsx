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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Fiyatlandırma Planı</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sınav hazırlığında en iyi paketimizle planlı ve verimli ilerleyin.
            </p>
          </div>

          <div className="flex justify-center max-w-md mx-auto">
            {/* Profesyonel Plan Paket */}
            <PricingCard
              title="Profesyonel Plan Paket"
              price="₺9999/Dönemlik"
              description="Plan detayları için WhatsApp'tan bizimle iletişime geçin."
              features={[]}
              isPopular
              buttonText="Plan Hakkında Bilgi Al"
              onClick={go('https://api.whatsapp.com/send/?phone=905416150721&text=Merhaba, Profesyonel Plan Paket hakkında bilgi almak istiyorum.')}
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