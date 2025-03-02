import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Shape {
  id: number;
  name: string;
  type: 'üçgen' | 'dörtgen' | 'beşgen' | 'altıgen' | 'daire';
  properties: string[];
  svgPath: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
}

const shapes: Shape[] = [
  {
    id: 1,
    name: 'Eşkenar Üçgen',
    type: 'üçgen',
    properties: ['3 kenar', '3 açı', 'Tüm kenarlar eşit', 'Tüm açılar 60°'],
    svgPath: 'M50 10 L90 80 L10 80 Z',
    difficulty: 'Kolay'
  },
  {
    id: 2,
    name: 'Kare',
    type: 'dörtgen',
    properties: ['4 kenar', '4 açı', 'Tüm kenarlar eşit', 'Tüm açılar 90°'],
    svgPath: 'M20 20 H80 V80 H20 Z',
    difficulty: 'Kolay'
  },
  {
    id: 3,
    name: 'Dikdörtgen',
    type: 'dörtgen',
    properties: ['4 kenar', '4 açı', 'Karşılıklı kenarlar eşit', 'Tüm açılar 90°'],
    svgPath: 'M10 30 H90 V70 H10 Z',
    difficulty: 'Kolay'
  },
  {
    id: 4,
    name: 'Düzgün Beşgen',
    type: 'beşgen',
    properties: ['5 kenar', '5 açı', 'Tüm kenarlar eşit', 'Tüm açılar 108°'],
    svgPath: 'M50 10 L90 40 L80 90 L20 90 L10 40 Z',
    difficulty: 'Orta'
  },
  {
    id: 5,
    name: 'Düzgün Altıgen',
    type: 'altıgen',
    properties: ['6 kenar', '6 açı', 'Tüm kenarlar eşit', 'Tüm açılar 120°'],
    svgPath: 'M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z',
    difficulty: 'Orta'
  },
  {
    id: 6,
    name: 'Daire',
    type: 'daire',
    properties: ['Sonsuz kenar', 'Merkeze olan uzaklıklar eşit', '360°'],
    svgPath: 'M50 10 A40 40 0 1 1 50 90 A40 40 0 1 1 50 10',
    difficulty: 'Kolay'
  },
  {
    id: 7,
    name: 'İkizkenar Üçgen',
    type: 'üçgen',
    properties: ['3 kenar', '3 açı', '2 kenar eşit', '2 açı eşit'],
    svgPath: 'M50 10 L80 80 L20 80 Z',
    difficulty: 'Orta'
  },
  {
    id: 8,
    name: 'Paralelkenar',
    type: 'dörtgen',
    properties: ['4 kenar', '4 açı', 'Karşılıklı kenarlar paralel', 'Karşılıklı açılar eşit'],
    svgPath: 'M30 30 L80 30 L70 70 L20 70 Z',
    difficulty: 'Zor'
  },
  {
    id: 9,
    name: 'Yamuk',
    type: 'dörtgen',
    properties: ['4 kenar', '4 açı', 'İki kenar paralel'],
    svgPath: 'M30 30 L70 30 L80 70 L20 70 Z',
    difficulty: 'Zor'
  }
];

const ShapeGamePage: React.FC = () => {
  const { user } = useAuth();
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [difficulty, setDifficulty] = useState<'Kolay' | 'Orta' | 'Zor'>('Kolay');
  const [gameMode, setGameMode] = useState<'name' | 'type' | 'properties'>('name');

  const getRandomShape = (diff: 'Kolay' | 'Orta' | 'Zor') => {
    const filteredShapes = shapes.filter(s => s.difficulty === diff);
    return filteredShapes[Math.floor(Math.random() * filteredShapes.length)];
  };

  const generateOptions = (shape: Shape) => {
    let allOptions: string[] = [];
    let correctAnswer = '';

    switch (gameMode) {
      case 'name':
        allOptions = shapes.map(s => s.name);
        correctAnswer = shape.name;
        break;
      case 'type':
        allOptions = Array.from(new Set(shapes.map(s => s.type)));
        correctAnswer = shape.type;
        break;
      case 'properties':
        allOptions = Array.from(new Set(shapes.flatMap(s => s.properties)));
        correctAnswer = shape.properties[Math.floor(Math.random() * shape.properties.length)];
        break;
    }

    // Doğru cevabı ve 3 rastgele yanlış cevabı seç
    const wrongOptions = allOptions
      .filter(opt => opt !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
  };

  const handleNewGame = () => {
    const shape = getRandomShape(difficulty);
    setCurrentShape(shape);
    setOptions(generateOptions(shape));
    setShowResult(false);
    setMessage('');
  };

  const handleAnswer = async (answer: string) => {
    if (!currentShape) return;

    let isCorrect = false;
    switch (gameMode) {
      case 'name':
        isCorrect = answer === currentShape.name;
        break;
      case 'type':
        isCorrect = answer === currentShape.type;
        break;
      case 'properties':
        isCorrect = currentShape.properties.includes(answer);
        break;
    }

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
      setMessage('Yanlış! Tekrar deneyin.');
    }
  };

  useEffect(() => {
    handleNewGame();
  }, [difficulty, gameMode]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Geometrik Şekiller</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Nasıl Oynanır?</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Ekranda gösterilen şekli inceleyin</li>
            <li>Şeklin adını, türünü veya özelliklerini tahmin edin</li>
            <li>Doğru cevabı seçin ve puanları toplayın</li>
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

        <div className="flex justify-center gap-4 mb-6">
          {([
            { id: 'name', label: 'Şekil Adı' },
            { id: 'type', label: 'Şekil Türü' },
            { id: 'properties', label: 'Özellikler' }
          ] as const).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setGameMode(mode.id)}
              className={`px-4 py-2 rounded-lg font-medium ${
                gameMode === mode.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {currentShape && (
          <div className="bg-gray-100 rounded-xl p-8 mb-6 flex justify-center">
            <svg
              width="200"
              height="200"
              viewBox="0 0 100 100"
              className="transform scale-150"
            >
              <path
                d={currentShape.svgPath}
                fill="none"
                stroke="#4299e1"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className="px-6 py-3 bg-white border-2 border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              {option}
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

export default ShapeGamePage;
