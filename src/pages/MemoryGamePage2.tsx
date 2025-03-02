import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../hooks/useSound';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Brain } from 'lucide-react';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
interface ImageCard {
  id: string;
  src: string;
  name: string;
  option: string;
  isTarget: boolean;
  isFlipped: boolean;
  hasQuestion: boolean;
}

const MemoryGamePage2 = () => {
  const [gameLoading, setGameLoading] = useState(true);
  const [showQuestion, setShowQuestion] = useState(false);
  const [targetImages, setTargetImages] = useState<ImageCard[]>([]);
  const [questionImage, setQuestionImage] = useState<ImageCard | null>(null);
  const [options, setOptions] = useState<ImageCard[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const { playSound } = useSound();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: xpLoading, userXP, requiredXP } = useXPCheck();

  const loadNewQuestion = async () => {
    try {
      setGameLoading(true);
      setShowQuestion(false);
      setSelectedOption(null);
      setIsAnswered(false);

      // Import all option images
      const optionImports = import.meta.glob('/public/images/options/Matris/**/*.webp', { eager: true });
      
      // Convert imports to usable paths
      const availableImages: ImageCard[] = Object.keys(optionImports)
        .filter(path => path.includes('-cevap-'))
        .map(path => {
          const match = path.match(/Soru-cevap-(\d+)([A-E])/);
          if (!match) return null;
          
          const [_, questionId, option] = match;
          return {
            id: questionId,
            src: path.replace('/public', ''),
            name: `Soru ${questionId}`,
            option,
            isTarget: false,
            isFlipped: false,
            hasQuestion: false
          };
        })
        .filter((img): img is ImageCard => img !== null);

      if (availableImages.length < 9) { // 4 hedef + 5 seçenek için minimum 9 resim
        toast.error('Yeterli sayıda resim bulunamadı');
        return;
      }

      // Rastgele 4 hedef resim seç
      const shuffledImages = availableImages.sort(() => Math.random() - 0.5);
      const targets = shuffledImages.slice(0, 4).map(img => ({ ...img, isTarget: true }));
      
      // Hedef resimleri listeden çıkar
      const remainingImages = shuffledImages.slice(4);

      // Rastgele bir hedef resmi soru olarak seç
      const questionIndex = Math.floor(Math.random() * 4);
      const questionTarget = { ...targets[questionIndex], hasQuestion: true };
      targets[questionIndex] = questionTarget;

      // 5 seçenek için: doğru cevap + 2 hedef resim + 2 yanlış cevap
      const otherTargets = targets.filter(t => !t.hasQuestion);
      const randomTargets = otherTargets.sort(() => Math.random() - 0.5).slice(0, 2);
      const wrongOptions = remainingImages.slice(0, 2);
      const allOptions = [...randomTargets, ...wrongOptions, questionTarget].sort(() => Math.random() - 0.5);

      setTargetImages(targets);
      setQuestionImage(questionTarget);
      setOptions(allOptions);
      setGameLoading(false);

      // 3 saniye sonra kartları çevir
      setTimeout(() => {
        setTargetImages(prev => prev.map(img => ({ ...img, isFlipped: true })));
        setShowQuestion(true);
      }, 3000);

    } catch (error) {
      console.error('Soru yüklenirken hata:', error);
      setGameLoading(false);
    }
  };

  const handleOptionClick = async (selectedImage: ImageCard) => {
    if (isAnswered || !questionImage) return;

    setSelectedOption(selectedImage.src);
    setIsAnswered(true);

    const correct = selectedImage.src === questionImage.src;

    if (correct) {
      playSound('correct');
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      playSound('incorrect');
      setStreak(0);
    }

    // Puanı Supabase'e kaydet
    if (user) {
      const { error } = await supabase
        .from('quiz_results')
        .insert({
          user_id: user.id,
          score: score + (correct ? 1 : 0),
          questions_answered: totalQuestions + 1,
          correct_answers: score + (correct ? 1 : 0),
          completed_at: new Date().toISOString(),
          title: 'Hafıza Oyunu 2',
          subject: 'Matris',
          grade: 0
        });

      if (error) console.error('Skor kaydedilirken hata:', error);
    }

    setTotalQuestions(prev => prev + 1);

    // 2 saniye sonra yeni soru yükle
    setTimeout(() => {
      loadNewQuestion();
    }, 2000);
  };

  useEffect(() => {
    loadNewQuestion();
  }, []);

  if (xpLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-lg text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-lg text-gray-600">Giriş yapmanız gerekiyor</div>
        </div>
      </div>
    );
  }

  if (userXP < requiredXP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
        <div className="container mx-auto px-4">
          <XPWarning 
            requiredXP={requiredXP} 
            currentXP={userXP} 
            title="Hafıza oyununa başlamak için gereken XP" 
          />
        </div>
      </div>
    );
  }

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Üst Bilgi */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Hafıza Oyunu 2
                </h1>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Ana Menü
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg p-4 min-w-[100px]">
                <p className="text-sm text-emerald-600 font-medium">Skor</p>
                <p className="text-2xl font-bold text-emerald-700">{score}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-4 min-w-[100px]">
                <p className="text-sm text-blue-600 font-medium">Seri</p>
                <p className="text-2xl font-bold text-blue-700">{streak}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-4 min-w-[100px]">
                <p className="text-sm text-purple-600 font-medium">Toplam</p>
                <p className="text-2xl font-bold text-purple-700">{totalQuestions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hedef Resimler Grid */}
        {targetImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-8"
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              {!showQuestion ? 'Bu resimleri hatırla:' : 'Soru işaretli resim hangisiydi?'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {targetImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="relative w-40 h-40 mx-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20"></div>
                  {image.isFlipped ? (
                    <div className={`relative w-full h-full rounded-2xl flex items-center justify-center ${
                      image.hasQuestion 
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-4 border-yellow-400 shadow-lg' 
                        : 'bg-gray-200'
                    }`}>
                      {image.hasQuestion && (
                        <div className="text-center">
                          <span className="text-5xl font-bold text-yellow-600">?</span>
                          <p className="text-sm font-medium text-yellow-700 mt-2">Bu resim neydi?</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <img
                      src={image.src}
                      alt={`Hedef Resim ${index + 1}`}
                      className="relative rounded-2xl shadow-2xl w-full h-full object-cover"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Seçenekler */}
        {showQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto mt-8"
          >
            {options.map((option, index) => (
              <motion.button
                key={index}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOptionClick(option)}
                disabled={isAnswered}
                className={`relative w-32 h-32 p-2 rounded-xl transition-all ${
                  isAnswered
                    ? option.src === questionImage?.src
                      ? 'ring-4 ring-green-500'
                      : selectedOption === option.src
                      ? 'ring-4 ring-red-500'
                      : 'opacity-50'
                    : 'hover:shadow-xl hover:ring-2 hover:ring-purple-300'
                }`}
              >
                <img
                  src={option.src}
                  alt={`Seçenek ${index + 1}`}
                  className="rounded-lg w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MemoryGamePage2;
