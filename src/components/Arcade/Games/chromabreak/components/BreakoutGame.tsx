
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Block, COLORS, PowerUp, PowerUpType } from '../types';

interface BreakoutGameProps {
  onGameOver: (history: string[], score: number) => void;
  onBlockHit: (colorName: string) => void;
  level: number;
}

const BreakoutGame: React.FC<BreakoutGameProps> = ({ onGameOver, onBlockHit, level }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const isStartedRef = useRef(false);
  const requestRef = useRef<number | undefined>(undefined);
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  // Oyun sabitleri
  const PADDLE_HEIGHT = 15;
  const BASE_PADDLE_WIDTH = 120;
  const BALL_RADIUS = 8;
  const BRICK_PADDING = 10;
  const BRICK_OFFSET_TOP = 60;
  const BRICK_OFFSET_LEFT = 40;
  const POWERUP_SIZE = 30;
  const POWERUP_SPEED = 2;

  const gameStateRef = useRef({
    paddleX: 0,
    paddleWidth: BASE_PADDLE_WIDTH,
    ballX: 0,
    ballY: 0,
    dx: 3 + level,
    dy: -3 - level,
    blocks: [] as Block[],
    powerUps: [] as PowerUp[],
    score: 0,
    history: [] as string[],
    activePowerUps: {
      extend: 0,  // Kalan süre (frame sayısı)
      slow: 0,
    }
  });

  // Logo resmini yükle
  useEffect(() => {
    const img = new Image();
    img.src = '/images/logo_tree.png';
    img.onload = () => {
      logoImageRef.current = img;
    };
  }, []);

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const brickWidth = (canvas.width - BRICK_OFFSET_LEFT * 2 - BRICK_PADDING * 7) / 8;
    const brickHeight = 25;
    const brickRows = 3 + Math.min(level, 3);
    const brickCols = 8;

    const newBlocks: Block[] = [];
    for (let c = 0; c < brickCols; c++) {
      for (let r = 0; r < brickRows; r++) {
        const colorIdx = (r + c) % COLORS.length;
        // Rastgele power-up ekle (%20 şans)
        let powerUp: PowerUpType | undefined = undefined;
        const rand = Math.random();
        if (rand < 0.1) {
          powerUp = PowerUpType.EXTEND;
        } else if (rand < 0.2) {
          powerUp = PowerUpType.SLOW;
        }

        newBlocks.push({
          id: `block-${r}-${c}`,
          x: c * (brickWidth + BRICK_PADDING) + BRICK_OFFSET_LEFT,
          y: r * (brickHeight + BRICK_PADDING) + BRICK_OFFSET_TOP,
          width: brickWidth,
          height: brickHeight,
          color: COLORS[colorIdx].hex,
          colorName: COLORS[colorIdx].name,
          active: true,
          hasPowerUp: powerUp
        });
      }
    }

    const paddleStartX = (canvas.width - BASE_PADDLE_WIDTH) / 2;
    const centerX = canvas.width / 2;
    const randomDirection = Math.random() > 0.5 ? 1 : -1;
    const baseSpeed = 4 + level;

    gameStateRef.current = {
      paddleX: paddleStartX,
      paddleWidth: BASE_PADDLE_WIDTH,
      ballX: centerX,
      ballY: canvas.height - 40,
      dx: baseSpeed * randomDirection,
      dy: -baseSpeed,
      blocks: newBlocks,
      powerUps: [],
      score: 0,
      history: [],
      activePowerUps: { extend: 0, slow: 0 }
    };
    setIsStarted(false);
    isStartedRef.current = false;
  }, [level]);

  useEffect(() => {
    initGame();

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const scaleX = canvasRef.current.width / rect.width;
      const scaledX = relativeX * scaleX;
      if (scaledX > 0 && scaledX < canvasRef.current.width) {
        gameStateRef.current.paddleX = scaledX - gameStateRef.current.paddleWidth / 2;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const relativeX = e.touches[0].clientX - rect.left;
      const scaleX = canvasRef.current.width / rect.width;
      const scaledX = relativeX * scaleX;
      if (scaledX > 0 && scaledX < canvasRef.current.width) {
        gameStateRef.current.paddleX = scaledX - gameStateRef.current.paddleWidth / 2;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [initGame]);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Power-up sürelerini güncelle
    if (state.activePowerUps.extend > 0) {
      state.activePowerUps.extend--;
      state.paddleWidth = BASE_PADDLE_WIDTH * 1.5;
      if (state.activePowerUps.extend === 0) {
        state.paddleWidth = BASE_PADDLE_WIDTH;
      }
    }
    if (state.activePowerUps.slow > 0) {
      state.activePowerUps.slow--;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Blokları çiz
    state.blocks.forEach(block => {
      if (!block.active) return;
      ctx.beginPath();
      ctx.rect(block.x, block.y, block.width, block.height);
      ctx.fillStyle = block.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = block.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.closePath();

      // Power-up içeren blokları işaretle (logo ile)
      if (block.hasPowerUp && logoImageRef.current) {
        const logoSize = Math.min(block.width, block.height) * 0.6;
        ctx.drawImage(
          logoImageRef.current,
          block.x + (block.width - logoSize) / 2,
          block.y + (block.height - logoSize) / 2,
          logoSize,
          logoSize
        );
      }
    });

    // Düşen power-up'ları çiz ve güncelle
    state.powerUps = state.powerUps.filter(pu => {
      if (!pu.active) return false;

      pu.y += POWERUP_SPEED;

      // Logo ile power-up çiz
      if (logoImageRef.current) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = pu.type === PowerUpType.EXTEND ? '#22c55e' : '#3b82f6';
        ctx.drawImage(logoImageRef.current, pu.x - POWERUP_SIZE / 2, pu.y - POWERUP_SIZE / 2, POWERUP_SIZE, POWERUP_SIZE);
        ctx.restore();

        // Power-up tipi etiketi
        ctx.fillStyle = pu.type === PowerUpType.EXTEND ? '#22c55e' : '#3b82f6';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pu.type === PowerUpType.EXTEND ? 'UZAT' : 'YAVAŞ', pu.x, pu.y + POWERUP_SIZE / 2 + 12);
      }

      // Paddle ile çarpışma kontrolü
      if (pu.y + POWERUP_SIZE / 2 > canvas.height - PADDLE_HEIGHT - 10 &&
        pu.x > state.paddleX && pu.x < state.paddleX + state.paddleWidth) {
        // Power-up alındı!
        if (pu.type === PowerUpType.EXTEND) {
          state.activePowerUps.extend = 600; // ~10 saniye
        } else if (pu.type === PowerUpType.SLOW) {
          state.activePowerUps.slow = 300; // ~5 saniye
          // Topu yavaşlat
          state.dx *= 0.6;
          state.dy *= 0.6;
        }
        return false;
      }

      // Ekrandan çıktı mı?
      if (pu.y > canvas.height) {
        return false;
      }

      return true;
    });

    // Paddle'ı çiz (aktif power-up'a göre renk değiştir)
    ctx.beginPath();
    ctx.rect(state.paddleX, canvas.height - PADDLE_HEIGHT - 10, state.paddleWidth, PADDLE_HEIGHT);
    if (state.activePowerUps.extend > 0) {
      ctx.fillStyle = '#22c55e'; // Yeşil - uzatılmış
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#22c55e';
    } else if (state.activePowerUps.slow > 0) {
      ctx.fillStyle = '#3b82f6'; // Mavi - yavaşlatılmış
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#3b82f6';
    } else {
      ctx.fillStyle = '#94a3b8';
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();

    // Topu çiz
    ctx.beginPath();
    ctx.arc(state.ballX, state.ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = state.activePowerUps.slow > 0 ? '#3b82f6' : '#f8fafc';
    ctx.shadowBlur = 15;
    ctx.shadowColor = state.activePowerUps.slow > 0 ? '#3b82f6' : '#fff';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();

    // Aktif power-up göstergesi
    let powerUpText = '';
    if (state.activePowerUps.extend > 0) {
      powerUpText += `🟢 UZATMA: ${Math.ceil(state.activePowerUps.extend / 60)}s `;
    }
    if (state.activePowerUps.slow > 0) {
      powerUpText += `🔵 YAVAŞ: ${Math.ceil(state.activePowerUps.slow / 60)}s`;
    }
    if (powerUpText) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(powerUpText, canvas.width / 2, 30);
    }

    if (isStartedRef.current) {
      // Yavaşlatma efekti
      const speedMultiplier = state.activePowerUps.slow > 0 ? 0.5 : 1;
      state.ballX += state.dx * speedMultiplier;
      state.ballY += state.dy * speedMultiplier;

      // Duvar çarpışmaları
      if (state.ballX + state.dx > canvas.width - BALL_RADIUS || state.ballX + state.dx < BALL_RADIUS) {
        state.dx = -state.dx;
      }
      if (state.ballY + state.dy < BALL_RADIUS) {
        state.dy = -state.dy;
      } else if (state.ballY + state.dy > canvas.height - BALL_RADIUS - 10) {
        if (state.ballX > state.paddleX && state.ballX < state.paddleX + state.paddleWidth) {
          state.dy = -state.dy;
          const deltaX = state.ballX - (state.paddleX + state.paddleWidth / 2);
          state.dx = deltaX * 0.15;
        } else {
          if (requestRef.current !== undefined) {
            cancelAnimationFrame(requestRef.current);
          }
          onGameOver(state.history, state.score);
          return;
        }
      }

      // Blok çarpışmaları
      state.blocks.forEach(block => {
        if (!block.active) return;
        if (state.ballX > block.x && state.ballX < block.x + block.width && state.ballY > block.y && state.ballY < block.y + block.height) {
          state.dy = -state.dy;
          block.active = false;
          state.score++;
          state.history.push(block.colorName);
          onBlockHit(block.colorName);

          // Power-up düşür
          if (block.hasPowerUp) {
            state.powerUps.push({
              id: `pu-${Date.now()}`,
              x: block.x + block.width / 2,
              y: block.y + block.height,
              type: block.hasPowerUp,
              active: true
            });
          }

          if (state.blocks.every(b => !b.active)) {
            if (requestRef.current !== undefined) {
              cancelAnimationFrame(requestRef.current);
            }
            onGameOver(state.history, state.score);
            return;
          }
        }
      });
    }

    requestRef.current = requestAnimationFrame(update);
  }, [onGameOver, onBlockHit]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [update]);

  const handleStart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = gameStateRef.current;
    const paddleCenterX = state.paddleX + state.paddleWidth / 2;
    const canvasCenterX = canvas.width / 2;

    state.ballX = paddleCenterX;
    state.ballY = canvas.height - 40;

    const baseSpeed = 4 + level;
    const offset = paddleCenterX - canvasCenterX;

    state.dx = -(offset * 0.02);
    state.dy = -baseSpeed;

    if (Math.abs(state.dx) < 2) {
      state.dx = (Math.random() > 0.5 ? 1 : -1) * 2;
    }

    setIsStarted(true);
    isStartedRef.current = true;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="mb-4 flex gap-8 font-orbitron text-cyan-400">
        <div className="text-xl">SKOR: {gameStateRef.current.score}</div>
        <div className="text-xl">SEVİYE: {level}</div>
      </div>

      <div
        className="relative bg-slate-900/50 p-2 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-sm cursor-pointer"
        onClick={handleStart}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={`max-w-full h-auto block rounded-lg ${isStarted ? 'cursor-none' : 'cursor-pointer'}`}
        />

        {!isStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg transition-opacity duration-300">
            <div className="text-center p-8 border-2 border-cyan-500/30 rounded-2xl bg-slate-900/80 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              <p className="text-white text-4xl font-orbitron mb-4 tracking-widest">HAZIR MISIN?</p>
              <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron rounded-lg animate-bounce shadow-lg">
                TOPU FIRLATMAK İÇİN TIKLA
              </button>
              <p className="text-slate-400 text-sm mt-4">
                🧠 Logolu blokları kır ve güç topla!
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-slate-400 text-sm max-w-lg text-center">
        <span className="text-green-400">🟢 UZAT</span> = Paddle büyür |
        <span className="text-blue-400"> 🔵 YAVAŞ</span> = Top yavaşlar
      </div>
    </div>
  );
};

export default BreakoutGame;
