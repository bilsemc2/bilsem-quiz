import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Shape {
  id: number;
  name: string;
  svgPath: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
}

const shapes: Shape[] = [
  {
    id: 1,
    name: 'L Şekli',
    svgPath: 'M30 20 H50 V60 H70 V80 H30 Z',
    difficulty: 'Kolay'
  },
  {
    id: 2,
    name: 'Ok',
    svgPath: 'M50 20 L70 40 L60 40 L60 80 L40 80 L40 40 L30 40 Z',
    difficulty: 'Kolay'
  },
  {
    id: 3,
    name: 'Yıldız',
    svgPath: 'M50 20 L61 44 L87 44 L65 59 L74 83 L50 68 L26 83 L35 59 L13 44 L39 44 Z',
    difficulty: 'Orta'
  },
  {
    id: 4,
    name: 'Kalp',
    svgPath: 'M50 30 Q30 10 10 30 T50 70 Q70 50 90 30 T50 30',
    difficulty: 'Orta'
  },
  {
    id: 5,
    name: 'Karmaşık Şekil',
    svgPath: 'M30 20 H70 L80 40 L60 60 H40 L20 40 Z',
    difficulty: 'Zor'
  }
];

const RotationGamePage: React.FC = () => {
  const { user } = useAuth();
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [difficulty, setDifficulty] = useState<'Kolay' | 'Orta' | 'Zor'>('Kolay');
  const [correctRotation, setCorrectRotation] = useState(0);

  const getRandomShape = (diff: 'Kolay' | 'Orta' | 'Zor') => {
    const filteredShapes = shapes.filter(s => s.difficulty === diff);
    return filteredShapes[Math.floor(Math.random() * filteredShapes.length)];
  };

  const generateRotationOptions = () => {
    // Doğru rotasyon açısını belirle (45'in katları)
    const correct = Math.floor(Math.random() * 8) * 45;
    setCorrectRotation(correct);

    // 3 yanlış rotasyon açısı oluştur
    const wrongOptions = Array.from({ length: 8 }, (_, i) => i * 45)
      .filter(angle => angle !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return [correct, ...wrongOptions].sort(() => Math.random() - 0.5);
  };

  const handleNewGame = () => {
    const shape = getRandomShape(difficulty);
    setCurrentShape(shape);
    setOptions(generateRotationOptions());
    setShowResult(false);
    setMessage('');
  };

  const handleAnswer = async (rotation: number) => {
    if (!currentShape) return;

    const isCorrect = rotation === correctRotation;
    setShowResult(true);

    let points = 0;
    if (isCorrect) {
      switch (difficulty) {
        case 'Kolay':
          points = 10;
          break;
        case 'Orta':
          points = 20;
          break;
        case 'Zor':
          points = 30;
          break;
      }
      setScore(prev => prev + points);
      setMessage(`Doğru! ${points} puan kazandınız.`);

      if (user) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('points, xp')
          .eq('id', user.id)
          .single();

        if (userData) {
          await supabase
            .from('profiles')
            .update({
              points: userData.points + points,
              xp: userData.xp + Math.floor(points * 0.1)
            })
            .eq('id', user.id);
        }
      }
    } else {
      setMessage(`Yanlış! Doğru açı: ${correctRotation}°`);
    }
  };

  useEffect(() => {
    handleNewGame();
  }, [difficulty]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Döndürme Oyunu</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Nasıl Oynanır?</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Soldaki şekil referans şeklidir</li>
            <li>Sağdaki şeklin kaç derece döndürüldüğünü bulun</li>
            <li>Döndürme açısını seçin ve puanları toplayın</li>
            <li>Açılar saat yönünde 45°'nin katları şeklindedir</li>
          </ul>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {(['Kolay', 'Orta', 'Zor'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`px-4 py-2 rounded-lg font-medium ${
                difficulty === diff
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        {currentShape && (
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Orijinal şekil */}
            <div className="bg-gray-100 rounded-xl p-8 flex justify-center items-center">
              <svg
                width="200"
                height="200"
                viewBox="0 0 100 100"
                className="transform scale-150"
              >
                <path
                  d={currentShape.svgPath}
                  fill="#4299e1"
                  stroke="#2b6cb0"
                  strokeWidth="1"
                />
              </svg>
            </div>

            {/* Döndürülmüş şekil */}
            <div className="bg-gray-100 rounded-xl p-8 flex justify-center items-center">
              <svg
                width="200"
                height="200"
                viewBox="0 0 100 100"
                className="transform scale-150"
              >
                <g transform={`rotate(${correctRotation} 50 50)`}>
                  <path
                    d={currentShape.svgPath}
                    fill="#4299e1"
                    stroke="#2b6cb0"
                    strokeWidth="1"
                  />
                </g>
              </svg>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((rotation, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(rotation)}
              disabled={showResult}
              className="px-6 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              {rotation}°
            </button>
          ))}
        </div>

        {message && (
          <div
            className={`text-center p-3 rounded-lg mb-4 ${
              message.includes('Doğru') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={handleNewGame}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Yeni Soru
          </button>
          <div className="text-xl font-semibold py-2">
            Toplam Puan: {score}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RotationGamePage;
