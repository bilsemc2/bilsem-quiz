import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button'; // shadcn/ui veya benzeri varsayılıyor

// --- Ayarlar ve Sabitler ---
const VIEWBOX_SIZE = 100; // SVG görüntüleme alanı boyutu
const TOTAL_OPTIONS = 4; // Toplam seçenek sayısı (1 doğru ayna + 3 çeldirici)
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#F6EFA6', '#F8AFA6', '#A2D2FF', '#B0E0E6', '#DDA0DD']; // Renk paleti
const SHAPE_COUNT_MIN = 3; // Bir SVG'deki minimum şekil sayısı
const SHAPE_COUNT_MAX = 6; // Bir SVG'deki maksimum şekil sayısı
const NEW_ROUND_DELAY = 150; // Yeni tur yüklenirken görsel gecikme (ms)

// --- Tipler ---
interface SvgShape {
  id: string;
  type: 'path' | 'circle' | 'rect' | 'polygon';
  attributes: {
    [key: string]: string | number | undefined;
  };
}

interface GameOption {
  id: string;
  svgData: SvgShape[];
  isMirror: boolean;
}

// --- Yardımcı Fonksiyonlar ---
const getRandom = (min: number, max: number): number => Math.random() * (max - min) + min;
const getRandomInt = (min: number, max: number): number => Math.floor(getRandom(min, max + 1));
const getRandomColor = (): string => COLORS[Math.floor(Math.random() * COLORS.length)];
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- Soyut SVG Üretici Fonksiyon ---
const generateAbstractSVGData = (): SvgShape[] => {
  const shapes: SvgShape[] = [];
  const numShapes = getRandomInt(SHAPE_COUNT_MIN, SHAPE_COUNT_MAX);

  for (let i = 0; i < numShapes; i++) {
    const shapeType = ['path', 'circle', 'rect', 'polygon'][getRandomInt(0, 3)];
    const strokeColor = getRandomColor();
    const fillColor = Math.random() < 0.4 ? getRandomColor() : 'none';
    const strokeWidth = getRandom(1.5, 4);
    const centerX = VIEWBOX_SIZE / 2 + getRandom(-15, 15);
    const centerY = VIEWBOX_SIZE / 2 + getRandom(-15, 15);
    const rotation = getRandomInt(0, 359);
    const transform = `rotate(${rotation} ${centerX} ${centerY})`;
    const id = `shape-${crypto.randomUUID()}`;

    let attributes: { [key: string]: string | number | undefined } = {
       stroke: strokeColor,
       'stroke-width': strokeWidth,
       fill: fillColor,
       transform: transform,
       opacity: getRandom(0.75, 1),
       'stroke-linecap': 'round',
       'stroke-linejoin': 'round',
    };

    switch (shapeType) {
      case 'path':
        const x1 = getRandom(5, 45); const y1 = getRandom(5, 95);
        const x2 = getRandom(55, 95); const y2 = getRandom(5, 95);
        const cx1 = getRandom(10, 90); const cy1 = getRandom(10, 90);
        const cx2 = getRandom(10, 90); const cy2 = getRandom(10, 90);
        attributes.d = `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
        attributes.fill = 'none';
        break;
      case 'circle':
        attributes = { ...attributes, cx: getRandom(15, 85), cy: getRandom(15, 85), r: getRandom(6, 28) };
        break;
      case 'rect':
         attributes = { ...attributes, x: getRandom(10, 70), y: getRandom(10, 70), width: getRandom(15, 50), height: getRandom(15, 50), rx: `${getRandomInt(0,8)}` };
        break;
       case 'polygon':
         const points: string[] = [];
         const numPoints = getRandomInt(3, 7);
         const polyRadius = getRandom(18, 45);
         const polyCenterX = getRandom(20, 80);
         const polyCenterY = getRandom(20, 80);
         for (let j = 0; j < numPoints; j++) {
           const angle = (j * (360 / numPoints) + getRandom(-20, 20)) * Math.PI / 180;
           const radiusVariation = getRandom(0.75, 1.25);
           const px = polyCenterX + Math.cos(angle) * polyRadius * radiusVariation;
           const py = polyCenterY + Math.sin(angle) * polyRadius * radiusVariation;
           points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
         }
         attributes.points = points.join(' ');
         break;
    }
    shapes.push({ id, type: shapeType as any, attributes });
  }
  return shuffleArray(shapes);
};

// --- SVG Şekil Render Bileşeni (Optimize Edilmiş) ---
const RenderSvgShapes: React.FC<{ svgData: SvgShape[], elementIdPrefix: string }> = React.memo(({ svgData, elementIdPrefix }) => {
  if (!svgData || svgData.length === 0) return null;
  return (
    <>
      {svgData.map((shape) => {
        const SvgElement = shape.type;
        return <SvgElement key={`${elementIdPrefix}-${shape.id}`} {...shape.attributes} />;
      })}
    </>
  );
});
RenderSvgShapes.displayName = 'RenderSvgShapes';

// --- Ana Oyun Bileşeni ---
const GenerativeMirrorGame: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [targetSvgData, setTargetSvgData] = useState<SvgShape[]>([]);
  const [options, setOptions] = useState<GameOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  // const [isCorrect, setIsCorrect] = useState<boolean | null>(null); // BU STATE GEREKSIZ, KALDIRILDI
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);

  // Yeni Tur Yükleme Fonksiyonu
  const loadNewRound = useCallback(() => {
    setIsLoading(true);
    setSelectedOptionId(null);
    setIsAnswered(false);
    // isCorrect state'i olmadigi icin sifirlamaya gerek yok

    setTimeout(() => {
        try {
            const allGeneratedData: SvgShape[][] = Array.from({ length: TOTAL_OPTIONS }, () => generateAbstractSVGData());
            const newTargetData = allGeneratedData[0];
            setTargetSvgData(newTargetData);

            const correctOption: GameOption = { id: crypto.randomUUID(), svgData: newTargetData, isMirror: true };
            const wrongOptions: GameOption[] = allGeneratedData.slice(1).map(data => ({ id: crypto.randomUUID(), svgData: data, isMirror: false }));

            setOptions(shuffleArray([correctOption, ...wrongOptions]));
            setRound(prev => prev + 1);
        } catch (error) {
            console.error("Yeni tur yüklenirken hata:", error);
            toast.error("Yeni şekiller üretilirken bir sorun oluştu.");
        } finally {
            setIsLoading(false);
        }
    }, NEW_ROUND_DELAY);
  }, []); // Dış bağımlılığı yok

  // İlk Turu Yükle
  useEffect(() => {
    loadNewRound();
  }, [loadNewRound]);

  // Cevap Kontrolü
  const handleAnswer = (selected: GameOption) => {
    if (isAnswered || isLoading) return;

    setIsAnswered(true);
    setSelectedOptionId(selected.id);
    const correct = selected.isMirror; // Doğruluğu yerel olarak al

    if (correct) {
      setScore(prev => prev + 10);
      toast.success('Doğru! Ayna görüntüsünü buldunuz.', { icon: '🥳', duration: 2000 });
    } else {
      toast.error('Yanlış seçim.', { icon: '😕', duration: 2000 });
    }
    // setIsCorrect(correct); // BU SATIR KALDIRILDI
  };

  // --- Render ---
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 space-y-6 max-w-6xl">
      {/* Başlık ve Skor */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-md sticky top-2 z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-2 sm:mb-0">
          Üretken Ayna Oyunu
        </h1>
        <div className="flex gap-3 sm:gap-4 text-md sm:text-lg">
          <span>Tur: <span className="font-bold text-indigo-600">{round}</span></span>
          <span>Skor: <span className="font-bold text-emerald-600">{score}</span></span>
        </div>
      </div>

      {/* Oyun Alanı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">

        {/* Hedef Alanı */}
        <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">Hedef Şekil</h2>
          <div className="flex justify-center items-center min-h-[240px] sm:min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                 key={round}
                 initial={{ opacity: 0, scale: 0.7 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.7 }}
                 transition={{ duration: 0.4, ease: "easeOut" }}
                 className="flex items-center justify-center w-[200px] h-[200px] sm:w-[250px] sm:h-[250px]"
              >
                 {isLoading && round > 0 ? (
                    <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 animate-spin" />
                 ) : (
                    <svg preserveAspectRatio="xMidYMid meet" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="bg-white shadow-md rounded-md overflow-hidden w-full h-full">
                        <RenderSvgShapes svgData={targetSvgData} elementIdPrefix="target" />
                    </svg>
                 )}
               </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Seçenekler Alanı */}
        <div className="space-y-4">
           <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center text-gray-700">Ayna Görüntüsünü Seçin</h2>
           {isLoading && round > 0 ? (
             <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
             </div>
            ) : (
             <motion.div className={`grid grid-cols-2 gap-3 sm:gap-4`} >
                {options.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  const isTheCorrectAnswer = option.isMirror;
                  let borderClass = 'border-gray-300';
                  let overlayIcon = null;
                  let buttonOpacity = 'opacity-100';

                  if (isAnswered) {
                    if (isTheCorrectAnswer) {
                      borderClass = 'border-green-500 border-[3px] sm:border-4 scale-105 shadow-lg';
                      overlayIcon = <CheckCircle className="absolute top-1 right-1 w-5 h-5 text-white bg-green-500 rounded-full p-0.5 shadow" />;
                    } else if (isSelected) {
                      borderClass = 'border-red-500 border-[3px] sm:border-4 scale-95';
                      overlayIcon = <XCircle className="absolute top-1 right-1 w-5 h-5 text-white bg-red-500 rounded-full p-0.5 shadow" />;
                      buttonOpacity = 'opacity-70';
                    } else {
                      borderClass = 'border-gray-300';
                      buttonOpacity = 'opacity-50'; // Diğer yanlışları en çok soluklaştır
                    }
                  }

                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <button
                        onClick={() => handleAnswer(option)}
                        disabled={isAnswered || isLoading}
                        className={`block w-full p-1 bg-white rounded-lg shadow-sm transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${borderClass} ${buttonOpacity} ${!isAnswered && !isLoading ? 'hover:border-blue-500 hover:shadow-md hover:scale-105' : 'cursor-not-allowed'}`}
                        aria-label={`Seçenek ${option.id.substring(0, 4)}`}
                      >
                         <svg preserveAspectRatio="xMidYMid meet" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className={`transition-transform duration-300 ease-in-out ${
                            option.isMirror ? 'transform scale-x-[-1]' : '' // Aynalama
                        }`}>
                           <RenderSvgShapes svgData={option.svgData} elementIdPrefix={`option-${option.id.substring(0,4)}`} />
                         </svg>
                         {isAnswered && overlayIcon}
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
        </div>
      </div>

      {/* Sonraki Tur Butonu */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-6"
          >
            {/* Button'dan 'size' prop'u KALDIRILDI */}
            <Button
              onClick={loadNewRound}
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 rounded-full text-lg font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-wait"
            >
              {isLoading ? (
                  <Loader2 className="w-6 h-6 mr-2 animate-spin"/>
              ) : (
                  <RotateCcw className="w-6 h-6 mr-2"/>
              )}
              Sonraki Tur
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GenerativeMirrorGame;