import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import { useUser } from '../hooks/useUser';
import * as THREE from 'three';

interface CubeProps {
  position: [number, number, number];
  color?: string;
}

const Cube: React.FC<CubeProps> = ({ position, color = '#4299e1' }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="white" linewidth={2} />
      </lineSegments>
    </group>
  );
};

interface CubeStructure {
  cubes: [number, number, number][];
  answer: number;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
}

// Rastgele küp yapısı oluşturan fonksiyon
const generateRandomStructure = (difficulty: 'Kolay' | 'Orta' | 'Zor'): CubeStructure => {
  let maxCubes: number;
  let maxSize: number;
  let use3D: boolean;

  // Zorluk seviyesine göre parametreleri ayarla
  switch (difficulty) {
    case 'Kolay':
      maxCubes = 5;
      maxSize = 2;
      use3D = false;
      break;
    case 'Orta':
      maxCubes = 8;
      maxSize = 3;
      use3D = true;
      break;
    case 'Zor':
      maxCubes = 12;
      maxSize = 4;
      use3D = true;
      break;
  }

  const cubes: [number, number, number][] = [];
  const usedPositions = new Set<string>();

  // İlk küpü merkeze yerleştir
  cubes.push([0, 0, 0] as [number, number, number]);
  usedPositions.add('0,0,0');

  // Kalan küpleri rastgele ekle
  const numCubes = Math.floor(Math.random() * (maxCubes - 3)) + 3; // En az 3 küp
  
  while (cubes.length < numCubes) {
    // Mevcut bir küpü seç
    const baseIndex = Math.floor(Math.random() * cubes.length);
    const [bx, by, bz]: [number, number, number] = cubes[baseIndex];

    // Yeni küp için yön seç
    const baseDirections = [
      [1, 0, 0], [-1, 0, 0],   // x ekseni
      [0, 1, 0], [0, -1, 0]    // y ekseni
    ] as const;

    const zDirections = [[0, 0, 1], [0, 0, -1]] as const;  // z ekseni

    const directions = [
      ...baseDirections,
      ...(use3D ? zDirections : [])
    ].map(d => d as [number, number, number]);

    const dirIndex = Math.floor(Math.random() * directions.length);
    const dir: [number, number, number] = directions[dirIndex];
    const newPos = [
      bx + dir[0],
      by + dir[1],
      bz + dir[2]
    ] as [number, number, number];

    // Pozisyon kontrolü
    if (
      Math.abs(newPos[0]) <= maxSize &&
      Math.abs(newPos[1]) <= maxSize &&
      Math.abs(newPos[2]) <= maxSize &&
      !usedPositions.has(newPos.join(','))
    ) {
      cubes.push(newPos as [number, number, number]);
      usedPositions.add(newPos.join(','));
    }
  }

  return {
    cubes,
    answer: cubes.length,
    difficulty
  };
};

const CubeCountingPage: React.FC = () => {
  // Tüm hook'ları en üste taşıyalım
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);
  const [currentStructure, setCurrentStructure] = useState<CubeStructure>({ 
    cubes: [[0, 0, 0] as [number, number, number]], 
    answer: 1, 
    difficulty: 'Kolay' 
  });
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'Kolay' | 'Orta' | 'Zor'>('Kolay');

  // Tüm useEffect'leri en üste taşıyalım
  useEffect(() => {
    if (!userLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, userLoading, navigate]);

  useEffect(() => {
    if (!userLoading && !xpLoading && currentUser) {
      handleNewGame();
    }
  }, [difficulty, userLoading, xpLoading, currentUser]);

  if (!currentUser) {
    return null; // Yönlendirme yapılırken boş ekran göster
  }

  // Yükleniyor durumu
  if (userLoading || xpLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-12 px-4 flex items-center justify-center">
        <div className="text-2xl font-semibold">Yükleniyor...</div>
      </div>
    );
  }

  const handleNewGame = () => {
    setCurrentStructure(generateRandomStructure(difficulty));
    setUserAnswer('');
    setShowResult(false);
    setMessage('');
  };

  const handleSubmit = async () => {
    const isCorrect = parseInt(userAnswer) === currentStructure.answer;
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

      if (currentUser) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('points, xp')
          .eq('id', currentUser.id)
          .single();

        if (userData) {
          await supabase
            .from('profiles')
            .update({
              points: userData.points + points,
              xp: userData.xp + Math.floor(points * 0.1)
            })
            .eq('id', currentUser.id);
        }
      }
    } else {
      setMessage(`Yanlış! Doğru cevap: ${currentStructure.answer}`);
    }
  };

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
          title="Küp Sayma sayfasına erişim için yeterli XP'niz yok"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Küp Sayma Oyunu</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Nasıl Oynanır?</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Ekranda görünen 3 boyutlu yapıdaki küpleri sayın</li>
            <li>Yapıyı döndürerek tüm açılardan inceleyebilirsiniz</li>
            <li>Sayıyı girip "Kontrol Et" butonuna basın</li>
            <li>Doğru cevap verirseniz puan kazanırsınız</li>
          </ul>
          <div className="mt-4 text-sm text-gray-500">
            <p><strong>Zorluk Seviyeleri:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Kolay: 3-5 küp, 2B yapılar</li>
              <li>Orta: 3-8 küp, basit 3B yapılar</li>
              <li>Zor: 3-12 küp, karmaşık 3B yapılar</li>
            </ul>
          </div>
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

        <div className="bg-gray-800 rounded-xl p-4 mb-6" style={{ height: '400px' }}>
          <Canvas camera={{ position: [5, 5, 5] }}>
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <OrbitControls />
            {currentStructure.cubes.map((position, index) => (
              <Cube key={index} position={position} />
            ))}
            <gridHelper args={[10, 10]} />
          </Canvas>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4 items-center">
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Küp sayısını girin"
              className="px-4 py-2 border rounded-lg"
              disabled={showResult}
            />
            <button
              onClick={handleSubmit}
              disabled={!userAnswer || showResult}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Kontrol Et
            </button>
            <button
              onClick={handleNewGame}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Yeni Oyun
            </button>
          </div>

          {message && (
            <div
              className={`text-center p-3 rounded-lg ${
                message.includes('Doğru') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {message}
            </div>
          )}

          <div className="text-xl font-semibold">
            Toplam Puan: {score}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CubeCountingPage;
