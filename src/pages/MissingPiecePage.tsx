import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, Trophy, Star, AlertTriangle, Award, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import RequireAuth from '../components/RequireAuth';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import { useUser } from '../hooks/useUser';

const AdvancedMissingPieceGame = () => {
  const { user } = useAuth();
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, error: xpError, loading: xpLoading } = useXPCheck(
    userLoading ? undefined : currentUser?.id,
    '/missing-piece'
  );
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
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const svgSize = 300;
  const pieceSize = 60;

  // Zorluk seviyesine göre ayarlar
  const difficultySettings = {
    easy: {
      patterns: ['dots', 'stripes', 'zigzag', 'waves', 'checkerboard'],
      timeLimit: 30,
      numShapes: 10,
      numOptions: 4
    },
    medium: {
      patterns: ['dots', 'stripes', 'zigzag', 'waves', 'checkerboard', 'crosshatch', 'honeycomb', 'triangles'],
      timeLimit: 25,
      numShapes: 15,
      numOptions: 6
    },
    hard: {
      patterns: ['dots', 'stripes', 'zigzag', 'waves', 'checkerboard', 'crosshatch', 'honeycomb', 'triangles', 'circles', 'diamonds', 'stars'],
      timeLimit: 20,
      numShapes: 20,
      numOptions: 8
    }
  };

  // Karmaşık şekil oluşturma
  const generatePattern = () => {
    const settings = difficultySettings[difficulty];
    const patternType = settings.patterns[Math.floor(Math.random() * settings.patterns.length)];
    
    // Daha canlı ve kontrast renkler
    const vibrantColors = [
      '#FF0000', // Kırmızı
      '#00FF00', // Yeşil
      '#0000FF', // Mavi
      '#FF00FF', // Magenta
      '#FFFF00', // Sarı
      '#00FFFF', // Cyan
      '#FF8800', // Turuncu
      '#FF0088', // Pembe
      '#8800FF', // Mor
      '#00FF88', // Turkuaz
    ];

    // Kontrast renk seçimi
    const getContrastColor = (baseColor: string) => {
      const colors = vibrantColors.filter(c => c !== baseColor);
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const backgroundColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
    const foregroundColor = getContrastColor(backgroundColor);
    
    const basePattern = {
      type: patternType,
      backgroundColor,
      foregroundColor,
      size: 20 + Math.random() * 30,
      rotation: Math.random() * 360,
      opacity: 0.9 + Math.random() * 0.1, // Daha yüksek opaklık
      id: `pattern-${Math.random().toString(36).substr(2, 9)}`
    };

    const getPatternDefs = (pattern) => {
      const strokeWidth = pattern.size / 6; // Daha kalın çizgiler
      
      switch (pattern.type) {
        case 'dots':
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <circle cx="${pattern.size/2}" cy="${pattern.size/2}" r="${pattern.size/3}" 
                      fill="${pattern.foregroundColor}" stroke="none"/>
            </pattern>
          `;
        case 'stripes':
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <rect width="${pattern.size}" height="${pattern.size/3}" fill="${pattern.foregroundColor}"/>
            </pattern>
          `;
        case 'zigzag':
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <path d="M0 0 L${pattern.size/2} ${pattern.size} L${pattern.size} 0" 
                    stroke="${pattern.foregroundColor}" fill="none" stroke-width="${strokeWidth}"/>
            </pattern>
          `;
        case 'waves':
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <path d="M0 ${pattern.size/2} Q${pattern.size/4} 0 ${pattern.size/2} ${pattern.size/2} T${pattern.size} ${pattern.size/2}" 
                    stroke="${pattern.foregroundColor}" fill="none" stroke-width="${strokeWidth}"/>
            </pattern>
          `;
        case 'checkerboard':
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <rect width="${pattern.size/2}" height="${pattern.size/2}" fill="${pattern.foregroundColor}"/>
              <rect x="${pattern.size/2}" y="${pattern.size/2}" width="${pattern.size/2}" height="${pattern.size/2}" 
                    fill="${pattern.foregroundColor}"/>
            </pattern>
          `;
        case 'crosshatch':
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <path d="M0 0 L${pattern.size} ${pattern.size} M0 ${pattern.size} L${pattern.size} 0" 
                    stroke="${pattern.foregroundColor}" stroke-width="${strokeWidth}"/>
            </pattern>
          `;
        case 'honeycomb':
          const s = pattern.size / 2;
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size*3}" height="${pattern.size*1.732}">
              <rect width="${pattern.size*3}" height="${pattern.size*1.732}" fill="${pattern.backgroundColor}"/>
              <path d="M${s},0 l${s},${s*0.866} l0,${s*1.732} l-${s},${s*0.866} l-${s},-${s*0.866} l0,-${s*1.732} z" 
                    fill="none" stroke="${pattern.foregroundColor}" stroke-width="${strokeWidth}"/>
            </pattern>
          `;
        case 'triangles':
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <path d="M0 0 L${pattern.size} 0 L${pattern.size/2} ${pattern.size}" 
                    fill="${pattern.foregroundColor}" stroke="${pattern.backgroundColor}" stroke-width="1"/>
            </pattern>
          `;
        case 'circles':
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <circle cx="${pattern.size/2}" cy="${pattern.size/2}" r="${pattern.size/3}" 
                      stroke="${pattern.foregroundColor}" fill="none" stroke-width="${strokeWidth}"/>
            </pattern>
          `;
        case 'diamonds':
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <path d="M${pattern.size/2} 0 L${pattern.size} ${pattern.size/2} L${pattern.size/2} ${pattern.size} L0 ${pattern.size/2} Z" 
                    fill="${pattern.foregroundColor}" stroke="${pattern.backgroundColor}" stroke-width="1"/>
            </pattern>
          `;
        case 'stars':
          const points = 5;
          const outerRadius = pattern.size / 3;
          const innerRadius = outerRadius * 0.4;
          let starPath = '';
          for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const x = pattern.size/2 + Math.cos(angle) * radius;
            const y = pattern.size/2 + Math.sin(angle) * radius;
            starPath += (i === 0 ? 'M' : 'L') + `${x},${y}`;
          }
          return `
            <pattern id="${pattern.id}" patternUnits="userSpaceOnUse" width="${pattern.size}" height="${pattern.size}">
              <rect width="${pattern.size}" height="${pattern.size}" fill="${pattern.backgroundColor}"/>
              <path d="${starPath}Z" fill="${pattern.foregroundColor}" 
                    stroke="${pattern.backgroundColor}" stroke-width="1"/>
            </pattern>
          `;
        default:
          return '';
      }
    };

    return {
      ...basePattern,
      defs: getPatternDefs(basePattern)
    };
  };

  const renderPattern = (pattern, key = '') => {
    return (
      <g key={key}>
        <defs dangerouslySetInnerHTML={{ __html: pattern.defs }} />
        <rect
          x="0"
          y="0"
          width={svgSize}
          height={svgSize}
          fill={`url(#${pattern.id})`}
          opacity={pattern.opacity}
          transform={`rotate(${pattern.rotation} ${svgSize/2} ${svgSize/2})`}
        />
      </g>
    );
  };

  // Desen oluştur
  const generatePatternList = () => {
    const settings = difficultySettings[difficulty];
    return Array(settings.numShapes).fill().map(() => generatePattern());
  };

  // Ses efektleri
  const sounds = {
    correct: new Audio('/sounds/correct.mp3'),
    incorrect: new Audio('/sounds/wrong.mp3'),
    tick: new Audio('/sounds/tick.mp3'),
    timeWarning: new Audio('/sounds/time-warning.mp3'),
    timeout: new Audio('/sounds/timeout.mp3'),
    complete: new Audio('/sounds/complete.mp3'),
    next: new Audio('/sounds/next.mp3')
  };

  // Ses çalma fonksiyonu
  const playSound = (soundName: keyof typeof sounds) => {
    if (isSoundEnabled) {
      const sound = sounds[soundName];
      sound.currentTime = 0;
      sound.play().catch(error => console.log('Ses çalma hatası:', error));
    }
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
        
        // 10 saniye kala uyarı
        if (timeLeft === 10) {
          setShowTimeWarning(true);
          playSound('timeWarning');
        }
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
    playSound('timeout');
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

  // Yeni oyun başlat
  const startNewGame = () => {
    playSound('next');
    const settings = difficultySettings[difficulty];
    const newPattern = generatePatternList();
    setGamePattern(newPattern);
    
    const x = Math.floor(Math.random() * (svgSize - pieceSize));
    const y = Math.floor(Math.random() * (svgSize - pieceSize));
    
    setMissingPiece({ x, y, pattern: newPattern });
    
    // Yanlış seçenekler için doğru desene benzer ama farklı desenler oluştur
    const createSimilarPattern = (originalPattern, variationLevel) => {
      return originalPattern.map(pattern => {
        const variation = variationLevel * (Math.random() * 0.4 + 0.8); // 0.8-1.2 arası rastgele çarpan
        return {
          ...pattern,
          // Pozisyonu biraz değiştir
          size: pattern.size * (0.9 + Math.random() * 0.2 * variation),
          // Rotasyonu biraz değiştir
          rotation: pattern.rotation + (Math.random() - 0.5) * 45 * variation,
          // Rengi benzer tonda değiştir
          foregroundColor: adjustColor(pattern.foregroundColor, variation * 20),
          opacity: pattern.opacity * (0.9 + Math.random() * 0.2)
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
    playSound(option.isCorrect ? 'correct' : 'incorrect');
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
          title="Eksik Parça sayfasına erişim için yeterli XP'niz yok"
        />
      </div>
    );
  }

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
              {gamePattern?.map((pattern, i) => renderPattern(pattern, i))}
              
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
          <div className="grid grid-cols-4 gap-2 mt-4">
            {options.map((option, index) => (
              <div
                key={`option-${index}`}
                className={`relative cursor-pointer transform transition-all duration-200 hover:scale-105 ${
                  selectedOption === index ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
                style={{ width: '80px', height: '80px' }}
                onClick={() => handleSelection(option, index)}
              >
                <svg
                  className="border rounded bg-white w-full h-full shadow-sm hover:shadow-md transition-shadow"
                  viewBox={`${option.x} ${option.y} ${pieceSize} ${pieceSize}`}
                >
                  {option.pattern?.map((pattern, i) => renderPattern(pattern, i))}
                </svg>
                <div 
                  className={`absolute inset-0 border-2 rounded ${
                    showResult
                      ? option.isCorrect
                        ? 'border-green-500 bg-green-100 bg-opacity-20'
                        : selectedOption === index
                        ? 'border-red-500 bg-red-100 bg-opacity-20'
                        : ''
                      : 'border-gray-200'
                  }`}
                />
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
      {/* Ses kontrolü */}
      <button
        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
      >
        {isSoundEnabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.012l-7-4.2V10.2l7-4.2v12.012z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </button>
    </RequireAuth>
  );
};

export default AdvancedMissingPieceGame;
