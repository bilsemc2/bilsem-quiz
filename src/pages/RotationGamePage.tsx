import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import { useUser } from '../hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils"; // Shadcn utils

// --- Tipler ve Sabitler ---
interface Shape {
  id: number;
  name: string;
  svgPath: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
}

// Daha fazla şekil eklenebilir
const shapes: Shape[] = [
  { id: 1, name: 'L Şekli', svgPath: 'M30 20 H50 V60 H70 V80 H30 Z', difficulty: 'Kolay' },
  { id: 2, name: 'Ok', svgPath: 'M50 20 L70 40 L60 40 L60 80 L40 80 L40 40 L30 40 Z', difficulty: 'Kolay' },
  { id: 3, name: 'Artı', svgPath: 'M40 20 H60 V40 H80 V60 H60 V80 H40 V60 H20 V40 H40 Z', difficulty: 'Kolay' },
  { id: 4, name: 'Yıldız', svgPath: 'M50 20 L61 44 L87 44 L65 59 L74 83 L50 68 L26 83 L35 59 L13 44 L39 44 Z', difficulty: 'Orta' },
  { id: 5, name: 'Kalp', svgPath: 'M50 30 C35 10 10 25 10 45 C10 65 50 90 50 90 C50 90 90 65 90 45 C90 25 65 10 50 30 Z', difficulty: 'Orta'}, // Daha iyi kalp yolu
  { id: 6, name: 'Soyut 1', svgPath: 'M20 80 Q 50 20 80 80 T 20 80 Z', difficulty: 'Orta' },
  { id: 7, name: 'Karmaşık Şekil', svgPath: 'M30 20 H70 L80 40 L70 60 H30 L20 40 Z M40 40 H60 V50 H40 Z', difficulty: 'Zor' },
  { id: 8, name: 'Soyut 2', svgPath: 'M10 10 H 50 V 30 L 70 50 L 50 70 V 90 H 10 V 70 L 30 50 L 10 30 Z', difficulty: 'Zor'},
];

const ROTATION_ANGLES = Array.from({ length: 8 }, (_, i) => i * 45); // 0, 45, ..., 315

// Diziyi karıştıran yardımcı fonksiyon
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- Ana Oyun Bileşeni ---
const RotationGamePage: React.FC = () => {
  // --- Hooklar ---
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);

  // --- State'ler ---
  const [difficulty, setDifficulty] = useState<'Kolay' | 'Orta' | 'Zor'>('Kolay');
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [correctRotation, setCorrectRotation] = useState<number>(0);
  const [options, setOptions] = useState<number[]>([]); // Döndürme açıları
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [roundKey, setRoundKey] = useState(0); // Animasyonları tetiklemek için

  // --- Fonksiyonlar (useCallback ile) ---
  const getRandomShape = useCallback((diff: 'Kolay' | 'Orta' | 'Zor') => {
    const filteredShapes = shapes.filter(s => s.difficulty === diff);
    if (filteredShapes.length === 0) return shapes[0]; // Fallback
    return filteredShapes[Math.floor(Math.random() * filteredShapes.length)];
  }, []); // Bağımlılığı yok

  const generateRotationOptions = useCallback(() => {
    const correct = ROTATION_ANGLES[Math.floor(Math.random() * ROTATION_ANGLES.length)];
    setCorrectRotation(correct);

    const wrongOptions = ROTATION_ANGLES
      .filter(angle => angle !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3); // 3 yanlış seçenek

    return shuffleArray([correct, ...wrongOptions]); // Seçenekleri karıştır
  }, []); // Bağımlılığı yok

  const handleNewGame = useCallback(() => {
    setShowResult(false);
    setSelectedAnswer(null);
    const shape = getRandomShape(difficulty);
    setCurrentShape(shape);
    setOptions(generateRotationOptions());
    setRoundKey(prev => prev + 1); // Animasyon için key'i güncelle
  }, [difficulty, getRandomShape, generateRotationOptions]);

  const handleAnswer = useCallback(async (rotation: number) => {
    if (showResult) return;

    setSelectedAnswer(rotation);
    setShowResult(true);
    const isCorrect = rotation === correctRotation;

    if (isCorrect) {
      let points = 0;
      switch (difficulty) {
        case 'Kolay': points = 10; break;
        case 'Orta': points = 15; break; // Puanları biraz ayarlayalım
        case 'Zor': points = 25; break;
      }
      setScore(prev => prev + points);
      toast.success(`Doğru! +${points} Puan`, { icon: '🎯', duration: 1500 });

      // Puan güncelleme - sadece yerel olarak
      if (currentUser) {
        // Not: Supabase güncellemesi şu an devre dışı bırakıldı
        // Gelecekte burada kullanıcı puanı ve XP'si veritabanına kaydedilebilir
        toast.success(`Puanınız kaydedildi: +${points}`, { duration: 2000 });
      }
    } else {
      toast.error(`Yanlış! Doğru Açı: ${correctRotation}°`, { icon: ' Eksiği var', duration: 2000 });
    }
  }, [showResult, correctRotation, difficulty, currentUser]); // currentUser bağımlılığı eklendi


  // --- Efektler ---
  // Kullanıcı Giriş Kontrolü
  useEffect(() => {
    if (!userLoading && !currentUser) {
      toast.error("Bu sayfayı görmek için giriş yapmalısınız.");
      navigate('/login', { replace: true });
    }
  }, [currentUser, userLoading, navigate]);

  // İlk Yükleme ve Zorluk Değişikliği
  useEffect(() => {
    if (!userLoading && !xpLoading && currentUser) {
      handleNewGame();
    }
  }, [difficulty, userLoading, xpLoading, currentUser, handleNewGame]); // handleNewGame eklendi


  // --- Yükleme ve Erişim Kontrolleri Render ---
   if (userLoading || xpLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        );
    }
    if (!currentUser) return null; // Yönlendirme için bekle
    if (!hasEnoughXP) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <XPWarning requiredXP={requiredXP} currentXP={userXP} title="Döndürme Oyunu İçin Gereken XP" />
          </div>
        );
    }


  // --- Ana Render ---
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 max-w-5xl">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Zihinsel Döndürme Oyunu
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Sağdaki şeklin sola göre kaç derece döndürüldüğünü bulun.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Zorluk ve Skor */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-center gap-2">
              {(['Kolay', 'Orta', 'Zor'] as const).map((diff) => (
                <Button
                  key={diff}
                  variant={difficulty === diff ? 'default' : 'outline'}
                  onClick={() => {
                      if(difficulty !== diff) setDifficulty(diff);
                  }}
                   className={cn("font-medium text-sm py-1 px-3", difficulty === diff && 'bg-blue-600 hover:bg-blue-700')}
                >
                  {diff}
                </Button>
              ))}
            </div>
            <div className="text-lg font-semibold text-emerald-600">
              Skor: {score}
            </div>
          </div>

          {/* Şekil Gösterim Alanı */}
          {currentShape && (
             <AnimatePresence mode="wait">
                <motion.div
                  key={roundKey} // Yeni şekil geldiğinde animasyonla değişsin
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center"
                >
                   {/* Orijinal Şekil */}
                    <div className="flex flex-col items-center p-4 border rounded-lg bg-white shadow-sm">
                        <span className="text-sm font-medium text-gray-500 mb-2">Orijinal</span>
                        <svg width="180" height="180" viewBox="0 0 100 100" className="overflow-visible">
                            <path d={currentShape.svgPath} fill="currentColor" className="text-blue-500" />
                        </svg>
                    </div>
                    {/* Döndürülmüş Şekil */}
                    <div className="flex flex-col items-center p-4 border rounded-lg bg-white shadow-sm">
                       <span className="text-sm font-medium text-gray-500 mb-2">Döndürülmüş (?)</span>
                       <svg width="180" height="180" viewBox="0 0 100 100" className="overflow-visible">
                           {/* G elementi ile merkez etrafında döndür */}
                           <g transform={`rotate(${correctRotation} 50 50)`}>
                               <path d={currentShape.svgPath} fill="currentColor" className="text-blue-500" />
                           </g>
                       </svg>
                    </div>
                </motion.div>
              </AnimatePresence>
          )}

          {/* Seçenekler */}
          <div className="pt-4">
            <h3 className="text-center text-lg font-semibold mb-4 text-gray-700">Kaç Derece Döndürüldü?</h3>
            <motion.div
                key={roundKey + '-options'} // Yeni turda seçenekler de animasyonla gelsin
                initial={{ opacity: 0 }}
                animate={{ opacity: 1}}
                transition={{ delay: 0.2, staggerChildren: 0.05 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              {options.map((rotation) => {
                  const isTheCorrect = rotation === correctRotation;
                  const isSelected = selectedAnswer === rotation;
                  let icon = null;

                  if (showResult) {
                      if (isTheCorrect) {
                          // Doğru cevap
                          icon = <Check className="w-4 h-4 mr-2 text-green-600"/>;
                      } else if (isSelected) {
                          // Seçilen yanlış cevap
                          icon = <X className="w-4 h-4 mr-2"/>;
                      }
                  }

                  return (
                    <motion.button
                      key={rotation}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleAnswer(rotation)}
                      disabled={showResult}
                      className={cn(
                          "flex items-center justify-center text-lg font-medium p-4 rounded-lg border-2 transition-all duration-200",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                          showResult ? (
                              isTheCorrect ? "border-green-500 bg-green-50 text-green-800 scale-105 shadow" :
                              isSelected ? "border-red-500 bg-red-50 text-red-800" :
                              "border-gray-300 bg-gray-50 text-gray-500"
                          ) : "border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-500 hover:shadow-sm"
                      )}
                    >
                      {icon}
                      {rotation}°
                    </motion.button>
                  );
              })}
            </motion.div>
          </div>

          {/* Yeni Soru Butonu */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-6"
              >
                <Button
                  onClick={handleNewGame}
                  disabled={false}
                  className="px-8 py-3 text-lg font-semibold"
                >
                  <RotateCcw className="w-6 h-6 mr-2"/>
                   Yeni Soru
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

        </CardContent>
      </Card>
    </div>
  );
};

export default RotationGamePage;