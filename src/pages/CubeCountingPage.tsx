import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges, Bounds, useBounds } from '@react-three/drei';
// import { supabase } from '@/lib/supabase'; // Supabase importuna artık gerek yok (eğer hooklar kullanmıyorsa)
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import { useUser } from '../hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Cube Bileşeni (Aynı kalabilir) ---
interface CubeProps {
  position: [number, number, number];
  color?: string;
}

const Cube: React.FC<CubeProps> = ({ position, color = '#60a5fa' /* blue-400 */ }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      <Edges scale={1} threshold={15} color="white" />
    </mesh>
  );
};

// --- Yapı Arayüzü (Aynı kalabilir) ---
interface CubeStructure {
  cubes: [number, number, number][];
  answer: number;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
}

// --- Yardımcı Fonksiyonlar (Aynı kalabilir) ---
const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// --- Yapı Üretici Fonksiyon (Aynı kalabilir) ---
const generateRandomStructure = (difficulty: 'Kolay' | 'Orta' | 'Zor'): CubeStructure => {
    let maxCubes: number;
    let maxSize: number;
    let use3D: boolean;

    switch (difficulty) {
        case 'Kolay': maxCubes = 5; maxSize = 1; use3D = false; break;
        case 'Orta': maxCubes = 8; maxSize = 2; use3D = true; break;
        case 'Zor': default: maxCubes = 12; maxSize = 2; use3D = true; break;
    }

    const cubes: [number, number, number][] = [];
    const usedPositions = new Set<string>();
    const queue: [number, number, number][] = [];
    const startPos: [number, number, number] = [0, 0, 0];
    cubes.push(startPos); usedPositions.add(startPos.join(',')); queue.push(startPos);
    const targetCubeCount = getRandomInt(3, maxCubes);

    while (cubes.length < targetCubeCount && queue.length > 0) {
        const queueIndex = Math.floor(Math.random() * queue.length);
        const [bx, by, bz] = queue.splice(queueIndex, 1)[0];
        const baseDirections: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
        const zDirections: [number, number, number][] = [[0, 0, 1], [0, 0, -1]];
        const directions = shuffleArray([...baseDirections, ...(use3D ? zDirections : [])]);

        for (const dir of directions) {
            if (cubes.length >= targetCubeCount) break;
            const newPos: [number, number, number] = [bx + dir[0], by + dir[1], bz + dir[2]];
            const posKey = newPos.join(',');
            if (Math.abs(newPos[0]) <= maxSize && Math.abs(newPos[1]) <= maxSize && Math.abs(newPos[2]) <= maxSize && !usedPositions.has(posKey)) {
                 if(Math.random() < 0.75 || cubes.length < 3) {
                    cubes.push(newPos); usedPositions.add(posKey); queue.push(newPos);
                 }
            }
        }
         if (queue.length === 0 && cubes.length < targetCubeCount && cubes.length > 0) {
             queue.push(cubes[Math.floor(Math.random() * cubes.length)]);
         }
    }
    return { cubes, answer: cubes.length, difficulty };
};

// --- Bounds Ayarlayıcı Bileşen (Aynı kalabilir) ---
const FitCameraToBounds: React.FC<{ children: React.ReactNode; fitKey: any }> = ({ children, fitKey }) => {
  const bounds = useBounds();
  useEffect(() => {
    if (bounds.refresh) {
        bounds.refresh().clip().fit();
    }
  }, [fitKey, bounds]);
  return <>{children}</>;
};


// --- Ana Sayfa Bileşeni ---
const CubeCountingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);

  const [difficulty, setDifficulty] = useState<'Kolay' | 'Orta' | 'Zor'>('Kolay');
  const [currentStructure, setCurrentStructure] = useState<CubeStructure | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  // const [score, setScore] = useState<number>(0); // SKOR STATE'İ KALDIRILDI
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Sadece görsel disable için
  const [roundKey, setRoundKey] = useState(0);

  // Yeni Oyun Başlatma
  const handleNewGame = useCallback(() => {
    setShowResult(false);
    setMessage('');
    setUserAnswer('');
    const newStructure = generateRandomStructure(difficulty);
    setCurrentStructure(newStructure);
    setRoundKey(prev => prev + 1);
  }, [difficulty]);

  // İlk Yükleme ve Zorluk Değişikliği için Effect
  useEffect(() => {
    if (!userLoading && !xpLoading && currentUser) {
        handleNewGame();
    }
  }, [difficulty, userLoading, xpLoading, currentUser, handleNewGame]);


  // Cevap Kontrolü (Puanlama ve Supabase olmadan)
  const handleSubmit = async () => { // async artık gerekli değil ama kalabilir
    if (!currentStructure || userAnswer === '') return;
    setIsSubmitting(true); // Butonları disable etmek için kullanılabilir

    const answerNumber = parseInt(userAnswer);
    const isCorrect = answerNumber === currentStructure.answer;
    setShowResult(true);

    if (isCorrect) {
      // PUAN HESAPLAMA VE score STATE GÜNCELLEMESİ KALDIRILDI
      setMessage(`Doğru!`); // Sadece doğru mesajı
      toast.success(`Doğru!`, { icon: '🎉' });

      // SUPABASE GÜNCELLEME BLOĞU KALDIRILDI

    } else {
      setMessage(`Yanlış! Doğru cevap: ${currentStructure.answer}`);
      toast.error(`Yanlış! Doğru Cevap: ${currentStructure.answer}`);
    }
    setIsSubmitting(false); // Butonları tekrar aktif et
  };

  // Kullanıcı kontrolü ve yönlendirme
  useEffect(() => {
    if (!userLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, userLoading, navigate]);

  // --- Render Koşulları ---
   if (userLoading || xpLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        );
    }
    if (!currentUser) return null;
    if (!hasEnoughXP) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <XPWarning requiredXP={requiredXP} currentXP={userXP} title="Küp Sayma Oyunu İçin Gereken XP" />
          </div>
        );
    }

  // --- Ana Render ---
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Küp Sayma Oyunu</h1>

        {/* Talimatlar ve Zorluk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-700">Nasıl Oynanır?</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Ekranda görünen yapıdaki küpleri sayın.</li>
                <li>Fare ile yapıyı döndürerek her açıdan bakın.</li>
                <li>Tahmininizi girip "Kontrol Et" butonuna basın.</li>
              </ul>
            </div>
             <div className="bg-white rounded-xl shadow-lg p-6">
                 <h2 className="text-xl font-semibold mb-3 text-gray-700">Zorluk Seçimi</h2>
                 <div className="flex justify-center gap-3">
                  {(['Kolay', 'Orta', 'Zor'] as const).map((diff) => (
                    <Button
                      key={diff}
                      variant={difficulty === diff ? 'default' : 'outline'}
                      onClick={() => {
                          if(difficulty !== diff) setDifficulty(diff);
                      }}
                      className={`font-medium ${difficulty === diff ? 'bg-blue-600 hover:bg-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                    {difficulty === 'Kolay' && 'Basit 2D yapılar (3-5 küp)'}
                    {difficulty === 'Orta' && 'Orta karmaşık 3D yapılar (3-8 küp)'}
                    {difficulty === 'Zor' && 'Daha karmaşık 3D yapılar (3-12 küp)'}
                </p>
             </div>
        </div>

        {/* 3D Canvas Alanı (Aynı kalabilir) */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-2 mb-6 shadow-xl" style={{ height: '450px' }}>
          {!currentStructure ? (
             <div className="w-full h-full flex justify-center items-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
          ) : (
            <Canvas camera={{ position: [0, 0, 10], fov: 50 }} shadows>
              <ambientLight intensity={0.8} />
              <directionalLight position={[5, 10, 7]} intensity={1.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
              <directionalLight position={[-5, -5, -5]} intensity={0.3} />
              <Suspense fallback={null}>
                 <Bounds fit clip observe margin={1.2}>
                    <FitCameraToBounds fitKey={roundKey}>
                        <group>
                            {currentStructure.cubes.map((pos, index) => (
                              <Cube key={index} position={pos} />
                            ))}
                        </group>
                    </FitCameraToBounds>
                  </Bounds>
              </Suspense>
              <OrbitControls />
            </Canvas>
          )}
        </div>

        {/* Cevap Alanı */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-3 items-center">
            <Input
              type="number"
              value={userAnswer}
              onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setUserAnswer(val);
              }}
              placeholder="Küp sayısı?"
              className="w-36 text-center text-lg"
              disabled={showResult || isSubmitting}
              min="1"
            />
            <Button
              onClick={handleSubmit}
              disabled={!userAnswer || userAnswer === '0' || showResult || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kontrol Et'}
            </Button>
            <Button
              onClick={handleNewGame}
              variant="outline" // "Yeni Yapı" butonu için stil değişikliği
              className="min-w-[120px]"
              disabled={isSubmitting}
            >
               <RotateCcw className="w-5 h-5 mr-2"/> Yeni Yapı
            </Button>
          </div>

          {/* Sonuç Mesajı */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-center p-3 rounded-lg font-medium text-md ${
                  // Mesajın içeriğine göre değil, cevabın doğruluğuna göre stil belirle (isCorrect lazım ama yok)
                  // Bu yüzden, mesajın varlığına göre basit bir stil verelim veya doğru/yanlış bilgisini mesajda tutalım.
                  // Şimdilik, sadece mesajı gösterelim. Renklendirme için isCorrect state'i geri eklenebilir veya mesaj içeriği kontrol edilebilir.
                   message.startsWith('Doğru') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOPLAM PUAN GÖSTERİMİ KALDIRILDI */}
          {/*
          <div className="text-xl font-semibold mt-2">
            Toplam Puan: {score}
          </div>
          */}
        </div>
      </div>
    </div>
  );
};

export default CubeCountingPage;