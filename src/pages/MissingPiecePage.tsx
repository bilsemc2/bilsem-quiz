import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, Trophy, Star, AlertTriangle, Award, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import RequireAuth from '../components/RequireAuth';

const AdvancedMissingPieceGame = () => {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [gamePattern, setGamePattern] = useState(null);
  const [missingPiece, setMissingPiece] = useState({ x: 0, y: 0, pattern: null });
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const svgSize = 300;
  const pieceSize = 60;

  // Zorluk seviyesine göre ayarlar
  const difficultySettings = {
    easy: {
      shapes: ['circle', 'rect'],
      timeLimit: 30,
      numShapes: 10,
      numOptions: 4
    },
    medium: {
      shapes: ['circle', 'rect', 'polygon', 'path'],
      timeLimit: 25,
      numShapes: 15,
      numOptions: 6
    },
    hard: {
      shapes: ['circle', 'rect', 'polygon', 'path', 'ellipse'],
      timeLimit: 20,
      numShapes: 20,
      numOptions: 8
    }
  };

  // Karmaşık şekil oluşturma
  const generateShape = () => {
    const settings = difficultySettings[difficulty];
    const shapeType = settings.shapes[Math.floor(Math.random() * settings.shapes.length)];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF8B94', '#845EC2', '#D65DB1', '#FF9671'];
    
    const baseShape = {
      type: shapeType,
      x: Math.random() * svgSize * 0.8 + svgSize * 0.1, // Merkeze daha yakın
      y: Math.random() * svgSize * 0.8 + svgSize * 0.1, // Merkeze daha yakın
      size: 30 + Math.random() * 50, // Daha büyük boyutlar
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      opacity: 0.8 + Math.random() * 0.2 // Daha opak
    };

    // Ekstra özellikler ekle
    switch (shapeType) {
      case 'polygon':
        return {
          ...baseShape,
          points: Array(4 + Math.floor(Math.random() * 4)) // Daha fazla köşe
            .fill()
            .map(() => ({
              x: baseShape.x + (Math.random() - 0.5) * baseShape.size * 1.2,
              y: baseShape.y + (Math.random() - 0.5) * baseShape.size * 1.2
            }))
        };
      case 'path':
        const curveSize = baseShape.size * 1.5; // Daha büyük eğriler
        return {
          ...baseShape,
          d: `M ${baseShape.x} ${baseShape.y} 
              q ${Math.random() * curveSize - curveSize/2} ${Math.random() * curveSize - curveSize/2} 
                ${Math.random() * curveSize - curveSize/2} ${Math.random() * curveSize - curveSize/2}
              t ${Math.random() * curveSize - curveSize/2} ${Math.random() * curveSize - curveSize/2}`
        };
      default:
        return baseShape;
    }
  };

  // Desen oluştur
  const generatePattern = () => {
    const settings = difficultySettings[difficulty];
    return Array(settings.numShapes).fill().map(() => generateShape());
  };

  // Zamanlayıcı
  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 6) setShowTimeWarning(true);
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  // Oyunu bitir
  const endGame = () => {
    setIsPlaying(false);
    setShowResult(true);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  // Profil bilgilerini yükle
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('points, experience')
          .eq('id', user.id)
          .single();

        if (!error && profile) {
          setTotalPoints(profile.points || 0);
          setTotalXP(profile.experience || 0);
        }
      }
    };

    loadProfile();
  }, [user]);

  // Bildirim göster
  const showTemporaryNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Şekil çizme
  const renderShape = (shape, index) => {
    const key = `shape-${index}-${shape.type}-${shape.x}-${shape.y}`;
    
    switch (shape.type) {
      case 'circle':
        return (
          <circle
            key={key}
            cx={shape.x}
            cy={shape.y}
            r={shape.size / 2}
            fill={shape.color}
            opacity={shape.opacity}
            transform={`rotate(${shape.rotation} ${shape.x} ${shape.y})`}
          />
        );
      case 'rectangle':
        return (
          <rect
            key={key}
            x={shape.x - shape.size / 2}
            y={shape.y - shape.size / 2}
            width={shape.size}
            height={shape.size}
            fill={shape.color}
            opacity={shape.opacity}
            transform={`rotate(${shape.rotation} ${shape.x} ${shape.y})`}
          />
        );
      case 'polygon':
        return (
          <polygon
            key={key}
            points={shape.points
              .map(point => `${point.x},${point.y}`)
              .join(' ')}
            fill={shape.color}
            opacity={shape.opacity}
            transform={`rotate(${shape.rotation} ${shape.x} ${shape.y})`}
          />
        );
      case 'path':
        return (
          <path
            key={key}
            d={shape.d}
            fill="none"
            stroke={shape.color}
            strokeWidth="3"
            opacity={shape.opacity}
            transform={`rotate(${shape.rotation} ${shape.x} ${shape.y})`}
          />
        );
      case 'ellipse':
        return (
          <ellipse
            key={key}
            cx={shape.x}
            cy={shape.y}
            rx={shape.size / 2}
            ry={shape.size / 3}
            fill={shape.color}
            opacity={shape.opacity}
            transform={`rotate(${shape.rotation} ${shape.x} ${shape.y})`}
          />
        );
      default:
        return null;
    }
  };

  // Yeni oyun başlat
  const startNewGame = () => {
    const settings = difficultySettings[difficulty];
    const newPattern = generatePattern();
    setGamePattern(newPattern);
    
    const x = Math.floor(Math.random() * (svgSize - pieceSize));
    const y = Math.floor(Math.random() * (svgSize - pieceSize));
    
    setMissingPiece({ x, y, pattern: newPattern });
    
    // Yanlış seçenekler için doğru desene benzer ama farklı desenler oluştur
    const createSimilarPattern = (originalPattern, variationLevel) => {
      return originalPattern.map(shape => {
        const variation = variationLevel * (Math.random() * 0.4 + 0.8); // 0.8-1.2 arası rastgele çarpan
        return {
          ...shape,
          // Pozisyonu biraz değiştir
          x: shape.x + (Math.random() - 0.5) * 20 * variation,
          y: shape.y + (Math.random() - 0.5) * 20 * variation,
          // Boyutu biraz değiştir
          size: shape.size * (0.9 + Math.random() * 0.2 * variation),
          // Rotasyonu biraz değiştir
          rotation: shape.rotation + (Math.random() - 0.5) * 45 * variation,
          // Rengi benzer tonda değiştir
          color: adjustColor(shape.color, variation * 20),
          opacity: shape.opacity * (0.9 + Math.random() * 0.2)
        };
      });
    };

    // Rengi benzer tonda değiştirme
    const adjustColor = (hexColor, delta) => {
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      
      const adjustComponent = (component) => {
        const adjusted = component + Math.round((Math.random() - 0.5) * delta);
        return Math.max(0, Math.min(255, adjusted));
      };

      const newR = adjustComponent(r).toString(16).padStart(2, '0');
      const newG = adjustComponent(g).toString(16).padStart(2, '0');
      const newB = adjustComponent(b).toString(16).padStart(2, '0');
      
      return `#${newR}${newG}${newB}`;
    };

    // Seçenekleri oluştur
    const newOptions = [];
    
    // Doğru seçeneği ekle
    const correctOption = { x, y, pattern: newPattern, isCorrect: true };
    newOptions.push(correctOption);
    
    // Yanlış ama benzer seçenekler oluştur
    for (let i = 1; i < settings.numOptions; i++) {
      // Zorluğa göre varyasyon seviyesini ayarla
      const variationLevel = difficulty === 'easy' ? 1 : 
                           difficulty === 'medium' ? 0.7 : 0.5;
      
      const wrongPattern = createSimilarPattern(newPattern, variationLevel);
      
      // Görüş alanını biraz kaydır
      const offsetX = (Math.random() - 0.5) * pieceSize * 0.3;
      const offsetY = (Math.random() - 0.5) * pieceSize * 0.3;
      
      newOptions.push({
        x: x + offsetX,
        y: y + offsetY,
        pattern: wrongPattern,
        isCorrect: false
      });
    }
    
    setOptions(newOptions.sort(() => Math.random() - 0.5));
    setSelectedOption(null);
    setShowResult(false);
    setTimeLeft(settings.timeLimit);
    setIsPlaying(true);
    setShowTimeWarning(false);
  };

  // Parça seçimi
  const handleSelection = async (option, index) => {
    setSelectedOption(index);
    setShowResult(true);
    setIsPlaying(false); // Süreyi durdur
    
    if (option.isCorrect && user) {
      const earnedPoints = Math.floor(timeLeft * (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1));
      const earnedXP = Math.floor(earnedPoints * 0.1); // %10 XP
      
      setScore(score + earnedPoints);
      setStreak(streak + 1);

      // Profili güncelle
      try {
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('points, experience')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const newPoints = (profile?.points || 0) + earnedPoints;
        const newXP = (profile?.experience || 0) + earnedXP;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            points: newPoints,
            experience: newXP
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setTotalPoints(newPoints);
        setTotalXP(newXP);
        showTemporaryNotification(`+${earnedPoints} puan, +${earnedXP} XP kazandın!`);
      } catch (error) {
        console.error('Puan güncellenirken hata:', error);
      }
    } else {
      setStreak(0);
    }
  };

  return (
    <RequireAuth>
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Üst bilgi çubuğu */}
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-bold">{score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-500" />
                <span>Toplam: {totalPoints}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span>XP: {totalXP}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500" />
                <span>En Yüksek: {highScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-500" />
                <span>Seri: {streak}</span>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 ${
              showTimeWarning ? 'animate-pulse text-red-500' : ''
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono">{timeLeft}s</span>
            </div>
          </div>

          {/* Oyun açıklaması */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-bold mb-3">Nasıl Oynanır?</h2>
            <div className="space-y-2 text-gray-600">
              <p>1. Ekrandaki şekil deseninde kırmızı çerçeve ile gösterilen eksik parçayı bulun.</p>
              <p>2. Aşağıdaki seçeneklerden eksik parçaya uygun olanı seçin.</p>
              <p>3. Süre bitmeden doğru parçayı seçmeye çalışın.</p>
              <p>4. Mazaret uydurma; soruyu ve seçenekleri beğenmezsen Yeni Oyun'a bas</p>
              <p>5. Hayır. Şekilli seçeneklerin hepsi aynı değil; birbirine çok benzer.</p>
              <div className="mt-4 bg-blue-50 p-3 rounded">
                <p className="font-semibold mb-2">Zorluk Seviyeleri:</p>
                <ul className="list-disc list-inside space-y-1">
                <li><span className="font-medium">Önce oynamak istediğin zorluk seviyene bas:</span> Sonra Yeni Oyun'a</li>
                  <li><span className="font-medium">Kolay:</span> 30 saniye, basit şekiller, 4 seçenek (x1 puan)</li>
                  <li><span className="font-medium">Orta:</span> 25 saniye, karışık şekiller, 6 seçenek (x2 puan)</li>
                  <li><span className="font-medium">Zor:</span> 20 saniye, tüm şekiller, 8 seçenek (x3 puan)</li>
                </ul>
              </div>
              <p className="mt-4 text-sm text-gray-500">Not: Ne kadar hızlı cevaplarsanız o kadar çok puan kazanırsınız!</p>
            </div>
          </div>

          {/* Zorluk seçimi */}
          <div className="flex justify-center gap-4">
            {['easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  difficulty === level
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>

          {/* Ana oyun alanı */}
          <div className="relative bg-white rounded-lg shadow-lg p-4">
            <svg width={svgSize} height={svgSize} className="border rounded">
              {gamePattern?.map((shape, i) => renderShape(shape, i))}
              
              <rect
                x={missingPiece.x}
                y={missingPiece.y}
                width={pieceSize}
                height={pieceSize}
                fill="white"
                stroke="red"
                strokeWidth="2"
                strokeDasharray="5,5"
                className={showTimeWarning ? 'animate-pulse' : ''}
              />
            </svg>
          </div>

          {/* Seçenekler */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {options.map((option, index) => (
              <div
                key={index}
                className={`relative cursor-pointer transform transition-all hover:scale-105 ${
                  showResult
                    ? option.isCorrect
                      ? 'ring-4 ring-green-500 animate-bounce'
                      : selectedOption === index
                      ? 'ring-4 ring-red-500 animate-shake'
                      : ''
                    : 'hover:shadow-lg'
                }`}
                onClick={() => !showResult && handleSelection(option, index)}
              >
                <svg
                  width={pieceSize}
                  height={pieceSize}
                  className="border rounded bg-white w-full h-full"
                  viewBox={`${option.x} ${option.y} ${pieceSize} ${pieceSize}`}
                >
                  {option.pattern?.map((shape, i) => renderShape(shape, i))}
                </svg>
              </div>
            ))}
          </div>

          {/* Sonuç ve kontroller */}
          <div className="flex justify-center gap-4">
            <button
              onClick={startNewGame}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
            >
              {isPlaying ? 'Yeni Oyun' : 'Başla'}
            </button>
          </div>

          {showResult && (
            <div className="text-center">
              <p className={`text-xl font-bold ${
                options[selectedOption]?.isCorrect ? 'text-green-500' : 'text-red-500'
              }`}>
                {options[selectedOption]?.isCorrect 
                  ? `Tebrikler! +${Math.floor(timeLeft * (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1))} puan` 
                  : 'Yanlış! Tekrar dene'}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Bildirim */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
          {notificationMessage}
        </div>
      )}
    </RequireAuth>
  );
};

export default AdvancedMissingPieceGame;
