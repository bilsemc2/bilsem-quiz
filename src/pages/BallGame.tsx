import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Position {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface ScoreZone {
  x: number;
  y: number;
  width: number;
  height: number;
  points: number;
  active: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  moveType: 'horizontal' | 'vertical';
  direction: number;
  range: number;
  startPos: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BALL_SIZE = 20;
const OBSTACLE_SPEED = 3;
const BALL_SPEED = 5;

export function BallGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const previousState = location.state?.previousState; // ResultPage'den gelen önceki state

  useEffect(() => {
    // Sadece ResultPage'den gelenlere izin ver
    const isComingFromResult = location.state?.fromResult === true;
    
    if (!isComingFromResult) {
      navigate('/', { 
        replace: true,
        state: { 
          error: 'Bu oyuna sadece quiz sonuç sayfasından erişilebilir!' 
        }
      });
      return;
    }
  }, [location, navigate]);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5); // 5 saniye
  const [gameOver, setGameOver] = useState(false);
  const [ball, setBall] = useState<Position>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    dx: BALL_SPEED,
    dy: -BALL_SPEED
  });

  const [obstacles] = useState<Obstacle[]>([
    // Yatay Engeller
    {
      x: 100,
      y: 80,
      width: 120,
      height: 20,
      moveType: 'horizontal',
      direction: 1,
      range: Math.min(200, GAME_WIDTH - 220),
      startPos: 100
    },
    {
      x: GAME_WIDTH - 520,
      y: 160,
      width: 100,
      height: 20,
      moveType: 'horizontal',
      direction: -1,
      range: 150,
      startPos: GAME_WIDTH - 520
    },
    // Dikey Engeller
    {
      x: 180,
      y: 120,
      width: 20,
      height: 100,
      moveType: 'vertical',
      direction: 1,
      range: Math.min(150, GAME_HEIGHT - 220),
      startPos: 120
    },
    {
      x: GAME_WIDTH - 200,
      y: 250,
      width: 20,
      height: 80,
      moveType: 'vertical',
      direction: -1,
      range: 120,
      startPos: 250
    },
    // Çapraz Engeller
    {
      x: 300,
      y: GAME_HEIGHT - 250,
      width: 80,
      height: 20,
      moveType: 'horizontal',
      direction: 1,
      range: 120,
      startPos: 300
    },
    {
      x: GAME_WIDTH - 300,
      y: GAME_HEIGHT - 300,
      width: 20,
      height: 60,
      moveType: 'vertical',
      direction: 1,
      range: 100,
      startPos: GAME_HEIGHT - 300
    },
    // Hızlı Hareket Eden Engeller
    {
      x: 150,
      y: GAME_HEIGHT - 150,
      width: 60,
      height: 20,
      moveType: 'horizontal',
      direction: 1,
      range: Math.min(250, GAME_WIDTH - 210),
      startPos: 150
    },
    {
      x: GAME_WIDTH - 100,
      y: 200,
      width: 20,
      height: 50,
      moveType: 'vertical',
      direction: -1,
      range: Math.min(180, GAME_HEIGHT - 250),
      startPos: 200
    }
  ]);

  const [scoreZones] = useState<ScoreZone[]>([
    {
      x: 100,
      y: GAME_HEIGHT - 40,
      width: 100,
      height: 20,
      points: 5,
      active: true
    },
    {
      x: 400,
      y: GAME_HEIGHT - 30,
      width: 30,
      height: 30,
      points: 100,
      active: true
    },
    {
      x: 700,
      y: GAME_HEIGHT - 40,
      width: 80,
      height: 20,
      points: 10,
      active: true
    }
  ]);

  const updateBall = useCallback(() => {
    setBall(prevBall => {
      let newX = prevBall.x + prevBall.dx;
      let newY = prevBall.y + prevBall.dy;
      let newDx = prevBall.dx;
      let newDy = prevBall.dy;

      // Duvar çarpışmaları
      if (newX <= 0 || newX >= GAME_WIDTH - BALL_SIZE) {
        newDx = -newDx;
        newX = Math.max(0, Math.min(newX, GAME_WIDTH - BALL_SIZE));
      }

      // Üst çarpışma - rastgele yön değişimi
      if (newY <= 0) {
        newDy = Math.abs(newDy);
        newDx = (Math.random() - 0.5) * BALL_SPEED * 2;
        newY = 0;
      }

      // Alt çarpışma
      if (newY >= GAME_HEIGHT - BALL_SIZE) {
        newDy = -Math.abs(newDy);
        newY = GAME_HEIGHT - BALL_SIZE;
      }

      return { x: newX, y: newY, dx: newDx, dy: newDy };
    });
  }, []);

  const updateObstacles = useCallback((obstacles: Obstacle[]): Obstacle[] => {
    return obstacles.map((obstacle, index) => {
      // Son iki engel daha hızlı hareket etsin
      const speed = index >= obstacles.length - 2 ? OBSTACLE_SPEED * 1.5 : OBSTACLE_SPEED;
      
      if (obstacle.moveType === 'horizontal') {
        const newX = obstacle.x + speed * obstacle.direction;
        
        // Yatay sınırları kontrol et
        const minX = 0;
        const maxX = GAME_WIDTH - obstacle.width;
        
        // Engel sınırlara ulaştığında yön değiştir
        if (newX <= minX || newX >= maxX) {
          return { 
            ...obstacle, 
            direction: -obstacle.direction,
            x: newX <= minX ? minX : maxX
          };
        }
        
        // Menzil kontrolü
        if (newX <= obstacle.startPos - obstacle.range || newX >= obstacle.startPos + obstacle.range) {
          return { ...obstacle, direction: -obstacle.direction };
        }
        
        return { ...obstacle, x: newX };
      } else {
        const newY = obstacle.y + speed * obstacle.direction;
        
        // Dikey sınırları kontrol et
        const minY = 0;
        const maxY = GAME_HEIGHT - obstacle.height;
        
        // Engel sınırlara ulaştığında yön değiştir
        if (newY <= minY || newY >= maxY) {
          return { 
            ...obstacle, 
            direction: -obstacle.direction,
            y: newY <= minY ? minY : maxY
          };
        }
        
        // Menzil kontrolü
        if (newY <= obstacle.startPos - obstacle.range || newY >= obstacle.startPos + obstacle.range) {
          return { ...obstacle, direction: -obstacle.direction };
        }
        
        return { ...obstacle, y: newY };
      }
    });
  }, []);

  const checkCollisions = useCallback((ball: Position, obstacles: Obstacle[]) => {
    obstacles.forEach(obstacle => {
      if (ball.x < obstacle.x + obstacle.width &&
          ball.x + BALL_SIZE > obstacle.x &&
          ball.y < obstacle.y + obstacle.height &&
          ball.y + BALL_SIZE > obstacle.y) {
        
        // Çarpışma açısını hesapla
        const ballCenter = {
          x: ball.x + BALL_SIZE / 2,
          y: ball.y + BALL_SIZE / 2
        };
        
        const obstacleCenter = {
          x: obstacle.x + obstacle.width / 2,
          y: obstacle.y + obstacle.height / 2
        };

        const angle = Math.atan2(
          ballCenter.y - obstacleCenter.y,
          ballCenter.x - obstacleCenter.x
        );

        setBall(prev => ({
          ...prev,
          dx: BALL_SPEED * Math.cos(angle),
          dy: BALL_SPEED * Math.sin(angle)
        }));
      }
    });
  }, []);

  const checkScoreZones = useCallback((ball: Position) => {
    scoreZones.forEach(zone => {
      if (zone.active &&
          ball.x < zone.x + zone.width &&
          ball.x + BALL_SIZE > zone.x &&
          ball.y < zone.y + zone.height &&
          ball.y + BALL_SIZE > zone.y) {
        setScore(prev => prev + zone.points);
        zone.active = false;
        setTimeout(() => {
          zone.active = true;
        }, 3000);
      }
    });
  }, [scoreZones]);

  // Zamanlayıcı efekti
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timeLeft > 0 && !gameOver) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
      // Oyun bittiğinde geldiği quiz sonuç sayfasına geri dön
      setTimeout(() => {
        const quizId = previousState?.quizId;
        if (quizId) {
          navigate(`/quiz/${quizId}/result`, { 
            replace: true
          });
        } else {
          // Eğer quizId yoksa ana sayfaya gönder
          navigate('/', { 
            replace: true
          });
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeLeft, gameOver, navigate, previousState]);

  useEffect(() => {
    let animationId: number;
    
    const gameLoop = () => {
      if (gameOver) return;
      updateBall();
      checkCollisions(ball, obstacles);
      checkScoreZones(ball);
      obstacles.splice(0, obstacles.length, ...updateObstacles(obstacles));
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [ball, obstacles, updateBall, updateObstacles, checkCollisions, checkScoreZones, gameOver]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-8">
      {/* Süre ve Puan Göstergesi */}
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 flex gap-8 text-white text-4xl font-bold bg-black/50 p-4 rounded-lg z-20">
        <div className="flex items-center">
          <span className="text-yellow-400 mr-2">⏱</span>
          <span className={`${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-yellow-400 mr-2">🏆</span>
          <span>{score}</span>
        </div>
      </div>
      {gameOver && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-10">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Oyun Bitti!</h2>
            <p className="text-xl mb-4">Toplam Puan: {score}</p>
          </div>
        </div>
      )}
      <div 
        className="relative bg-gray-800 rounded-lg border-4 border-blue-500"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Top */}
        <div
          className="absolute bg-white rounded-full shadow-glow"
          style={{
            width: BALL_SIZE,
            height: BALL_SIZE,
            transform: `translate(${ball.x}px, ${ball.y}px)`,
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.7)'
          }}
        />

        {/* Engeller */}
        {obstacles.map((obstacle, index) => (
          <div
            key={index}
            className="absolute bg-red-500"
            style={{
              width: obstacle.width,
              height: obstacle.height,
              transform: `translate(${obstacle.x}px, ${obstacle.y}px)`,
              transition: 'transform 0.016s linear'
            }}
          />
        ))}

        {/* Puan Bölgeleri */}
        {scoreZones.map((zone, index) => (
          zone.active && (
            <div
              key={`zone-${index}`}
              className={`absolute ${zone.points >= 100 ? 'rounded-full' : ''} ${
                zone.points >= 100 ? 'bg-yellow-500' : 
                zone.points >= 10 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{
                width: zone.width,
                height: zone.height,
                transform: `translate(${zone.x}px, ${zone.y}px)`,
                transition: 'opacity 0.3s',
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-white font-bold">
                {zone.points}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default BallGame;
