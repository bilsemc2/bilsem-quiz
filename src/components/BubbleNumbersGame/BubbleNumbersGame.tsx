import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BubbleNumbersGame.css';
import { soundManager } from './sounds';
import { PowerUpManager } from './powerups/PowerUpManager';
import { PowerUpType, POWER_UPS } from './powerups/types';

/*---------------------------------
 |  SABITLER
 *--------------------------------*/
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BUBBLE_MIN_SIZE = 40;
const BUBBLE_MAX_SIZE = 80;
const INITIAL_TIME = 60;
const LEVEL_BONUS_TIME = 10;

// Seviye ayarları
interface LevelSettings {
  bubbleCount: number;
  bubbleSpeed: number;
  operations: ('+' | '-' | '*')[];
  maxNumber: number;
  timeBonus: number;
}

const LEVEL_SETTINGS: { [key: number]: LevelSettings } = {
  1: {
    bubbleCount: 8,
    bubbleSpeed: 40,
    operations: ['+'],
    maxNumber: 10,
    timeBonus: 10
  },
  2: {
    bubbleCount: 10,
    bubbleSpeed: 50,
    operations: ['+', '-'],
    maxNumber: 15,
    timeBonus: 12
  },
  3: {
    bubbleCount: 12,
    bubbleSpeed: 60,
    operations: ['+', '-', '*'],
    maxNumber: 20,
    timeBonus: 15
  },
  4: {
    bubbleCount: 14,
    bubbleSpeed: 70,
    operations: ['+', '-', '*'],
    maxNumber: 25,
    timeBonus: 18
  },
  5: {
    bubbleCount: 16,
    bubbleSpeed: 80,
    operations: ['+', '-', '*'],
    maxNumber: 30,
    timeBonus: 20
  }
};

// Varsayılan seviye ayarları
const getDefaultSettings = (level: number): LevelSettings => ({
  bubbleCount: 8 + (level - 1) * 2,
  bubbleSpeed: 40 + (level - 1) * 10,
  operations: level >= 3 ? ['+', '-', '*'] : ['+', '-'],
  maxNumber: 10 + (level - 1) * 5,
  timeBonus: 10 + (level - 1) * 2
});

// Seviye ayarlarını al
const getLevelSettings = (level: number): LevelSettings => {
  return LEVEL_SETTINGS[level] || getDefaultSettings(level);
};

/*---------------------------------
 |  YARDIMCI FONKSİYONLAR
 *--------------------------------*/
// Rastgele sayı üretme
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Rastgele işlem üretme
const generateOperation = (level: number): { operation: string; result: number } => {
  const settings = getLevelSettings(level);
  const op = settings.operations[Math.floor(Math.random() * settings.operations.length)];
  let num1 = Math.floor(random(1, settings.maxNumber));
  let num2 = Math.floor(random(1, settings.maxNumber));
  
  let result: number;
  switch (op) {
    case '+':
      result = num1 + num2;
      break;
    case '-':
      // Negatif sonuç olmasın
      if (num1 < num2) [num1, num2] = [num2, num1];
      result = num1 - num2;
      break;
    case '*':
      // Çok büyük sayılar olmasın
      num1 = Math.floor(random(1, Math.min(5, settings.maxNumber)));
      num2 = Math.floor(random(1, Math.min(5, settings.maxNumber)));
      result = num1 * num2;
      break;
    default:
      result = 0;
  }

  return {
    operation: `${num1} ${op} ${num2}`,
    result
  };
};

// Yeni baloncuk oluşturma
const createBubble = (id: number, level: number): Bubble => {
  const settings = getLevelSettings(level);
  const size = random(BUBBLE_MIN_SIZE, BUBBLE_MAX_SIZE);
  const { operation, result } = generateOperation(level);
  
  return {
    id,
    x: random(size, GAME_WIDTH - size),
    y: random(size, GAME_HEIGHT - size),
    size,
    dx: random(-settings.bubbleSpeed, settings.bubbleSpeed) / 100,
    dy: random(-settings.bubbleSpeed, settings.bubbleSpeed) / 100,
    operation,
    result
  };
};

/*---------------------------------
 |  TIPLER
 *--------------------------------*/
interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  operation: string;
  result: number;
  popping?: boolean;  // Patlama animasyonu için
  popProgress?: number;  // Patlama ilerleme durumu
  highlighted?: boolean; // İpucu vurgusu
}

/*---------------------------------
 |  BILEŞEN
 *--------------------------------*/
const BubbleNumbersGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const previousState = location.state?.previousState;

  // Referanslar
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const bubblesRef = useRef<Bubble[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  // Güçlendirici yönetimi
  const powerUpManagerRef = useRef(new PowerUpManager());
  const [activePowerUps, setActivePowerUps] = useState<PowerUpType[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  // State
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [targetNumber, setTargetNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Ses durumunu güncelle
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  // Güçlendirici kullan
  const usePowerUp = useCallback((type: PowerUpType) => {
    if (!powerUpManagerRef.current.canUsePowerUp(type, currentTime)) return;

    soundManager.play('pop'); // Güçlendirici sesi
    powerUpManagerRef.current.activatePowerUp(type, currentTime);

    switch (type) {
      case 'timeFreeze':
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), POWER_UPS[type].duration * 1000);
        break;
      
      case 'extraTime':
        setTimeLeft(prev => prev + 10);
        break;
      
      case 'hint':
        const correctBubble = bubblesRef.current?.find(b => b.result === targetNumber);
        if (correctBubble) {
          correctBubble.highlighted = true;
          setTimeout(() => {
            if (correctBubble) correctBubble.highlighted = false;
          }, POWER_UPS[type].duration * 1000);
        }
        break;
    }
  }, [currentTime, targetNumber]);

  // Güçlendirici efektlerini uygula
  const applyPowerUpEffects = useCallback((bubble: Bubble) => {
    const active = powerUpManagerRef.current.getActivePowerUps(currentTime);
    
    if (active.includes('slowMotion')) {
      bubble.dx *= 0.5;
      bubble.dy *= 0.5;
    }
    
    return bubble;
  }, [currentTime]);

  // Baloncukları güncelle
  const updateBubbles = useCallback((delta: number) => {
    if (!bubblesRef.current) return;

    bubblesRef.current = bubblesRef.current.map(bubble => {
      let newBubble = { ...bubble };
      
      // Güçlendirici efektlerini uygula
      newBubble = applyPowerUpEffects(newBubble);

      let newX = newBubble.x + newBubble.dx * delta;
      let newY = newBubble.y + newBubble.dy * delta;
      let newDx = newBubble.dx;
      let newDy = newBubble.dy;

      if (newX <= newBubble.size || newX >= GAME_WIDTH - newBubble.size) {
        newDx = -newDx;
        newX = newX <= newBubble.size ? newBubble.size : GAME_WIDTH - newBubble.size;
      }
      if (newY <= newBubble.size || newY >= GAME_HEIGHT - newBubble.size) {
        newDy = -newDy;
        newY = newY <= newBubble.size ? newBubble.size : GAME_HEIGHT - newBubble.size;
      }

      return {
        ...newBubble,
        x: newX,
        y: newY,
        dx: newDx,
        dy: newDy
      };
    });

    setBubbles([...bubblesRef.current]);
  }, [applyPowerUpEffects]);

  // Baloncukları çiz
  const drawBubbles = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !bubblesRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubblesRef.current.forEach(bubble => {
      if (bubble.popping) {
        // Patlama animasyonu
        if (bubble.popProgress === undefined) bubble.popProgress = 0;
        
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size * (1 + bubble.popProgress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(33, 150, 243, ${0.3 * (1 - bubble.popProgress)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(33, 150, 243, ${0.6 * (1 - bubble.popProgress)})`;
        ctx.stroke();

        bubble.popProgress += 0.1;
        
        if (bubble.popProgress >= 1) {
          bubblesRef.current = bubblesRef.current.filter(b => b.id !== bubble.id);
          setBubbles([...bubblesRef.current]);
        }
      } else {
        // Normal baloncuk
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        
        // İpucu vurgusu
        if (bubble.highlighted) {
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        } else {
          ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
          ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)';
        }
        
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1976D2';
        ctx.font = `${bubble.size / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bubble.operation, bubble.x, bubble.y);
      }
    });
  }, []);

  // Tıklama kontrolü
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas || !bubblesRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedBubble = bubblesRef.current.find(bubble => {
      const distance = Math.sqrt(
        Math.pow(bubble.x - x, 2) + Math.pow(bubble.y - y, 2)
      );
      return distance <= bubble.size && !bubble.popping;
    });

    if (clickedBubble) {
      if (clickedBubble.result === targetNumber) {
        soundManager.play('pop');
        
        clickedBubble.popping = true;
        clickedBubble.popProgress = 0;
        
        // Çift puan kontrolü
        const scoreMultiplier = powerUpManagerRef.current.isPowerUpActive('doublePop', currentTime) ? 2 : 1;
        setScore(prev => prev + (level * 10 * scoreMultiplier));

        const remainingBubbles = bubblesRef.current.filter(b => 
          b.id !== clickedBubble.id && !b.popping
        );
        
        if (remainingBubbles.length > 0) {
          const newTarget = remainingBubbles[
            Math.floor(Math.random() * remainingBubbles.length)
          ];
          setTargetNumber(newTarget.result);
        } else {
          const handleLevelUp = () => {
            soundManager.play('levelUp');
            
            setIsPaused(true);
            const newLevel = level + 1;
            const settings = getLevelSettings(newLevel);
            
            const levelMessage = `Tebrikler! Seviye ${newLevel}\n${
              newLevel === 2 ? 'Çıkarma işlemleri eklendi!' :
              newLevel === 3 ? 'Çarpma işlemleri eklendi!' :
              `Daha hızlı ve daha çok baloncuk!\nBonus Süre: +${settings.timeBonus} saniye`
            }`;
            
            setTimeout(() => {
              setIsPaused(false);
              
              // Seviyeyi ve süreyi güncelle
              setLevel(newLevel);
              setTimeLeft(prev => prev + settings.timeBonus);
              
              // Yeni baloncukları oluştur
              const initialBubbles = Array.from(
                { length: settings.bubbleCount }, 
                (_, i) => createBubble(i, newLevel)
              );
              
              bubblesRef.current = initialBubbles;
              setBubbles(initialBubbles);
              
              // Yeni hedef sayı belirle
              const randomBubble = initialBubbles[Math.floor(Math.random() * initialBubbles.length)];
              setTargetNumber(randomBubble.result);
            }, 3000);
          };
          handleLevelUp();
        }
      } else {
        soundManager.play('wrong');
        setScore(prev => Math.max(0, prev - 5));
        setTimeLeft(prev => Math.max(0, prev - 2));
      }
    }
  }, [level, targetNumber, gameOver, isPaused]);

  // Her saniye güçlendirici durumunu güncelle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => prev + 1);
      const active = powerUpManagerRef.current.getActivePowerUps(currentTime);
      setActivePowerUps(active);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTime]);

  // Oyun döngüsü
  const gameLoop = useCallback((timestamp: number) => {
    if (isPaused) return;

    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }

    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    updateBubbles(delta);
    drawBubbles();

    if (!gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [updateBubbles, drawBubbles, gameOver, isPaused]);

  // Oyunu başlat
  useEffect(() => {
    // İlk baloncukları oluştur
    const settings = getLevelSettings(level);
    const initialBubbles = Array.from(
      { length: settings.bubbleCount }, 
      (_, i) => createBubble(i, level)
    );

    // Hedef sayıyı belirle
    const randomBubble = initialBubbles[Math.floor(Math.random() * initialBubbles.length)];
    
    // State'leri güncelle
    bubblesRef.current = initialBubbles;
    setBubbles(initialBubbles);
    setTargetNumber(randomBubble.result);

    // Animasyon döngüsünü başlat
    const startGame = () => {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    startGame();

    // Temizlik
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [level]); // Sadece level değişince çalışsın

  // Süre sistemini başlat
  useEffect(() => {
    if (gameOver || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          // Süre bitti, oyunu bitir
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameOver, isPaused]);

  // Oyunu duraklat/devam ettir
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  return (
    <div className="bubble-game">
      <div className="game-header">
        <div className="stat-card">
          <div className="stat-label">Seviye</div>
          <div className="stat-value">{level}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Hedef</div>
          <div className="stat-value">{targetNumber}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Puan</div>
          <div className="stat-value">{score}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Süre</div>
          <div className={`stat-value ${timeLeft <= 10 ? 'danger' : ''}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <div className="control-buttons">
          <button 
            onClick={togglePause}
            className={`control-button ${isPaused ? 'paused' : ''}`}
            title={isPaused ? 'Devam Et' : 'Duraklat'}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className={`control-button ${isMuted ? 'muted' : ''}`}
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Güçlendirici butonları */}
      <div className="power-ups">
        {Object.entries(POWER_UPS).map(([type, powerUp]) => {
          const canUse = powerUpManagerRef.current.canUsePowerUp(type as PowerUpType, currentTime);
          const isActive = powerUpManagerRef.current.isPowerUpActive(type as PowerUpType, currentTime);
          const cooldown = powerUpManagerRef.current.getRemainingCooldown(type as PowerUpType, currentTime);
          
          return (
            <button
              key={type}
              onClick={() => usePowerUp(type as PowerUpType)}
              className={`power-up-button ${isActive ? 'active' : ''} ${!canUse ? 'cooldown' : ''}`}
              disabled={!canUse || gameOver || isPaused}
              title={`${powerUp.description}${cooldown > 0 ? `\nBekleme: ${cooldown}s` : ''}`}
            >
              <span className="power-up-icon">{powerUp.icon}</span>
              {cooldown > 0 && <span className="cooldown-timer">{cooldown}</span>}
            </button>
          );
        })}
      </div>

      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="game-canvas"
        onClick={handleCanvasClick}
        style={{ filter: isPaused ? 'blur(3px)' : 'none' }}
      />

      {/* Seviye geçiş efekti */}
      {false && (
        <div className="level-up-overlay">
          <div className="level-up-message">
            
          </div>
        </div>
      )}

      {(gameOver || isPaused) && (
        <div className="game-overlay">
          {gameOver ? (
            <div className="game-over">
              <h2>Oyun Bitti!</h2>
              <p>Seviye: {level}</p>
              <p>Puanınız: {score}</p>
              <button 
                onClick={() => navigate('/result', { state: { ...previousState, gameScore: score }, replace: true })}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Sonuçlara Dön
              </button>
            </div>
          ) : (
            <div className="game-paused">
              <h2>Oyun Duraklatıldı</h2>
              <button 
                onClick={togglePause}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Devam Et
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BubbleNumbersGame;
