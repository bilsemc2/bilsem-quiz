import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStories } from '../services/stories';
import { Story, Question, themeTranslations, StoryTheme } from './types';
import { ChevronRight, Download, GamepadIcon, Check, X, Trophy, ArrowLeft, BookOpen, Filter, Star, Sparkles } from 'lucide-react';
import { WordGames } from './WordGames';
import { OnDemandPdfDownloadButton } from './OnDemandPdfDownloadButton';

const PDFPreview = lazy(() =>
  import('./PDFPreview').then((module) => ({ default: module.PDFPreview }))
);

const THEME_COLORS: Record<StoryTheme, { bg: string; text: string; border: string; accent: string }> = {
  animals: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300', accent: 'from-emerald-400 to-teal-500' },
  adventure: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300', accent: 'from-amber-400 to-orange-500' },
  fantasy: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300', accent: 'from-violet-400 to-purple-500' },
  science: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300', accent: 'from-blue-400 to-cyan-500' },
  friendship: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300', accent: 'from-pink-400 to-rose-500' },
  'life-lessons': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300', accent: 'from-indigo-400 to-blue-500' },
};

const THEME_EMOJIS: Record<StoryTheme, string> = {
  animals: '🐾', adventure: '🗺️', fantasy: '🧚', science: '🔬', friendship: '🤝', 'life-lessons': '💡',
};

export function StoriesList() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: number }>({});
  const [showAllResults, setShowAllResults] = useState(false);
  const [finalScore, setFinalScore] = useState<{ correct: number, total: number } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<StoryTheme | 'all'>('all');

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

  const filteredStories = useMemo(() => {
    if (activeFilter === 'all') return stories;
    return stories.filter(s => s.theme === activeFilter);
  }, [stories, activeFilter]);

  const availableThemes = useMemo(() => {
    const themes = new Set(stories.map(s => s.theme));
    return Array.from(themes) as StoryTheme[];
  }, [stories]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[40vh] gap-4">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Hikayeler yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl border-2 border-red-200 dark:border-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quiz Game Banner */}
      {!selectedStory && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border-2 border-black/5">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black font-nunito text-white">🎮 Hikaye Quiz Oyunu</h3>
                <p className="text-purple-100 text-sm sm:text-base">Rastgele hikaye oku, süreyle yarış, puan kazan!</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/stories/quiz-game')}
              className="px-6 py-3 bg-white text-purple-700 font-black font-nunito rounded-2xl hover:bg-purple-50 transition-all transform hover:scale-105 hover:-translate-y-1 shadow-lg border-2 border-white/50 flex items-center gap-2 uppercase tracking-wider text-sm"
            >
              <GamepadIcon className="w-5 h-5" />
              Oyuna Başla
            </button>
          </div>
        </div>
      )}

      {selectedStory ? (
        /* ==================== DETAIL VIEW ==================== */
        <div className="space-y-6 sm:space-y-8">
          {/* Back button */}
          <button
            onClick={() => { setSelectedStory(null); setUserAnswers({}); setShowAllResults(false); setFinalScore(null); setValidationError(null); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all font-bold text-slate-600 dark:text-slate-300 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Hikayelere Dön
          </button>

          {/* Story Header */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg">
            {selectedStory.image_url && (
              <div className="relative aspect-video sm:aspect-[21/9] overflow-hidden">
                <img
                  src={selectedStory.image_url}
                  alt={selectedStory.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${THEME_COLORS[selectedStory.theme]?.bg || 'bg-purple-100'} ${THEME_COLORS[selectedStory.theme]?.text || 'text-purple-700'} backdrop-blur-sm border ${THEME_COLORS[selectedStory.theme]?.border || 'border-purple-300'}`}>
                    {THEME_EMOJIS[selectedStory.theme]} {themeTranslations[selectedStory.theme]}
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-black font-nunito text-slate-800 dark:text-slate-100 mb-6">
                {selectedStory.title}
              </h2>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => setShowGames(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-md"
                >
                  <GamepadIcon size={18} />
                  Kelime Oyunları
                </button>
                <button
                  onClick={() => setShowPDFPreview(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-md"
                >
                  <Download size={18} />
                  PDF İndir
                </button>
              </div>

              {/* Story content */}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-relaxed sm:leading-loose first-letter:text-5xl first-letter:font-black first-letter:text-purple-600 dark:first-letter:text-purple-400 first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                  {selectedStory.content}
                </p>
              </div>

              {/* Animal info */}
              {selectedStory.theme === 'animals' && selectedStory.animalInfo && (
                <div className="mt-8 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
                  <h3 className="text-base font-black text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Biliyor muydun? 🤔
                  </h3>
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm leading-relaxed">{selectedStory.animalInfo}</p>
                </div>
              )}
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black font-nunito text-white">Sorular</h3>
                <p className="text-purple-100 text-xs">{selectedStory.questions?.length || 0} soru</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {(selectedStory.questions || []).map((question: Question, index: number) => {
                const questionId = `${selectedStory.id}-${index}`;
                const isCorrect = userAnswers[questionId] === question.correctAnswer;

                return (
                  <div
                    key={`question-${questionId}`}
                    data-question-id={questionId}
                    className={`question-item rounded-2xl border-2 overflow-hidden transition-all ${userAnswers[questionId] === undefined && validationError
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                      }`}
                  >
                    <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base flex items-start gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-purple-500 text-white text-xs font-black flex-shrink-0 mt-0.5">{index + 1}</span>
                        {question.text}
                      </p>
                    </div>

                    <div className="p-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option: string, optionIndex: number) => {
                        const isSelected = userAnswers[questionId] === optionIndex;
                        let optionClass = "p-3 sm:p-3.5 rounded-xl cursor-pointer transition-all border-2 text-sm font-medium flex items-center gap-3 ";

                        if (!showAllResults) {
                          optionClass += isSelected
                            ? "bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 text-purple-800 dark:text-purple-200 shadow-md"
                            : "bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-purple-300 hover:shadow-sm";
                        } else {
                          if (optionIndex === question.correctAnswer) {
                            optionClass += "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600";
                          } else if (isSelected && optionIndex !== question.correctAnswer) {
                            optionClass += "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-400 dark:border-red-600";
                          } else {
                            optionClass += "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500";
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
                            <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-black flex-shrink-0">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="flex-1">{option}</span>
                            {showAllResults && (
                              <>
                                {optionIndex === question.correctAnswer && (
                                  <Check className="text-emerald-600 dark:text-emerald-400 w-5 h-5 flex-shrink-0" />
                                )}
                                {isSelected && optionIndex !== question.correctAnswer && (
                                  <X className="text-red-600 dark:text-red-400 w-5 h-5 flex-shrink-0" />
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {showAllResults && (
                      <div className={`px-5 py-3 text-sm font-medium border-t ${isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                        }`}>
                        {isCorrect ? `✅ ${question.feedback.correct}` : `❌ ${question.feedback.incorrect}`}
                      </div>
                    )}
                  </div>
                );
              })}

              {validationError && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-2xl text-sm font-medium">
                  {validationError}
                </div>
              )}

              <div className="flex items-center justify-center pt-4">
                {!showAllResults ? (
                  <button
                    onClick={() => {
                      const questions = selectedStory?.questions || [];
                      let unansweredCount = 0;
                      questions.forEach((_, index) => {
                        const qId = `${selectedStory!.id}-${index}`;
                        if (userAnswers[qId] === undefined) unansweredCount++;
                      });
                      const totalAnswered = questions.length - unansweredCount;

                      if (unansweredCount > 0) {
                        setValidationError(`Lütfen tüm soruları cevaplayın. ${totalAnswered}/${questions.length} soru cevaplandı.`);
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
                      setValidationError(null);

                      let correctCount = 0;
                      questions.forEach((question, index) => {
                        const questionId = `${selectedStory!.id}-${index}`;
                        if (userAnswers[questionId] === question.correctAnswer) correctCount++;
                      });

                      setShowAllResults(true);
                      setFinalScore({ correct: correctCount, total: questions.length });
                    }}
                    className="px-8 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-black font-nunito rounded-2xl transition-all transform hover:scale-105 hover:-translate-y-1 shadow-lg text-sm uppercase tracking-wider"
                  >
                    ✅ Cevapları Kontrol Et
                  </button>
                ) : (
                  <div className="space-y-6 w-full max-w-lg mx-auto">
                    {finalScore && (
                      <div className={`text-center p-8 rounded-3xl border-2 ${finalScore.correct === finalScore.total
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                          : finalScore.correct > finalScore.total / 2
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                        }`}>
                        <div className="text-5xl mb-4">
                          {finalScore.correct === finalScore.total ? '🎉' : finalScore.correct > finalScore.total / 2 ? '⭐' : '💪'}
                        </div>
                        <p className="text-3xl font-black font-nunito mb-2 text-slate-800 dark:text-slate-100">
                          {finalScore.correct}/{finalScore.total}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                          {finalScore.correct === finalScore.total
                            ? "Tebrikler! Tüm soruları doğru cevapladın! 🎉"
                            : finalScore.correct > finalScore.total / 2
                              ? `Harika! ${finalScore.correct} soruyu doğru cevapladın.`
                              : `${finalScore.correct} soruyu doğru cevapladın. Tekrar deneyebilirsin!`}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => { setShowAllResults(false); setUserAnswers({}); setFinalScore(null); }}
                      className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-black font-nunito rounded-2xl transition-all hover:shadow-lg text-sm uppercase tracking-wider"
                    >
                      🔄 Tekrar Dene
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== GRID VIEW ==================== */
        <div className="space-y-6">
          {/* Category Filter */}
          {availableThemes.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 mr-1" />
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeFilter === 'all'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-purple-300'
                  }`}
              >
                Tümü ({stories.length})
              </button>
              {availableThemes.map(theme => (
                <button
                  key={theme}
                  onClick={() => setActiveFilter(theme)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${activeFilter === theme
                      ? `bg-gradient-to-r ${THEME_COLORS[theme].accent} text-white shadow-md`
                      : `${THEME_COLORS[theme].bg} ${THEME_COLORS[theme].text} border ${THEME_COLORS[theme].border} hover:shadow-sm`
                    }`}
                >
                  {THEME_EMOJIS[theme]} {themeTranslations[theme]}
                </button>
              ))}
            </div>
          )}

          {/* Story Cards Grid */}
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(filteredStories || []).map((story) => {
              const colors = THEME_COLORS[story.theme] || THEME_COLORS.adventure;
              return (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="group bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
                >
                  {story.image_url && (
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={story.image_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${colors.bg} ${colors.text} backdrop-blur-sm border ${colors.border}`}>
                          {THEME_EMOJIS[story.theme]} {themeTranslations[story.theme]}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {story.title}
                      </h3>
                      <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                    {story.questions && story.questions.length > 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {story.questions.length} soru
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredStories.length === 0 && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <p className="text-lg font-medium">Bu kategoride hikaye bulunamadı.</p>
            </div>
          )}
        </div>
      )}

      {showPDFPreview && selectedStory && (
        <Suspense fallback={null}>
          <PDFPreview
            story={selectedStory}
            onClose={() => setShowPDFPreview(false)}
          />
        </Suspense>
      )}

      {showGames && selectedStory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col border-2 border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-500">
              <h3 className="text-lg font-black font-nunito text-white">
                🎮 Kelime Oyunları — {selectedStory.title}
              </h3>
              <div className="flex items-center gap-3">
                <OnDemandPdfDownloadButton
                  fileName={`${selectedStory.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-kelime-oyunlari.pdf`}
                  loadDocument={async () => {
                    const { WordGamesPDF } = await import('./WordGamesPDF');
                    return <WordGamesPDF story={selectedStory} />;
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors text-sm font-bold"
                >
                  <div className="flex items-center gap-2">
                    <Download size={18} />
                    <span>PDF İndir</span>
                  </div>
                </OnDemandPdfDownloadButton>
                <button
                  onClick={() => setShowGames(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="text-white w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <WordGames story={selectedStory} />
              <button
                onClick={() => setShowGames(false)}
                className="mt-6 w-full py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
