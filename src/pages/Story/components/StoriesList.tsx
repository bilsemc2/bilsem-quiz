import { useState, useEffect } from 'react';
import { getStories } from '../services/stories';
import { Story, Question, themeTranslations } from './types';
import { ChevronRight, Download, GamepadIcon, X } from 'lucide-react';
import { PDFPreview } from './PDFPreview';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { WordGamesPDF } from './WordGamesPDF';
import { WordGames } from './WordGames';

export function StoriesList() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showGames, setShowGames] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    try {
      const data = await getStories();
      setStories(data);
    } catch (err) {
      setError((err as Error)?.message || 'Hikayeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-purple-900 mb-8">Tüm Hikayeler</h2>
      {selectedStory ? (
        <div className="bg-white rounded-xl p-6 shadow-lg space-y-6">
          <button
            onClick={() => setSelectedStory(null)}
            className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-2"
          >
            ← Hikayelere Dön
          </button>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowGames(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <GamepadIcon size={20} />
              <span>Kelime Oyunları</span>
            </button>
            <button
              onClick={() => setShowPDFPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download size={20} />
              <span>PDF Önizleme ve İndir</span>
            </button>
          </div>

          <h3 className="text-2xl font-bold text-purple-900">{selectedStory.title}</h3>

          {selectedStory.image_url && (
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
              <img
                src={selectedStory.image_url}
                alt={selectedStory.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="prose max-w-none">
            {selectedStory.content}
          </div>

          <div className="space-y-4 mt-8">
            <h4 className="text-xl font-semibold text-purple-900">Sorular</h4>
            {(selectedStory.questions || []).map((question: Question, index: number) => (
              <div key={`question-${selectedStory.id}-${index}`} className="bg-purple-50 rounded-lg p-4 space-y-3">
                <p className="font-medium">{question.text}</p>
                <div className="grid gap-2">
                  {question.options.map((option: string, optionIndex: number) => (
                    <div
                      key={`option-${selectedStory.id}-${index}-${optionIndex}`}
                      className={`p-3 rounded-lg ${
                        optionIndex === question.correctAnswer
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100'
                      }`}
                    >
                      {option}
                      {optionIndex === question.correctAnswer && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(stories || []).map((story) => (
            <button
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
            >
              {story.image_url && (
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={story.image_url}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-purple-900 line-clamp-1">
                    {story.title}
                  </h3>
                  <ChevronRight className="text-purple-600" />
                </div>
                <p className="text-sm text-purple-600 mt-2">
                  {themeTranslations[story.theme]}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {showPDFPreview && selectedStory && (
        <PDFPreview
          story={selectedStory}
          onClose={() => setShowPDFPreview(false)}
        />
      )}
      
      {showGames && selectedStory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-purple-900">
                Kelime Oyunları - {selectedStory.title}
              </h3>
              <div className="flex items-center gap-3">
                <PDFDownloadLink
                  document={<WordGamesPDF story={selectedStory} />}
                  fileName={`${selectedStory.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-kelime-oyunlari.pdf`}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {({ loading }) => (
                    <>
                      <Download size={20} />
                      <span>{loading ? 'Hazırlanıyor...' : 'PDF İndir'}</span>
                    </>
                  )}
                </PDFDownloadLink>
                <button
                  onClick={() => setShowGames(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <WordGames story={selectedStory} />
              <button
                onClick={() => setShowGames(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}