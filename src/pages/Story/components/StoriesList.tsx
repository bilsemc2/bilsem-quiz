import { useState, useEffect } from 'react';
import { getStories } from '../services/stories';
import { Story, Question, themeTranslations } from './types';
import { ChevronRight, Download, GamepadIcon, Check, X } from 'lucide-react';
import { PDFPreview } from './PDFPreview';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { WordGamesPDF } from './WordGamesPDF';
import { WordGames } from './WordGames';
// toast artık kullanılmadığı için import kaldırıldı

export function StoriesList() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: number}>({});
  const [showAllResults, setShowAllResults] = useState(false);
  const [finalScore, setFinalScore] = useState<{correct: number, total: number} | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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
            {(selectedStory.questions || []).map((question: Question, index: number) => {
              const questionId = `${selectedStory.id}-${index}`;
              const isCorrect = userAnswers[questionId] === question.correctAnswer;
              
              return (
                <div 
                  key={`question-${questionId}`} 
                  data-question-id={questionId}
                  className={`question-item bg-purple-50 rounded-lg p-4 space-y-3 ${userAnswers[questionId] === undefined && validationError ? 'border-2 border-red-400' : ''}`}>
                  <p className="font-medium">{question.text}</p>
                  <div className="grid gap-2">
                    {question.options.map((option: string, optionIndex: number) => {
                      const isSelected = userAnswers[questionId] === optionIndex;
                      let optionClass = "p-3 rounded-lg cursor-pointer transition-colors border-2 ";
                      
                      if (!showAllResults) {
                        // Sonuç gösterilmeden önceki görünüm
                        optionClass += isSelected 
                          ? "bg-purple-100 border-purple-500" 
                          : "bg-gray-100 hover:bg-gray-200 border-transparent";
                      } else {
                        // Sonuç gösterilirken
                        if (optionIndex === question.correctAnswer) {
                          optionClass += "bg-green-100 text-green-800 border-green-500";
                        } else if (isSelected && optionIndex !== question.correctAnswer) {
                          optionClass += "bg-red-100 text-red-800 border-red-500";
                        } else {
                          optionClass += "bg-gray-100 border-transparent";
                        }
                      }
                      
                      return (
                        <div
                          key={`option-${questionId}-${optionIndex}`}
                          className={optionClass}
                          onClick={() => {
                            if (!showAllResults) {
                              setUserAnswers(prev => ({
                                ...prev,
                                [questionId]: optionIndex
                              }));
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {showAllResults && (
                              <span>
                                {optionIndex === question.correctAnswer && (
                                  <Check className="text-green-600 h-5 w-5" />
                                )}
                                {isSelected && optionIndex !== question.correctAnswer && (
                                  <X className="text-red-600 h-5 w-5" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {showAllResults && (
                    <div className="mt-3 text-sm font-medium">
                      {isCorrect 
                        ? <p className="text-green-600">{question.feedback.correct}</p>
                        : <p className="text-red-600">{question.feedback.incorrect}</p>
                      }
                    </div>
                  )}
                </div>
              );
            })}
            
            {validationError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
                <p className="font-medium">{validationError}</p>
                <p className="text-sm mt-1">Yanlış olan soruyu yukarıda kırmızı çerçeve ile işaretledim.</p>
              </div>
            )}
            
            <div className="flex items-center justify-center mt-6">
              {!showAllResults ? (
                <button
                  onClick={() => {
                    const questions = selectedStory?.questions || [];
                    
                    // Her bir soru için isAnswered kontrolü yap
                    let unansweredCount = 0;
                    questions.forEach((_, index) => {
                      const qId = `${selectedStory!.id}-${index}`;
                      const isAnswered = userAnswers[qId] !== undefined;
                      if (!isAnswered) unansweredCount++;
                    });
                    
                    const totalAnswered = questions.length - unansweredCount;
                    
                    if (unansweredCount > 0) {
                      setValidationError(`Lütfen tüm soruları cevaplayın. ${totalAnswered}/${questions.length} soru cevaplandı.`);
                      // Cevaplanmamış sorulara otomatik kaydır
                      setTimeout(() => {
                        document.querySelectorAll('.question-item').forEach((el) => {
                          const questionId = el.getAttribute('data-question-id');
                          if (questionId && userAnswers[questionId] === undefined) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                          }
                        });
                      }, 300);
                      return;
                    }
                    // Hata mesajını kaldır
                    setValidationError(null);
                    
                    // Doğru cevapları sayalım
                    let correctCount = 0;
                    questions.forEach((question, index) => {
                      const questionId = `${selectedStory!.id}-${index}`;
                      if (userAnswers[questionId] === question.correctAnswer) {
                        correctCount++;
                      }
                    });
                    
                    setShowAllResults(true);
                    setFinalScore({
                      correct: correctCount,
                      total: questions.length
                    });
                    
                    // Toast bildirimlerini kaldırdık, sonuçlar sadece sayfada gösterilecek
                    // Sonuçları zaten sayfada gösterdiğimiz için burada toast'a gerek yok
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Tüm Cevapları Kontrol Et
                </button>
              ) : (
                <div className="space-y-4 w-full">
                  {finalScore && (
                    <div className={`text-center p-6 rounded-lg border ${finalScore.correct === finalScore.total ? 'bg-green-50 border-green-200 text-green-800' : finalScore.correct > finalScore.total / 2 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                      <div className="flex justify-center mb-4">
                        {finalScore.correct === finalScore.total ? (
                          <div className="bg-green-100 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        ) : finalScore.correct > finalScore.total / 2 ? (
                          <div className="bg-blue-100 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="bg-orange-100 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-2xl font-bold mb-2">Puanınız: {finalScore.correct}/{finalScore.total}</p>
                      
                      <p className="text-lg mb-2">
                        {finalScore.correct === finalScore.total 
                          ? "Tebrikler! Tüm soruları doğru cevapladınız! 🎉" 
                          : finalScore.correct > finalScore.total / 2 
                            ? `İyi iş! ${finalScore.correct}/${finalScore.total} soruyu doğru cevapladınız.` 
                            : `${finalScore.correct}/${finalScore.total} soruyu doğru cevapladınız.`}
                      </p>
                      
                      {finalScore.correct < finalScore.total && (
                        <p className="text-sm">
                          {finalScore.correct > finalScore.total / 2 
                            ? "Daha da geliştirebilirsiniz! Yanlış cevapladığınız soruları inceleyebilirsiniz." 
                            : "Hikayeyi yeniden okuyabilir ve ardından soruları tekrar çözebilirsiniz."}
                        </p>
                      )}
                      
                      {finalScore.correct < finalScore.total / 2 && (
                        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                          <p className="font-medium text-purple-800">Endişelenmeyin! Herkes farklı hızlarda öğrenir. Hikayeyi tekrar okumak ve ana fikirleri kavramak için biraz daha zaman ayırabilirsiniz.</p>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowAllResults(false);
                      setUserAnswers({});
                      setFinalScore(null);
                    }}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}
            </div>
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
                  <div className="flex items-center gap-2">
                    <Download size={20} />
                    <span>PDF İndir</span>
                  </div>
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