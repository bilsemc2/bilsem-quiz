
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Point, Bubble, Particle, BubbleColor, GamePhase } from './types';
import { HelpCircle, Target } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { GAME_CONFIG } from './constants';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants';

const COLOR_CONFIG: Record<BubbleColor, { hex: string; points: number; label: string }> = {
  red: { hex: '#ef5350', points: 100, label: 'Kırmızı' },
  blue: { hex: '#42a5f5', points: 150, label: 'Mavi' },
  green: { hex: '#66bb6a', points: 200, label: 'Yeşil' },
  yellow: { hex: '#ffee58', points: 250, label: 'Sarı' },
  purple: { hex: '#ab47bc', points: 300, label: 'Mor' },
  orange: { hex: '#ffa726', points: 500, label: 'Turuncu' }
};

const COLOR_KEYS: BubbleColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const OruntuluTop: React.FC = () => {
  const { saveGamePlay } = useGamePersistence();
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game Refs
  const ballPos = useRef<Point>({ x: 0, y: 0 });
  const ballVel = useRef<Point>({ x: 0, y: 0 });
  const anchorPos = useRef<Point>({ x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);
  const isFlying = useRef<boolean>(false);
  const bubbles = useRef<Bubble[]>([]);
  const particles = useRef<Particle[]>([]);
  const scoreRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const hasSavedRef = useRef(false);
  const isResolvingRef = useRef(false);

  // Responsive layout refs — recalculated on resize
  const dynamicRadiusRef = useRef(GAME_CONFIG.BUBBLE_RADIUS);
  const gridOffsetYRef = useRef(300);
  const gridColsRef = useRef(GAME_CONFIG.GRID_COLS);

  // Puzzle State
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [currentPattern, setCurrentPattern] = useState<BubbleColor[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const targetColorRef = useRef<BubbleColor | null>(null);

  // Auto-start from Hub
  useEffect(() => {
    if (location.state?.autoStart && phase === 'idle') {
      startGame();
    }
  }, [location.state, phase]);

  const startGame = () => {
    window.scrollTo(0, 0);
    setScore(0);
    scoreRef.current = 0;
    setLevel(1);
    setLives(3);
    setPhase('playing');
    setFeedback(null);
    hasSavedRef.current = false;
    isResolvingRef.current = false;
    gameStartTimeRef.current = Date.now();
    initGrid(canvasRef.current?.width || 800);
  };

  const endGame = useCallback(() => {
    if (isResolvingRef.current) return;
    isResolvingRef.current = true;
    setPhase('game_over');
    if (!hasSavedRef.current) {
      hasSavedRef.current = true;
      saveGamePlay({
        game_id: 'oruntulu-top',
        score_achieved: scoreRef.current,
        duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
        metadata: { level_reached: level }
      });
    }
  }, [level, saveGamePlay]);

  const generatePattern = useCallback(() => {
    const types = ['abab', 'abcabc', 'aabb', 'abccab'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = [...COLOR_KEYS].sort(() => 0.5 - Math.random());

    let pattern: BubbleColor[] = [];
    let correct: BubbleColor;

    if (type === 'abab') {
      pattern = [colors[0], colors[1], colors[0], colors[1]];
      correct = colors[0];
    } else if (type === 'abcabc') {
      pattern = [colors[0], colors[1], colors[2], colors[0], colors[1]];
      correct = colors[2];
    } else if (type === 'aabb') {
      pattern = [colors[0], colors[0], colors[1], colors[1]];
      correct = colors[0];
    } else {
      pattern = [colors[0], colors[1], colors[2], colors[2], colors[0]];
      correct = colors[1];
    }

    setCurrentPattern(pattern);
    targetColorRef.current = correct;
  }, []);

  const getBubblePos = (row: number, col: number, width: number) => {
    const r = dynamicRadiusRef.current;
    const cols = gridColsRef.current;
    const xOffset = (width - (cols * r * 2)) / 2 + r;
    const isOdd = row % 2 !== 0;
    const x = xOffset + col * (r * 2) + (isOdd ? r : 0);
    const y = r + row * (r * Math.sqrt(3)) + gridOffsetYRef.current;
    return { x, y };
  };

  const ensureTargetAccessible = useCallback((newBubbles: Bubble[], targetColor: BubbleColor) => {
    const bottomRowBubbles = newBubbles.filter(b => b.row >= 3 && b.active);
    const targetBubblesInBottom = bottomRowBubbles.filter(b => b.color === targetColor);
    const minRequired = 3;

    if (targetBubblesInBottom.length < minRequired) {
      const needed = minRequired - targetBubblesInBottom.length;
      const otherColorBubbles = bottomRowBubbles.filter(b => b.color !== targetColor);
      const shuffled = otherColorBubbles.sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
        shuffled[i].color = targetColor;
      }
    }

    const cols = gridColsRef.current;
    const edgeBubbles = newBubbles.filter(b =>
      b.active && (b.col === 0 || b.col === cols - 1 || (b.row % 2 !== 0 && b.col === cols - 2))
    );
    const targetEdgeBubbles = edgeBubbles.filter(b => b.color === targetColor);

    if (targetEdgeBubbles.length < 2) {
      const needed = 2 - targetEdgeBubbles.length;
      const otherEdgeBubbles = edgeBubbles.filter(b => b.color !== targetColor);
      const shuffled = otherEdgeBubbles.sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
        shuffled[i].color = targetColor;
      }
    }
  }, []);

  const initGrid = useCallback((width: number) => {
    const newBubbles: Bubble[] = [];
    const gridCols = gridColsRef.current;
    for (let r = 0; r < 5; r++) {
      const cols = r % 2 !== 0 ? gridCols - 1 : gridCols;
      for (let c = 0; c < cols; c++) {
        const { x, y } = getBubblePos(r, c, width);
        newBubbles.push({
          id: `${r}-${c}`,
          row: r, col: c, x, y,
          color: COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)],
          active: true
        });
      }
    }
    bubbles.current = newBubbles;
    generatePattern();

    if (targetColorRef.current) {
      ensureTargetAccessible(newBubbles, targetColorRef.current);
    }
  }, [generatePattern, ensureTargetAccessible]);

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 20; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0, color
      });
    }
  };

  const isNeighbor = (a: Bubble, b: Bubble) => {
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    if (Math.abs(dr) > 1) return false;
    if (dr === 0) return Math.abs(dc) === 1;
    return a.row % 2 !== 0 ? (dc === 0 || dc === 1) : (dc === -1 || dc === 0);
  };

  const handleCorrect = (hitBubble: Bubble) => {
    const toCheck = [hitBubble];
    const visited = new Set<string>();
    const matches: Bubble[] = [];
    const color = hitBubble.color;

    while (toCheck.length > 0) {
      const curr = toCheck.pop()!;
      if (visited.has(curr.id)) continue;
      visited.add(curr.id);
      if (curr.color === color) {
        matches.push(curr);
        const neighbors = bubbles.current.filter(b => b.active && !visited.has(b.id) && isNeighbor(curr, b));
        toCheck.push(...neighbors);
      }
    }

    matches.forEach(b => {
      b.active = false;
      createExplosion(b.x, b.y, COLOR_CONFIG[color].hex);
    });

    const earned = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, level) + (matches.length * 100);
    scoreRef.current += earned;
    setScore(scoreRef.current);
    setLevel(prev => prev + 1);
    setFeedback({ type: 'success', msg: `Harika! +${earned} puan 🎯` });

    setTimeout(() => {
      setFeedback(null);
      isResolvingRef.current = false;

      if (bubbles.current.filter(b => b.active).length < 10) {
        initGrid(canvasRef.current?.width || 800);
      } else {
        generatePattern();
        if (targetColorRef.current) {
          ensureTargetAccessible(bubbles.current, targetColorRef.current);
        }
      }
    }, 1500);
  };

  const handleWrong = () => {
    setLives(prev => {
      const next = Math.max(0, prev - 1);
      if (next === 0) {
        endGame();
      }
      return next;
    });
    setFeedback({ type: 'error', msg: 'Yanlış renk! Örüntüyü kontrol et.' });
    setTimeout(() => {
      setFeedback(null);
      isResolvingRef.current = false;
    }, 1500);
  };

  const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colorKey: BubbleColor) => {
    const config = COLOR_CONFIG[colorKey];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = config.hex;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
  };

  const drawWhiteBall = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
  };

  // ─── Canvas render loop ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Responsive scaling: adapt radius and grid to screen size
      const isMobile = canvas.width < 600;
      const isTablet = canvas.width < 900;
      dynamicRadiusRef.current = isMobile ? 14 : isTablet ? 18 : GAME_CONFIG.BUBBLE_RADIUS;
      gridColsRef.current = isMobile ? 8 : isTablet ? 10 : GAME_CONFIG.GRID_COLS;
      // Y offset: leave room for HUD + pattern panel
      gridOffsetYRef.current = isMobile ? Math.max(canvas.height * 0.35, 240) : Math.min(canvas.height * 0.3, 300);

      anchorPos.current = { x: canvas.width / 2, y: canvas.height - (isMobile ? 80 : GAME_CONFIG.SLINGSHOT_BOTTOM_OFFSET) };
      if (!isFlying.current && !isDragging.current) {
        ballPos.current = { ...anchorPos.current };
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    initGrid(canvas.width);

    let animationFrame: number;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Balonları Çiz
      const dr = dynamicRadiusRef.current;
      bubbles.current.forEach(b => {
        if (b.active) drawBubble(ctx, b.x, b.y, dr - 1, b.color);
      });

      // Kılavuz Çizgisi
      if (isDragging.current) {
        const dx = anchorPos.current.x - ballPos.current.x;
        const dy = anchorPos.current.y - ballPos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 20) {
          let velX = (dx / dist);
          let velY = (dy / dist);
          if (velY > 0) velY = -Math.abs(velY);

          const trajectoryPoints: { x: number; y: number }[] = [];
          const bouncePoints: { x: number; y: number }[] = [];
          let currentX = anchorPos.current.x;
          let currentY = anchorPos.current.y;
          const stepSize = 10;
          const maxSteps = 100;

          trajectoryPoints.push({ x: currentX, y: currentY });

          for (let i = 0; i < maxSteps; i++) {
            const nextX = currentX + velX * stepSize;
            const nextY = currentY + velY * stepSize;

            if (nextX < dr) {
              const t = (dr - currentX) / (velX * stepSize);
              const bounceY = currentY + velY * stepSize * t;
              bouncePoints.push({ x: dr, y: bounceY });
              trajectoryPoints.push({ x: dr, y: bounceY });
              currentX = dr + (nextX - dr) * -1;
              currentY = nextY;
              velX *= -1;
            } else if (nextX > canvas.width - dr) {
              const rightWall = canvas.width - dr;
              const t = (rightWall - currentX) / (velX * stepSize);
              const bounceY = currentY + velY * stepSize * t;
              bouncePoints.push({ x: rightWall, y: bounceY });
              trajectoryPoints.push({ x: rightWall, y: bounceY });
              currentX = rightWall - (nextX - rightWall);
              currentY = nextY;
              velX *= -1;
            } else {
              currentX = nextX;
              currentY = nextY;
            }

            trajectoryPoints.push({ x: currentX, y: currentY });
            if (currentY < gridOffsetYRef.current + 50) break;
          }

          // Trajectory glow
          ctx.save();
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
          ctx.beginPath();
          ctx.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);
          for (let i = 1; i < trajectoryPoints.length; i++) ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 4;
          ctx.setLineDash([12, 8]);
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);
          for (let i = 1; i < trajectoryPoints.length; i++) ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
          ctx.strokeStyle = 'rgba(100, 220, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 8]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          // Bounce markers
          bouncePoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 150, 50, 0.3)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
            const bounceGrad = ctx.createRadialGradient(point.x - 2, point.y - 2, 0, point.x, point.y, 8);
            bounceGrad.addColorStop(0, '#ffdd00');
            bounceGrad.addColorStop(1, '#ff8800');
            ctx.fillStyle = bounceGrad;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          // Aim target
          if (trajectoryPoints.length > 2) {
            const endPoint = trajectoryPoints[trajectoryPoints.length - 1];
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(endPoint.x - 8, endPoint.y);
            ctx.lineTo(endPoint.x + 8, endPoint.y);
            ctx.moveTo(endPoint.x, endPoint.y - 8);
            ctx.lineTo(endPoint.x, endPoint.y + 8);
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }

      // Uçuş Fiziği
      if (isFlying.current) {
        const steps = 10;
        let hit = false;
        for (let i = 0; i < steps; i++) {
          ballPos.current.x += ballVel.current.x / steps;
          ballPos.current.y += ballVel.current.y / steps;

          if (ballPos.current.x < dr || ballPos.current.x > canvas.width - dr) ballVel.current.x *= -1;

          const hitBubble = bubbles.current.find(b => b.active && Math.sqrt((ballPos.current.x - b.x) ** 2 + (ballPos.current.y - b.y) ** 2) < dr * 1.7);

          if (hitBubble) {
            hit = true;
            isResolvingRef.current = true;
            if (hitBubble.color === targetColorRef.current) {
              handleCorrect(hitBubble);
            } else {
              handleWrong();
            }
            break;
          }
        }

        if (hit || ballPos.current.y < 0 || ballPos.current.y > canvas.height) {
          isFlying.current = false;
          ballPos.current = { ...anchorPos.current };
          ballVel.current = { x: 0, y: 0 };
        }
      }

      // Sapan Lastiği
      if (!isFlying.current) {
        ctx.beginPath();
        ctx.moveTo(anchorPos.current.x - 30, anchorPos.current.y);
        ctx.lineTo(ballPos.current.x, ballPos.current.y);
        ctx.lineTo(anchorPos.current.x + 30, anchorPos.current.y);
        ctx.strokeStyle = isDragging.current ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      drawWhiteBall(ctx, ballPos.current.x, ballPos.current.y, dr);

      // Sapan Direği
      ctx.beginPath();
      ctx.moveTo(anchorPos.current.x, canvas.height);
      ctx.lineTo(anchorPos.current.x, anchorPos.current.y + 20);
      ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke();

      // Parçacıklar
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) particles.current.splice(i, 1);
        else {
          ctx.globalAlpha = p.life;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.random() * 4, 0, Math.PI * 2);
          ctx.fillStyle = p.color; ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
      animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
    };
  }, [initGrid, generatePattern]);

  const handleStart = (x: number, y: number) => {
    if (isFlying.current || feedback || isResolvingRef.current) return;
    const d = Math.sqrt((x - ballPos.current.x) ** 2 + (y - ballPos.current.y) ** 2);
    if (d < 60) isDragging.current = true;
  };

  const handleMove = (x: number, y: number) => {
    if (!isDragging.current || phase !== 'playing') return;
    const dx = x - anchorPos.current.x;
    const dy = y - anchorPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const limit = Math.min(dist, GAME_CONFIG.MAX_DRAG_DIST);
    const angle = Math.atan2(dy, dx);
    ballPos.current = {
      x: anchorPos.current.x + Math.cos(angle) * limit,
      y: anchorPos.current.y + Math.sin(angle) * limit
    };
  };

  const handleEnd = () => {
    if (!isDragging.current || phase !== 'playing') return;
    isDragging.current = false;
    const dx = anchorPos.current.x - ballPos.current.x;
    const dy = anchorPos.current.y - ballPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 30) {
      isFlying.current = true;
      const power = dist / GAME_CONFIG.MAX_DRAG_DIST;
      const mult = GAME_CONFIG.MIN_FORCE_MULT + (GAME_CONFIG.MAX_FORCE_MULT - GAME_CONFIG.MIN_FORCE_MULT) * power;
      ballVel.current = { x: dx * mult, y: dy * mult };
    } else {
      ballPos.current = { ...anchorPos.current };
    }
  };

  // ─── Shell status mapping ────────────────────────────────────────────
  const shellStatus: 'START' | 'PLAYING' | 'GAME_OVER' =
    phase === 'idle' ? 'START' :
      phase === 'game_over' ? 'GAME_OVER' : 'PLAYING';

  return (
    <ArcadeGameShell
      gameState={{ score, level, lives, status: shellStatus }}
      gameMetadata={{
        id: 'oruntulu-top',
        title: 'ÖRÜNTÜ AVCISI',
        description: (
          <>
            <p>1. Örüntüdeki <span className="text-rose-500 bg-white px-2 py-0.5 rounded border-2 border-black/10 rotate-1 inline-block">eksik balonu</span> bul.</p>
            <p>2. Sapanla o renkteki balonu vur!</p>
            <p>3. Yanlış renk can kaybettirir. <span className="text-rose-500 font-black">Dikkatli ol!</span></p>
          </>
        ),
        tuzoCode: '5.3.1 Örüntü Tamamlama',
        icon: <Target className="w-14 h-14 text-black" strokeWidth={3} />,
        iconBgColor: 'bg-emerald-400',
        containerBgColor: 'bg-sky-200 dark:bg-slate-900'
      }}
      onStart={startGame}
      onRestart={startGame}
      showLevel={true}
      showLives={true}
    >
      {/* Full-screen canvas game area */}
      <div ref={containerRef} className="absolute inset-0 overflow-hidden touch-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair touch-none"
          onMouseDown={e => { if (phase === 'playing') handleStart(e.clientX, e.clientY); }}
          onMouseMove={e => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onTouchStart={e => { if (phase === 'playing') handleStart(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchMove={e => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        />

        {/* Feedback Banner */}
        <ArcadeFeedbackBanner message={feedback?.msg ?? null} type={feedback?.type} />

        {/* Pattern Panel */}
        {phase === 'playing' && (
          <div className="absolute top-28 sm:top-20 lg:top-16 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-20 pointer-events-none">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-[2rem] border-2 border-black/10 shadow-neo-sm dark:shadow-[8px_8px_0_#0f172a] rotate-1 transition-colors duration-300 pointer-events-auto"
            >
              <div className="flex flex-col items-center gap-3 sm:gap-5">
                <span className="text-black dark:text-white bg-sky-100 dark:bg-slate-700 px-3 py-1 rounded-lg border-2 border-black/10 text-[10px] uppercase font-black tracking-widest shadow-neo-sm transform -rotate-1 transition-colors duration-300">Örüntü Görevi</span>
                <div className="flex items-center gap-2 sm:gap-4">
                  {currentPattern.map((color, idx) => (
                    <React.Fragment key={idx}>
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-black/10 relative"
                        style={{ backgroundColor: COLOR_CONFIG[color].hex }}
                      >
                        <div className="absolute top-1 left-2 w-3 h-3 bg-white/60 rounded-full" />
                      </div>
                      <div className="w-2 h-1 bg-black rounded-full" />
                    </React.Fragment>
                  ))}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-dashed border-black/10 flex items-center justify-center animate-pulse bg-slate-100 dark:bg-slate-700 transition-colors duration-300">
                    <HelpCircle className="w-6 h-6 text-black dark:text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bottom info hint */}
        {phase === 'playing' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-black dark:text-white bg-white/80 dark:bg-slate-800/80 backdrop-blur px-4 py-2 rounded-xl border-2 border-black/10 dark:border-slate-700 shadow-neo-sm text-[10px] uppercase tracking-widest font-black pointer-events-none text-center transform -rotate-1 whitespace-nowrap hidden sm:block transition-colors duration-300">
            Beyaz topu örüntüye uygun renkteki bir balona fırlat!
          </div>
        )}
      </div>
    </ArcadeGameShell>
  );
};

export default OruntuluTop;
