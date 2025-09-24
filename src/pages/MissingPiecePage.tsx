import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RefreshCw, Clock, Trophy, Star, Award, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import RequireAuth from '../components/RequireAuth';
import { useXPCheck } from '../hooks/useXPCheck';

// ------------------ Tip Tanımları ------------------
type Difficulty = 'easy' | 'medium' | 'hard';

type Pattern = {
  defs: string;
  type: string;
  backgroundColor: string;
  foregroundColor: string;
  size: number;
  rotation: number;
  opacity: number;
  id: string;
};

interface GameState {
  pattern: Pattern[];
  x: number;
  y: number;
}

interface GameOption {
  x: number;
  y: number;
  pattern: Pattern[];
  isCorrect: boolean;
}

type DifficultySettings = {
  patterns: string[];
  timeLimit: number;
  numShapes: number;
  numOptions: number;
};

type DifficultyConfig = {
  [key in Difficulty]: DifficultySettings;
};

interface UseGameReturn {
  // State
  score: number;
  highScore: number;
  streak: number;
  totalPoints: number;
  totalXP: number;
  timeLeft: number;
  showTimeWarning: boolean;
  showResult: boolean;
  isPlaying: boolean;
  difficulty: Difficulty;
  options: GameOption[];
  selectedOption: number | null;
  gamePattern: Pattern[] | null;
  missingPiece: GameState;
  showNotification: boolean;
  notificationMessage: string;
  isSoundEnabled: boolean;
  correctOptionIndex: number | null;

  // Methods
  setDifficulty: (level: Difficulty) => void;
  startNewGame: () => void;
  handleSelection: (option: GameOption, index: number) => Promise<void>;
  setIsSoundEnabled: (enabled: boolean) => void;
}

// ------------------------------------------------------
// 1. useAdvancedMissingPieceGame: Oyun Mantığının Hook’u (optimizasyonlu)
// ------------------------------------------------------
function useAdvancedMissingPieceGame(user: any): UseGameReturn {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  const [timeLeft, setTimeLeft] = useState(30);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [difficulty, setDifficultyState] = useState<Difficulty>('easy');
  const [options, setOptions] = useState<GameOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [gamePattern, setGamePattern] = useState<Pattern[] | null>(null);
  const [missingPiece, setMissingPiece] = useState<GameState>({ x: 0, y: 0, pattern: [] });

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);

  // Çifte tıklama / re-entrancy kilidi
  const [isProcessing, setIsProcessing] = useState(false);

  const svgSize = 300;
  const pieceSize = 60;

  const difficultySettings: DifficultyConfig = useMemo(() => ({
    easy: {
      patterns: ['dots', 'stripes', 'zigzag', 'waves', 'checkerboard'],
      timeLimit: 30,
      numShapes: 10,
      numOptions: 4
    },
    medium: {
      patterns: [
        'dots', 'stripes', 'zigzag', 'waves', 'checkerboard',
        'crosshatch', 'honeycomb', 'triangles'
      ],
      timeLimit: 25,
      numShapes: 15,
      numOptions: 6
    },
    hard: {
      patterns: [
        'dots', 'stripes', 'zigzag', 'waves', 'checkerboard',
        'crosshatch', 'honeycomb', 'triangles', 'circles',
        'diamonds', 'stars'
      ],
      timeLimit: 20,
      numShapes: 20,
      numOptions: 8
    }
  }), []);

  // ------------------ Sesler (tek sefer yarat) ------------------
  const soundsRef = useRef<Record<string, HTMLAudioElement> | null>(null);
  useEffect(() => {
    if (!soundsRef.current) {
      soundsRef.current = {
        correct: new Audio('/sounds/correct.mp3'),
        incorrect: new Audio('/sounds/wrong.mp3'),
        tick: new Audio('/sounds/tick.mp3'),
        timeWarning: new Audio('/sounds/time-warning.mp3'),
        timeout: new Audio('/sounds/timeout.mp3'),
        complete: new Audio('/sounds/complete.mp3'),
        next: new Audio('/sounds/next.mp3')
      };
      Object.values(soundsRef.current).forEach(a => {
        a.volume = 0.4;
        a.preload = 'auto';
      });
    }
  }, []);

  const playSound = useCallback((soundName: keyof NonNullable<typeof soundsRef.current>) => {
    if (!isSoundEnabled) return;
    const sound = soundsRef.current?.[soundName];
    if (!sound) return;
    try {
      sound.currentTime = 0;
      void sound.play();
    } catch {
      // Autoplay engeline takılırsa sessizce geç
    }
  }, [isSoundEnabled]);

  // ------------------ Yardımcılar ------------------
  const showTemporaryNotification = useCallback((message: string): void => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  }, []);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const adjustColor = (hexColor: string, delta: number): string => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const adj = (c: number) => clamp(c + Math.round((Math.random() - 0.5) * delta), 0, 255);
    const newR = adj(r).toString(16).padStart(2, '0');
    const newG = adj(g).toString(16).padStart(2, '0');
    const newB = adj(b).toString(16).padStart(2, '0');
    return `#${newR}${newG}${newB}`;
  };

  // ------------------ Desen Oluşturma ------------------
  const vibrantColors = useMemo(() => [
    '#FFD700', '#FF4C4C', '#1E90FF', '#FF69B4', '#32CD32',
    '#FF8C00', '#9932CC', '#FFB6C1', '#00CED1', '#00BFFF',
    '#FFFF00', '#FFA500', '#40E0D0', '#FF4500', '#00FF7F',
  ], []);

  const pickDifferentColor = useCallback((baseColor: string) => {
    const colors = vibrantColors.filter(c => c !== baseColor);
    return colors[Math.floor(Math.random() * colors.length)];
  }, [vibrantColors]);

  const getPatternDefs = useCallback((pattern: Pattern): string => {
    const strokeWidth = pattern.size / 6;
    const { size, backgroundColor, foregroundColor, type, id } = pattern;
    switch (type) {
      case 'dots':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="${foregroundColor}" stroke="none"/>
          </pattern>
        `;
      case 'stripes':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <rect width="${size}" height="${size/3}" fill="${foregroundColor}"/>
          </pattern>
        `;
      case 'zigzag':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M0 0 L${size/2} ${size} L${size} 0" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'waves':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M0 ${size/2} Q${size/4} 0 ${size/2} ${size/2} T${size} ${size/2}" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'checkerboard':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <rect width="${size/2}" height="${size/2}" fill="${foregroundColor}"/>
            <rect x="${size/2}" y="${size/2}" width="${size/2}" height="${size/2}" fill="${foregroundColor}"/>
          </pattern>
        `;
      case 'crosshatch':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M0 0 L${size} ${size} M0 ${size} L${size} 0" stroke="${foregroundColor}" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'honeycomb':
        const s = size / 2;
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size*3}" height="${size*1.732}">
            <rect width="${size*3}" height="${size*1.732}" fill="${backgroundColor}"/>
            <path d="M${s},0 l${s},${s*0.866} l0,${s*1.732} l-${s},${s*0.866} l-${s},-${s*0.866} l0,-${s*1.732} z" fill="none" stroke="${foregroundColor}" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'triangles':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M0 0 L${size} 0 L${size/2} ${size}" fill="${foregroundColor}" stroke="${backgroundColor}" stroke-width="1"/>
          </pattern>
        `;
      case 'circles':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <circle cx="${size/2}" cy="${size/2}" r="${size/3}" stroke="${foregroundColor}" fill="none" stroke-width="${strokeWidth}"/>
          </pattern>
        `;
      case 'diamonds':
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="M${size/2} 0 L${size} ${size/2} L${size/2} ${size} L0 ${size/2} Z" fill="${foregroundColor}" stroke="${backgroundColor}" stroke-width="1"/>
          </pattern>
        `;
      case 'stars':
        const points = 10;
        const outerRadius = size / 3;
        const innerRadius = outerRadius * 0.45;
        let starPath = '';
        for (let i = 0; i < points; i++) {
          const angle = (i * Math.PI * 2) / points;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const x = size/2 + Math.cos(angle) * radius;
          const y = size/2 + Math.sin(angle) * radius;
          starPath += (i === 0 ? 'M' : 'L') + `${x},${y}`;
        }
        return `
          <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
            <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
            <path d="${starPath}Z" fill="${foregroundColor}" stroke="${backgroundColor}" stroke-width="1"/>
          </pattern>
        `;
      default:
        return '';
    }
  }, []);

  const generatePattern = useCallback((): Pattern => {
    const settings = difficultySettings[difficulty];
    const patternType = settings.patterns[Math.floor(Math.random() * settings.patterns.length)];
    const backgroundColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
    const foregroundColor = pickDifferentColor(backgroundColor);

    const basePattern: Pattern = {
      defs: '',
      type: patternType,
      backgroundColor,
      foregroundColor,
      size: 20 + Math.random() * 30,
      rotation: Math.random() * 360,
      opacity: 0.9 + Math.random() * 0.1,
      id: `pattern-${Math.random().toString(36).slice(2, 11)}`
    };

    const withDefs = { ...basePattern, defs: getPatternDefs(basePattern) };
    return withDefs;
  }, [difficulty, difficultySettings, vibrantColors, pickDifferentColor, getPatternDefs]);

  const generatePatternList = useCallback((): Pattern[] => {
    const { numShapes } = difficultySettings[difficulty];
    return Array.from({ length: numShapes }, () => generatePattern());
  }, [difficulty, difficultySettings, generatePattern]);

  const createSimilarPattern = useCallback((originalPattern: Pattern[], variationLevel: number): Pattern[] => {
    return originalPattern.map(pattern => {
      const variation = variationLevel * (Math.random() * 0.4 + 0.8);
      return {
        ...pattern,
        size: pattern.size * (0.9 + Math.random() * 0.2 * variation),
        rotation: pattern.rotation + (Math.random() - 0.5) * 45 * variation,
        foregroundColor: adjustColor(pattern.foregroundColor, variation * 20),
        opacity: clamp(pattern.opacity * (0.9 + Math.random() * 0.2), 0.5, 1)
      };
    });
  }, []);

  // ------------------ Profil Yükle ------------------
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('points, experience')
        .eq('id', user.id)
        .single();
      if (!error && profile) {
        setTotalPoints(profile.points || 0);
        setTotalXP(profile.experience || 0);
      }
    };
    void loadProfile();
  }, [user]);

  // ------------------ Zamanlayıcı (güvenli) ------------------
  const endGame = useCallback(() => {
    setIsPlaying(false);
    setShowResult(true);
    setHighScore(hs => (score > hs ? score : hs));
    playSound('timeout');
  }, [score, playSound]);

  useEffect(() => {
    if (!isPlaying) return;

    const t = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next === 10) {
          setShowTimeWarning(true);
          playSound('timeWarning');
        } else if (next <= 6) {
          setShowTimeWarning(true);
        }
        if (next <= 0) {
          clearInterval(t);
          endGame();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [isPlaying, endGame, playSound]);

  const startNewGame = useCallback(() => {
    playSound('next');

    const settings = difficultySettings[difficulty];
    const newPattern = generatePatternList();
    setGamePattern(newPattern);

    const x = Math.floor(Math.random() * (svgSize - pieceSize));
    const y = Math.floor(Math.random() * (svgSize - pieceSize));

    setMissingPiece({ x, y, pattern: newPattern });

    const newOptions: GameOption[] = [];
    newOptions.push({ x, y, pattern: newPattern, isCorrect: true });

    for (let i = 1; i < settings.numOptions; i++) {
      const variationLevel = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 0.7 : 0.5;
      const wrongPattern = createSimilarPattern(newPattern, variationLevel);
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
    setCorrectOptionIndex(null);
    setShowResult(false);
    setIsPlaying(true);
    setShowTimeWarning(false);
    setTimeLeft(settings.timeLimit);
    setIsProcessing(false);
  }, [createSimilarPattern, difficulty, difficultySettings, generatePatternList, playSound]);

  const handleSelection = useCallback(async (option: GameOption, index: number): Promise<void> => {
    if (!isPlaying || isProcessing) return; // kilit
    setIsProcessing(true);

    setSelectedOption(index);
    setShowResult(true);
    setIsPlaying(false);

    const correctIndex = options.findIndex(opt => opt.isCorrect);
    setCorrectOptionIndex(correctIndex);

    const earnedPoints = option.isCorrect
      ? Math.floor(timeLeft * (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1))
      : 0;
    const earnedXP = Math.floor(earnedPoints * 0.1);

    if (option.isCorrect && user) {
      setScore(s => s + earnedPoints);
      setStreak(s => s + 1);

      showTemporaryNotification(`+${earnedPoints} puan ve +${earnedXP} XP kazandın!`);

      try {
        // ÖNERİ: Supabase'te aşağıdaki RPC fonksiyonunu oluşturun:
        // create or replace function increment_profile_points_xp(uid uuid, points_delta int, xp_delta int)
        // returns void language sql as $$
        //   update profiles set points = points + points_delta, experience = experience + xp_delta where id = uid;
        // $$;
        const { error: rpcErr } = await supabase.rpc('increment_profile_points_xp', {
          uid: user.id,
          points_delta: earnedPoints,
          xp_delta: earnedXP,
        });

        if (rpcErr) {
          // Fallback: 2 adımlı (yarış riski var ama çalışır)
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
            .update({ points: newPoints, experience: newXP })
            .eq('id', user.id);
          if (updateError) throw updateError;

          setTotalPoints(newPoints);
          setTotalXP(newXP);
        } else {
          setTotalPoints(tp => tp + earnedPoints);
          setTotalXP(txp => txp + earnedXP);
        }

        setTimeout(() => {
          startNewGame();
        }, 1000);
      } catch (error) {
        console.error('Puan güncellenirken hata:', error);
        setIsProcessing(false);
      }
    } else {
      setStreak(0);
      setTimeout(() => {
        startNewGame();
      }, 2000);
    }

    playSound(option.isCorrect ? 'correct' : 'incorrect');
  }, [difficulty, isPlaying, isProcessing, options, playSound, showTemporaryNotification, startNewGame, timeLeft, user]);

  return {
    // State
    score,
    highScore,
    streak,
    totalPoints,
    totalXP,
    timeLeft,
    showTimeWarning,
    showResult,
    isPlaying,
    difficulty,
    options,
    selectedOption,
    gamePattern,
    missingPiece,
    showNotification,
    notificationMessage,
    isSoundEnabled,
    correctOptionIndex,

    // Methods
    setDifficulty: (level: Difficulty) => {
      // Oyun esnasında zorluk değişmesin
      if (isPlaying) return;
      setDifficultyState(level);
    },
    startNewGame,
    handleSelection,
    setIsSoundEnabled
  };
}

// ------------------------------------------------------
// 2. Alt Bileşenler
// ------------------------------------------------------

function Scoreboard(props: {
  score: number;
  highScore: number;
  totalPoints: number;
  totalXP: number;
  streak: number;
}) {
  const { score, highScore, totalPoints, totalXP, streak } = props;
  return (
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
    </div>
  );
}

function DifficultySelector(props: {
  currentDifficulty: Difficulty;
  onChange: (level: Difficulty) => void;
  disabled?: boolean;
}) {
  const { currentDifficulty, onChange, disabled } = props;
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  return (
    <div className="flex justify-center gap-4">
      {difficulties.map((level) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          disabled={!!disabled}
          aria-pressed={currentDifficulty === level}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentDifficulty === level
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
          title={disabled ? 'Oyun sürerken zorluk değiştirilemez' : 'Zorluk değiştir'}
        >
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </button>
      ))}
    </div>
  );
}

function GameInstructions() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-3">Nasıl Oynanır?</h2>
      <div className="space-y-2 text-gray-600">
        <p>1. Ekrandaki şekil deseninde kırmızı çerçeve ile gösterilen eksik parçayı bulun.</p>
        <p>2. Aşağıdaki seçeneklerden eksik parçaya uygun olanı seçin.</p>
        <p>3. Süre bitmeden doğru parçayı seçmeye çalışın.</p>
        <p>4. Seçim sonrası otomatik olarak bir sonraki tura geçilir.</p>
        <p>5. Seçenekler birbirine çok benzer; dikkat kesil! 🎯</p>
        <div className="mt-4 bg-blue-50 p-3 rounded">
          <p className="font-semibold mb-2">Zorluk Seviyeleri:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Zorluğu seçtikten sonra Başla’ya tıklayın. Oyun sürerken zorluk değiştirilemez.
            </li>
            <li><span className="font-medium">Kolay:</span> 30 sn, 4 seçenek (x1 puan)</li>
            <li><span className="font-medium">Orta:</span> 25 sn, 6 seçenek (x2 puan)</li>
            <li><span className="font-medium">Zor:</span> 20 sn, 8 seçenek (x3 puan)</li>
          </ul>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          İpucu: Oyun sırasında klavyeden 1–8 tuşları ile seçenek seçebilirsin.
        </p>
      </div>
    </div>
  );
}

function PatternRenderer(props: { pattern: Pattern[]; size: number; keyPrefix?: string }) {
  const { pattern, size, keyPrefix = '' } = props;
  return (
    <g>
      {pattern.map((p, i) => (
        <g key={`${keyPrefix}-${i}`}>
          <defs dangerouslySetInnerHTML={{ __html: p.defs }} />
          <rect
            x="0"
            y="0"
            width={size}
            height={size}
            fill={`url(#${p.id})`}
            opacity={p.opacity}
            transform={`rotate(${p.rotation} ${size / 2} ${size / 2})`}
          />
        </g>
      ))}
    </g>
  );
}

function OptionSquare(props: {
  option: GameOption;
  index: number;
  selectedOption: number | null;
  correctOptionIndex: number | null;
  showResult: boolean;
  onSelect: (option: GameOption, index: number) => void;
  svgViewBox: { x: number; y: number; size: number };
  disabled?: boolean;
}) {
  const { option, index, selectedOption, correctOptionIndex, showResult, onSelect, svgViewBox, disabled } = props;
  const { size } = svgViewBox;

  const isSelected = selectedOption === index;
  const isCorrectOption = correctOptionIndex === index;

  let borderClass = 'border-gray-200';
  let bgClass = '';
  if (showResult) {
    if (isCorrectOption) {
      borderClass = 'border-green-500';
      bgClass = 'bg-green-100 bg-opacity-50 animate-pulse';
    } else if (isSelected && !option.isCorrect) {
      borderClass = 'border-red-500';
      bgClass = 'bg-red-100 bg-opacity-50';
    }
  }

  const handleClick = () => {
    if (disabled) return;
    onSelect(option, index);
  };

  return (
    <div
      role="button"
      aria-label={`Seçenek ${index + 1}${option.isCorrect ? ' (doğru)' : ''}`}
      title={`Seçenek ${index + 1}`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) handleClick(); }}
      className={`relative cursor-pointer transform transition-all duration-200 hover:scale-105 ${
        isSelected ? 'ring-2 ring-blue-500 scale-105' : ''
      } ${disabled ? 'pointer-events-none opacity-70' : ''}`}
      style={{ width: '80px', height: '80px' }}
      onClick={handleClick}
    >
      <svg
        className="border rounded bg-white w-full h-full shadow-sm hover:shadow-md transition-shadow"
        viewBox={`${option.x} ${option.y} ${size} ${size}`}
      >
        <PatternRenderer pattern={option.pattern} size={300} keyPrefix={`option-${index}`} />
      </svg>
      <div className={`absolute inset-0 border-2 rounded ${borderClass} ${bgClass}`} />
    </div>
  );
}

// ------------------------------------------------------
// 3. Ana Bileşen (Container): AdvancedMissingPieceGame
// ------------------------------------------------------
export default function AdvancedMissingPieceGame() {
  const { user } = useAuth();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);

  const {
    score,
    highScore,
    streak,
    totalPoints,
    totalXP,
    timeLeft,
    showTimeWarning,
    showResult,
    isPlaying,
    difficulty,
    options,
    selectedOption,
    gamePattern,
    missingPiece,
    showNotification,
    notificationMessage,
    isSoundEnabled,
    correctOptionIndex,

    setDifficulty,
    startNewGame,
    handleSelection,
    setIsSoundEnabled
  } = useAdvancedMissingPieceGame(user);

  // Klavye kısayolları (1–8)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n)) {
        const idx = n - 1;
        if (idx >= 0 && idx < options.length) {
          handleSelection(options[idx], idx);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlaying, options, handleSelection]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        {xpLoading ? (
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : !hasEnoughXP ? (
          <div className="container mx-auto px-4 py-8">
            <p className="text-center text-red-500 font-bold">
              Bu oyuna başlamak için yeterli XP’niz yok (Gerekli XP: {requiredXP}, Sizde: {userXP})
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
              <Scoreboard
                score={score}
                highScore={highScore}
                totalPoints={totalPoints}
                totalXP={totalXP}
                streak={streak}
              />
              <div
                aria-live="polite"
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full shadow-md ${showTimeWarning ? 'animate-bounce text-yellow-300' : ''}`}
              >
                <Clock className="w-6 h-6 text-white" />
                <span className="font-mono text-lg font-bold text-white">{timeLeft}s</span>
              </div>
            </div>

            <DifficultySelector
              currentDifficulty={difficulty}
              onChange={setDifficulty}
              disabled={isPlaying}
            />

            <div className="relative bg-gradient-to-br from-pink-400 via-purple-400 to-blue-500 rounded-xl shadow-xl p-8 mx-auto max-w-2xl border-4 border-purple-300">
              <svg width="300" height="300" className="mx-auto rounded-lg shadow-inner bg-white">
                {gamePattern && (
                  <PatternRenderer pattern={gamePattern} size={300} keyPrefix="game" />
                )}
                <rect
                  x={missingPiece.x}
                  y={missingPiece.y}
                  width={60}
                  height={60}
                  fill="white"
                  stroke="#FF9AA2"
                  strokeWidth="3"
                  strokeDasharray="8,8"
                  className={`${showTimeWarning ? 'animate-pulse' : ''} drop-shadow-lg`}
                />
              </svg>
            </div>

            <div className="mt-8 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 p-6 rounded-xl shadow-lg">
              <div className="flex flex-wrap justify-center gap-6">
                {options.map((option, index) => (
                  <div
                    key={`option-${index}`}
                    className={`transform hover:scale-105 transition-transform duration-200 
                      ${selectedOption === index
                        ? option.isCorrect
                          ? 'ring-4 ring-green-400 ring-offset-4'
                          : 'ring-4 ring-red-400 ring-offset-4'
                        : correctOptionIndex === index
                        ? 'ring-4 ring-green-400 ring-offset-4 animate-pulse'
                        : ''
                      }
                      bg-white rounded-lg shadow-md hover:shadow-xl p-2 cursor-pointer`}
                  >
                    <OptionSquare
                      option={option}
                      index={index}
                      selectedOption={selectedOption}
                      correctOptionIndex={correctOptionIndex}
                      showResult={showResult}
                      onSelect={handleSelection}
                      svgViewBox={{ x: option.x, y: option.y, size: 60 }}
                      disabled={!isPlaying || showResult}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={startNewGame}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
                aria-label={isPlaying ? 'Yeni tur başlat' : 'Oyunu başlat'}
                title={isPlaying ? 'Yeni Tur' : 'Başla'}
              >
                {isPlaying ? 'Yeni Tur' : 'Başla'}
              </button>
            </div>

            {showResult && (
              <div className="text-center space-y-2" aria-live="polite">
                {selectedOption !== null && options[selectedOption]?.isCorrect ? (
                  <>
                    <p className="text-xl font-bold text-green-500">
                      Tebrikler! Doğru Cevap!
                    </p>
                    <p className="text-lg text-blue-500">
                      <span>+{Math.floor(timeLeft * (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1))} puan</span>
                      <span className="mx-2">|</span>
                      <span>+{Math.floor(timeLeft * (difficulty === 'hard' ? 0.3 : difficulty === 'medium' ? 0.2 : 0.1))} XP</span>
                    </p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-red-500">
                    Yanlış! Tekrar dene
                  </p>
                )}
              </div>
            )}

            <GameInstructions />

            {showNotification && (
              <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
                {notificationMessage}
              </div>
            )}

            <div className="fixed bottom-4 right-4">
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-3 rounded-full hover:bg-gray-100 bg-white shadow-lg transition-all duration-200 hover:scale-110"
                title={isSoundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
                aria-label={isSoundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
              >
                {isSoundEnabled ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728 M12 18.012l-7-4.2V10.2l7-4.2v12.012z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}