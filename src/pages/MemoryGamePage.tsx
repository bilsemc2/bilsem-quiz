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
import { useUser } from '../hooks/useUser';

interface ImageCard {
  id: string;
  src: string;
  name: string;
  option: string;
  isTarget: boolean;
  isAnswer: boolean;
  position?: number;
}

const MemoryGamePage = () => {
  // Auth ve XP hook'ları
  const { user } = useAuth();
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, error: xpError, loading: xpLoading } = useXPCheck(
    userLoading ? undefined : currentUser?.id,
    '/memory-game'
  );

  // Diğer state'ler
  const [loading, setLoading] = useState(true);
  const [showQuestion, setShowQuestion] = useState(false);
  const [targetImage, setTargetImage] = useState<ImageCard | null>(null);
  const [options, setOptions] = useState<ImageCard[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { playSound } = useSound();
  const navigate = useNavigate();

  const loadNewQuestion = async () => {
    try {
      setLoading(true);
      setShowQuestion(false);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(null);

      // Import all option images - both answer and option images
      const optionImports = import.meta.glob('/public/images/options/Matris/**/*.webp', { eager: true });
      
      // Convert imports to usable paths and group by folder
      const imagesByFolder: { [key: string]: ImageCard[] } = {};
      
      Object.keys(optionImports).forEach(path => {
        // Try to match both formats:
        // 1. Soru-cevap-246C.webp (answer)
        // 2. Soru-246A.webp (option)
        const answerMatch = path.match(/Matris\/(\d+)\/Soru-cevap-\d+([A-E])/);
        const optionMatch = path.match(/Matris\/(\d+)\/Soru-\d+([A-E])/);
        
        const match = answerMatch || optionMatch;
        if (!match) return;
        
        const [_, folderId, option] = match;
        const image: ImageCard = {
          id: folderId,
          src: path.replace('/public', ''),
          name: `Soru ${folderId}`,
          option,
          isTarget: false,
          isAnswer: !!answerMatch
        };
        
        if (!imagesByFolder[folderId]) {
          imagesByFolder[folderId] = [];
        }
        imagesByFolder[folderId].push(image);
      });

      // Get all folder IDs and sort them
      const folderIds = Object.keys(imagesByFolder).sort((a, b) => parseInt(a) - parseInt(b));
      
      if (folderIds.length === 0) {
        toast.error('Yeterli sayıda soru bulunamadı');
        return;
      }

      // Rastgele bir klasör seç
      const targetFolderIndex = Math.floor(Math.random() * folderIds.length);
      const targetFolderId = folderIds[targetFolderIndex];
      
      // Hedef klasörden cevap resmini seç
      const targetFolderImages = imagesByFolder[targetFolderId];
      const answerImage = targetFolderImages.find(img => img.isAnswer);
      
      if (!answerImage) {
        console.error('Bu klasörde cevap resmi yok:', targetFolderId);
        return;
      }

      const target = { ...answerImage, isTarget: true };

      console.log('Hedef:', {
        folderId: targetFolderId,
        option: target.option,
        path: target.src
      });

      // Aynı klasörden diğer şıkları seç (3 tane)
      const sameFolderOptions = targetFolderImages
        .filter(img => !img.isAnswer) // Sadece cevap olmayan resimleri al
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      console.log('Aynı Klasör Seçenekleri:', sameFolderOptions.map(opt => ({
        folderId: opt.id,
        option: opt.option,
        path: opt.src
      })));

      // Yakın klasörlerden 2 tane seç
      const nearbyFolderIds = folderIds.filter(id => {
        const diff = Math.abs(parseInt(id) - parseInt(targetFolderId));
        return diff <= 3 && id !== targetFolderId;
      });

      console.log('Yakın Klasör IDleri:', nearbyFolderIds);

      const nearbyOptions: ImageCard[] = [];
      while (nearbyOptions.length < 2 && nearbyFolderIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * nearbyFolderIds.length);
        const folderId = nearbyFolderIds[randomIndex];
        const folderImages = imagesByFolder[folderId];
        // Cevap olmayan resimlerden rastgele seç
        const nonAnswerImages = folderImages.filter(img => !img.isAnswer);
        if (nonAnswerImages.length > 0) {
          const randomImage = nonAnswerImages[Math.floor(Math.random() * nonAnswerImages.length)];
          nearbyOptions.push(randomImage);
        }
        nearbyFolderIds.splice(randomIndex, 1);
      }

      console.log('Yakın Klasör Seçenekleri:', nearbyOptions.map(opt => ({
        folderId: opt.id,
        option: opt.option,
        path: opt.src
      })));

      // Tüm seçenekleri birleştir ve karıştır (sadece başlangıçta)
      const allOptions = [...sameFolderOptions, ...nearbyOptions]
        .sort(() => Math.random() - 0.5)
        .map(opt => ({ ...opt, position: Math.random() }));

      console.log('Final Seçenekler:', allOptions.map(opt => ({
        folderId: opt.id,
        option: opt.option,
        path: opt.src
      })));

      // Hedef resmi ve seçenekleri ayarla
      setTargetImage({ ...target, position: Math.random() });
      setOptions(allOptions);

      setLoading(false);
      
      // 3 saniye sonra hedef resmi gizle
      setTimeout(() => {
        setShowQuestion(true);
      }, 3000);

    } catch (error) {
      console.error('Soru yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const handleOptionClick = async (selectedImage: ImageCard) => {
    if (isAnswered || !targetImage) return;

    setSelectedOption(selectedImage.src);
    setIsAnswered(true);

    const correct = selectedImage.src === targetImage.src;
    setIsCorrect(correct);

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
          title: 'Hafıza Oyunu',
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

  const renderContent = () => {
    // Loading durumunda bekle
    if (userLoading || xpLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    // XP kontrolü
    if (!hasEnoughXP) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <XPWarning
            requiredXP={requiredXP}
            currentXP={userXP}
            title="Hafıza Oyunu sayfasına erişim için yeterli XP'niz yok"
          />
        </div>
      );
    }

    // Ana oyun içeriği
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
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Hafıza Oyunu
                </h1>
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

          {/* Hedef Resim */}
          {targetImage && !showQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 mb-8"
            >
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Bu resmi hatırla:</h2>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex justify-center"
              >
                <div className="relative w-full max-w-xs mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20"></div>
                  <img
                    src={targetImage.src}
                    alt="Hedef Resim"
                    className="relative rounded-2xl shadow-2xl w-full"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Seçenekler */}
          {showQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Hedef resmi bul:</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto">
                {[targetImage, ...options]
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((image, index) => (
                  <motion.div
                    key={`${image.id}-${image.option}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                    className={`relative cursor-pointer group w-32 h-32 mx-auto`}
                    onClick={() => !isAnswered && handleOptionClick(image)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <div 
                      className={`relative rounded-xl overflow-hidden transition-all duration-300 shadow-lg h-full
                        ${isAnswered && selectedOption === image.src
                          ? image.src === targetImage?.src
                            ? 'ring-4 ring-emerald-500 shadow-emerald-200'
                            : 'ring-4 ring-red-500 shadow-red-200'
                          : 'hover:shadow-xl'
                        }`}
                    >
                      <img
                        src={image.src}
                        alt={`Seçenek ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                      {isAnswered && image.src === targetImage?.src && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500 bg-opacity-20 backdrop-blur-sm">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-white rounded-full p-2"
                          >
                            <svg 
                              className="w-8 h-8 text-emerald-500" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M5 13l4 4L19 7" 
                              />
                            </svg>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sonuç Mesajı */}
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-8 p-6 rounded-2xl text-center ${
                isCorrect 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                  : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
            >
              <motion.p 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-xl font-bold text-white"
              >
                {isCorrect ? 'Harika! Doğru resmi buldun! 🎉' : 'Üzgünüm, yanlış resmi seçtin! 😢'}
              </motion.p>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return renderContent();
};

export default MemoryGamePage;