import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateStory } from './services/gpt';
import { saveStory } from './services/stories';
import { StoryTheme } from './types';
import { ThemeSelector } from './components/ThemeSelector';
import toast from 'react-hot-toast';

export default function StoryGeneratorPage() {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState<StoryTheme>('adventure');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string | null>(null);

  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsGenerating(true);
      
      // Başlangıç bildirimi
      toast.success('Hikaye oluşturma süreci başladı. Lütfen bekleyin...', {
        duration: 3000,
        icon: '📚',
      });
      
      setGenerationStep('Hikaye oluşturuluyor...');
      const storyData = await generateStory(selectedTheme);
      
      // API'nin oluşturduğu başlığı kullanıyoruz (otomatik başlık üretimi)
      toast.success(`"${storyData.title}" başlıklı hikaye oluşturuldu!`, {
        duration: 3000,
      });

      setGenerationStep('Hikaye kaydediliyor...');
      const savedStory = await saveStory(storyData);
      
      setGenerationStep('Sorular oluşturuluyor...');
      // Burada sorular oluşturulacak (ileride implement edilebilir)
      
      setGenerationStep('Sorular kaydediliyor...');
      // Burada sorular kaydedilecek (ileride implement edilebilir)
      
      // Görüntü oluşturma adımı (ileride implement edilebilir)
      setGenerationStep('Görsel oluşturuluyor...');
      
      // Tüm sürecin tamamlandığını bildiren son toast
      toast.success('🎉 Hikaye tamamen hazır! Yönlendiriliyorsunuz...', {
        duration: 3000,
        icon: '🎉',
      });

      // Kısa bir gecikme ile yönlendirme yap
      setTimeout(() => {
        navigate(`/stories/${savedStory.id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Hikaye oluşturma hatası:', error);
      toast.error('Hikaye oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.', {
        duration: 5000,
        icon: '⚠️',
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center text-purple-900 mb-8">
        Hikaye Oluşturucu
      </h1>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleGenerateStory} className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hikaye Teması
            </label>
            <ThemeSelector 
              selectedTheme={selectedTheme} 
              onSelectTheme={setSelectedTheme}
              disabled={isGenerating}
            />
          </div>

          {/* Özel not bölümü - Kullanıcıya bilgi vermek için */}
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700">
              <span className="font-bold">💡 Bilgi:</span> Hikaye başlığı yapay zeka tarafından otomatik olarak oluşturulacaktır. İstediğiniz temayı seçip "Hikaye Oluştur" butonuna tıklamanız yeterlidir.
            </p>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
              isGenerating ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
            } transition-colors flex justify-center items-center gap-2 shadow-md hover:shadow-lg`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="animate-pulse">{generationStep || 'Hikaye oluşturuluyor...'}</span>
              </>
            ) : (
              <>
                <span className="mr-2">📖</span> Hikaye Oluştur
              </>
            )}
          </button>
        </form>

        {isGenerating && (
          <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h3 className="text-sm font-medium text-purple-800 mb-2">
              Hikaye Oluşturma İşlemi
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 mr-2 rounded-full ${generationStep === 'Hikaye oluşturuluyor...' ? 'bg-purple-600 animate-pulse' : generationStep && generationStep !== 'Hikaye oluşturuluyor...' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className={`text-sm ${generationStep === 'Hikaye oluşturuluyor...' ? 'text-purple-700 font-medium' : generationStep && generationStep !== 'Hikaye oluşturuluyor...' ? 'text-green-600' : 'text-gray-600'}`}>Hikaye Oluşturma</p>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 mr-2 rounded-full ${generationStep === 'Hikaye kaydediliyor...' ? 'bg-purple-600 animate-pulse' : generationStep === 'Sorular oluşturuluyor...' || generationStep === 'Sorular kaydediliyor...' || generationStep === 'Görsel oluşturuluyor...' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className={`text-sm ${generationStep === 'Hikaye kaydediliyor...' ? 'text-purple-700 font-medium' : generationStep === 'Sorular oluşturuluyor...' || generationStep === 'Sorular kaydediliyor...' || generationStep === 'Görsel oluşturuluyor...' ? 'text-green-600' : 'text-gray-600'}`}>Hikaye Kaydetme</p>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 mr-2 rounded-full ${generationStep === 'Sorular oluşturuluyor...' ? 'bg-purple-600 animate-pulse' : generationStep === 'Sorular kaydediliyor...' || generationStep === 'Görsel oluşturuluyor...' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className={`text-sm ${generationStep === 'Sorular oluşturuluyor...' ? 'text-purple-700 font-medium' : generationStep === 'Sorular kaydediliyor...' || generationStep === 'Görsel oluşturuluyor...' ? 'text-green-600' : 'text-gray-600'}`}>Soru Oluşturma</p>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 mr-2 rounded-full ${generationStep === 'Sorular kaydediliyor...' ? 'bg-purple-600 animate-pulse' : generationStep === 'Görsel oluşturuluyor...' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className={`text-sm ${generationStep === 'Sorular kaydediliyor...' ? 'text-purple-700 font-medium' : generationStep === 'Görsel oluşturuluyor...' ? 'text-green-600' : 'text-gray-600'}`}>Soru Kaydetme</p>
              </div>
              
              <div className="flex items-center">
                <div className={`w-3 h-3 mr-2 rounded-full ${generationStep === 'Görsel oluşturuluyor...' ? 'bg-purple-600 animate-pulse' : 'bg-gray-300'}`}></div>
                <p className={`text-sm ${generationStep === 'Görsel oluşturuluyor...' ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>Görsel Oluşturma</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
