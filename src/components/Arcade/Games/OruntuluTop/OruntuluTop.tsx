
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Point, Bubble, Particle, BubbleColor, GamePhase } from './types';
import { Trophy, Play, RefreshCw, HelpCircle, CheckCircle2, AlertCircle, ChevronLeft, Heart, Target } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import { GAME_CONFIG } from './constants';

const COLOR_CONFIG: Record<BubbleColor, { hex: string, points: number, label: string }> = {
  red: { hex: '#ef5350', points: 100, label: 'Kırmızı' },
  blue: { hex: '#42a5f5', points: 150, label: 'Mavi' },
  green: { hex: '#66bb6a', points: 200, label: 'Yeşil' },
  yellow: { hex: '#ffee58', points: 250, label: 'Sarı' },
  purple: { hex: '#ab47bc', points: 300, label: 'Mor' },
  orange: { hex: '#ffa726', points: 500, label: 'Turuncu' }
};

const COLOR_KEYS: BubbleColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const adjustColor = (color: string, amount: number) => {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  const componentToHex = (c: number) => {
    const h = c.toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

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

  // Puzzle State
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [currentPattern, setCurrentPattern] = useState<BubbleColor[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

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
    gameStartTimeRef.current = Date.now();
    initGrid(canvasRef.current?.width || 800);
  };

  const endGame = useCallback(() => {
    setPhase('game_over');
    saveGamePlay({
      game_id: 'oruntulu-top',
      score_achieved: scoreRef.current,
      duration_seconds: (Date.now() - gameStartTimeRef.current) / 1000,
      metadata: { level_reached: level }
    });
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
    const xOffset = (width - (GAME_CONFIG.GRID_COLS * GAME_CONFIG.BUBBLE_RADIUS * 2)) / 2 + GAME_CONFIG.BUBBLE_RADIUS;
    const isOdd = row % 2 !== 0;
    const x = xOffset + col * (GAME_CONFIG.BUBBLE_RADIUS * 2) + (isOdd ? GAME_CONFIG.BUBBLE_RADIUS : 0);
    const y = GAME_CONFIG.BUBBLE_RADIUS + row * (GAME_CONFIG.BUBBLE_RADIUS * Math.sqrt(3)) + 300;
    return { x, y };
  };

  // Hedef rengi erişilebilir konumlara yerleştir (alt satırlar: 3-4)
  const ensureTargetAccessible = useCallback((newBubbles: Bubble[], targetColor: BubbleColor) => {
    // Alt satırlardaki (row 3 ve 4) balonları bul
    const bottomRowBubbles = newBubbles.filter(b => b.row >= 3 && b.active);

    // Hedef renkteki balonları say
    const targetBubblesInBottom = bottomRowBubbles.filter(b => b.color === targetColor);

    // Eğer alt satırlarda yeterli hedef renk yoksa, bazı balonları hedef renge çevir
    const minRequired = 3; // En az 3 tane hedef renk alt satırlarda olmalı

    if (targetBubblesInBottom.length < minRequired) {
      const needed = minRequired - targetBubblesInBottom.length;

      // Alt satırlardaki farklı renkteki balonlardan rastgele seç
      const otherColorBubbles = bottomRowBubbles.filter(b => b.color !== targetColor);
      const shuffled = otherColorBubbles.sort(() => 0.5 - Math.random());

      for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
        shuffled[i].color = targetColor;
      }
    }

    // Ayrıca kenar balonlarından da en az 1-2 tane hedef renk olsun
    const edgeBubbles = newBubbles.filter(b =>
      b.active && (b.col === 0 || b.col === GAME_CONFIG.GRID_COLS - 1 || (b.row % 2 !== 0 && b.col === GAME_CONFIG.GRID_COLS - 2))
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
    for (let r = 0; r < 5; r++) {
      const cols = r % 2 !== 0 ? GAME_CONFIG.GRID_COLS - 1 : GAME_CONFIG.GRID_COLS;
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

    // Pattern oluşturulduktan sonra hedef rengin erişilebilir olmasını garanti et
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

  const handleCorrect = (hitBubble: Bubble) => {
    // Vurulan balonla aynı renkteki tüm bitişik balonları patlat
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

    scoreRef.current += 1000 + (matches.length * 100);
    setScore(scoreRef.current);
    setLevel(prev => prev + 1);
    setFeedback({ type: 'success', msg: 'DOĞRU! Örüntü tamamlandı.' });

    setTimeout(() => {
      setFeedback(null);

      if (bubbles.current.filter(b => b.active).length < 10) {
        initGrid(canvasRef.current?.width || 800);
      } else {
        generatePattern();
        // Yeni pattern için hedef rengin erişilebilir olmasını garanti et
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
    setFeedback({ type: 'error', msg: 'YANLIŞ RENK! Örüntüyü kontrol et.' });
    setTimeout(() => setFeedback(null), 1500);
  };

  const isNeighbor = (a: Bubble, b: Bubble) => {
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    if (Math.abs(dr) > 1) return false;
    if (dr === 0) return Math.abs(dc) === 1;
    return a.row % 2 !== 0 ? (dc === 0 || dc === 1) : (dc === -1 || dc === 0);
  };

  const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colorKey: BubbleColor) => {
    const config = COLOR_CONFIG[colorKey];
    const baseColor = config.hex;
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, baseColor);
    grad.addColorStop(1, adjustColor(baseColor, -60));

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = adjustColor(baseColor, -80);
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawWhiteBall = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#f0f0f0');
    grad.addColorStop(1, '#cccccc');

    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      anchorPos.current = { x: canvas.width / 2, y: canvas.height - GAME_CONFIG.SLINGSHOT_BOTTOM_OFFSET };
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
      bubbles.current.forEach(b => {
        if (b.active) drawBubble(ctx, b.x, b.y, GAME_CONFIG.BUBBLE_RADIUS - 1, b.color);
      });

      // Kılavuz Çizgisi - Duvar Yansımalı Trajectory
      if (isDragging.current) {
        const dx = anchorPos.current.x - ballPos.current.x;
        const dy = anchorPos.current.y - ballPos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 20) {
          // Trajectory should go in the OPPOSITE direction of drag (slingshot physics)
          // dx, dy already point from ball to anchor (the launch direction)
          const speed = 1; // normalized speed
          let velX = (dx / dist) * speed;
          let velY = (dy / dist) * speed;

          // Make sure we're going upward (negative Y)
          if (velY > 0) {
            velY = -Math.abs(velY);
          }

          // Calculate trajectory with wall bounces
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

            // Wall bounce detection - LEFT wall
            if (nextX < GAME_CONFIG.BUBBLE_RADIUS) {
              // Calculate exact bounce point
              const t = (GAME_CONFIG.BUBBLE_RADIUS - currentX) / (velX * stepSize);
              const bounceY = currentY + velY * stepSize * t;
              bouncePoints.push({ x: GAME_CONFIG.BUBBLE_RADIUS, y: bounceY });
              trajectoryPoints.push({ x: GAME_CONFIG.BUBBLE_RADIUS, y: bounceY });

              currentX = GAME_CONFIG.BUBBLE_RADIUS + (nextX - GAME_CONFIG.BUBBLE_RADIUS) * -1;
              currentY = nextY;
              velX *= -1; // Bounce!
            }
            // Wall bounce detection - RIGHT wall
            else if (nextX > canvas.width - GAME_CONFIG.BUBBLE_RADIUS) {
              const rightWall = canvas.width - GAME_CONFIG.BUBBLE_RADIUS;
              const t = (rightWall - currentX) / (velX * stepSize);
              const bounceY = currentY + velY * stepSize * t;
              bouncePoints.push({ x: rightWall, y: bounceY });
              trajectoryPoints.push({ x: rightWall, y: bounceY });

              currentX = rightWall - (nextX - rightWall);
              currentY = nextY;
              velX *= -1; // Bounce!
            }
            else {
              currentX = nextX;
              currentY = nextY;
            }

            trajectoryPoints.push({ x: currentX, y: currentY });

            // Stop when reaching bubble area
            if (currentY < 350) break;
          }

          // Draw trajectory with glow
          ctx.save();

          // Outer glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';

          // Main trajectory line
          ctx.beginPath();
          ctx.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);
          for (let i = 1; i < trajectoryPoints.length; i++) {
            ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
          }
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 4;
          ctx.setLineDash([12, 8]);
          ctx.lineCap = 'round';
          ctx.stroke();

          // Inner bright line
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);
          for (let i = 1; i < trajectoryPoints.length; i++) {
            ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
          }
          ctx.strokeStyle = 'rgba(100, 220, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 8]);
          ctx.stroke();

          ctx.setLineDash([]);
          ctx.restore();

          // Draw bounce markers (bright orange circles at wall bounce points)
          bouncePoints.forEach(point => {
            // Outer glow
            ctx.beginPath();
            ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 150, 50, 0.3)';
            ctx.fill();

            // Inner circle
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

          // Draw aim target at end of trajectory
          if (trajectoryPoints.length > 2) {
            const endPoint = trajectoryPoints[trajectoryPoints.length - 1];
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Crosshair
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

          // Duvar Sekmesi
          if (ballPos.current.x < GAME_CONFIG.BUBBLE_RADIUS || ballPos.current.x > canvas.width - GAME_CONFIG.BUBBLE_RADIUS) ballVel.current.x *= -1;

          // Çarpışma Kontrolü
          const hitBubble = bubbles.current.find(b => b.active && Math.sqrt((ballPos.current.x - b.x) ** 2 + (ballPos.current.y - b.y) ** 2) < GAME_CONFIG.BUBBLE_RADIUS * 1.7);

          if (hitBubble) {
            hit = true;
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

      // Atılan Beyaz Top
      drawWhiteBall(ctx, ballPos.current.x, ballPos.current.y, GAME_CONFIG.BUBBLE_RADIUS);

      // Sapan Direği
      ctx.beginPath();
      ctx.moveTo(anchorPos.current.x, canvas.height);
      ctx.lineTo(anchorPos.current.x, anchorPos.current.y + 20);
      ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke();

      // Patlama Parçacıkları
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
    if (isFlying.current || feedback) return;
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

  return (
    <div ref={containerRef} className="w-full h-screen bg-[#050505] overflow-hidden relative font-sans">
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

      {/* Arcade HUD */}
      <div className="absolute top-16 sm:top-20 left-2 sm:left-4 right-2 sm:right-4 z-30 flex justify-between items-center pointer-events-none">
        <div className="flex flex-wrap gap-2 sm:gap-4 pointer-events-auto">
          <Link to="/bilsem-zeka" className="bg-white/10 backdrop-blur-md px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 border border-white/20 hover:bg-white/20 transition-all">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            <span className="font-bold text-white/80 text-xs sm:text-sm">BİLSEM</span>
          </Link>
          <div className="bg-white/10 backdrop-blur-md px-3 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 border border-white/20">
            <Trophy className="text-yellow-500 w-4 h-4 sm:w-6 sm:h-6" />
            <span className="text-base sm:text-xl font-bold text-white leading-none">{score}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 border border-white/20">
            <Target className="text-indigo-400 w-4 h-4 sm:w-6 sm:h-6" />
            <span className="text-base sm:text-xl font-bold text-white leading-none">Lv {level}</span>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-3 sm:px-5 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1 sm:gap-2 border border-red-500/30">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 sm:w-6 sm:h-6 transition-all duration-300 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-600 opacity-30'}`}
            />
          ))}
        </div>
      </div>

      {/* Üst Örüntü Paneli */}
      {phase === 'playing' && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-20">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#111]/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-5">
              <span className="text-white/40 text-[10px] uppercase font-black tracking-[0.4em]">Örüntü Görevi</span>
              <div className="flex items-center gap-4">
                {currentPattern.map((color, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      className="w-11 h-11 rounded-full shadow-lg border border-white/5 transition-transform hover:scale-105"
                      style={{ background: `radial-gradient(circle at 30% 30%, ${COLOR_CONFIG[color].hex}, ${adjustColor(COLOR_CONFIG[color].hex, -40)})` }}
                    />
                    <div className="w-2 h-0.5 bg-white/10 rounded-full" />
                  </React.Fragment>
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center animate-pulse bg-white/5 shadow-inner">
                  <HelpCircle className="w-6 h-6 text-white/30" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Geri Bildirim Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 transition-all"
          >
            <div className={`flex flex-col items-center gap-5 p-10 rounded-[3rem] backdrop-blur-3xl border shadow-2xl ${feedback.type === 'success' ? 'bg-green-500/10 border-green-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-20 h-20 text-green-500" /> : <AlertCircle className="w-20 h-20 text-red-500" />}
              <p className={`text-2xl font-black tracking-tight ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{feedback.msg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-lg w-full text-center border border-white/20">
              <div
                className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[40%] flex items-center justify-center mx-auto mb-8"
               
              >
                <Target className="w-14 h-14 text-white" />
              </div>
              <h1 className="text-5xl bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-6 tracking-tighter font-black uppercase">Örüntü Avcısı</h1>
              <div className="space-y-4 text-slate-400 mb-10 text-lg font-medium bg-white/5 p-6 rounded-2xl border border-white/10">
                <p>1. Örüntüdeki <span className="text-indigo-400 font-bold">eksik balonu</span> bul.</p>
                <p>2. Sapanla o <span className="text-white">renkteki</span> balonu vur!</p>
                <p>3. Yanlış renk can kaybettirir. <span className="text-red-400">Dikkatli ol!</span></p>
              </div>
              <div className="bg-indigo-500/20 text-indigo-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30">
                TUZÖ 5.3.1 Örüntü Tamamlama
              </div>
              <button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-3xl py-5 rounded-2xl transform active:scale-95 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest"
               
              >
                <Play fill="white" className="w-8 h-8" /> BAŞLA!
              </button>
              <Link to="/bilsem-zeka" className="mt-8 text-slate-500 hover:text-white transition-colors block text-sm font-bold uppercase tracking-widest">Geri Dön</Link>
            </div>
          </motion.div>
        )}

        {phase === 'game_over' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-xl z-50 flex items-center justify-center p-6"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-lg w-full text-center border border-white/20">
              <h2 className="text-6xl text-rose-400 mb-4 font-black tracking-tighter uppercase">OYUN BİTTİ</h2>
              <p className="text-2xl text-slate-400 mb-8 font-bold italic">Örüntüyü kaçırdın!</p>

              <div className="bg-white/5 rounded-3xl p-8 mb-10 border border-white/10">
                <p className="text-rose-400/60 uppercase text-xs font-black tracking-[0.2em] mb-2">TOPLAM PUANIN</p>
                <p className="text-8xl font-black text-white tabular-nums tracking-tighter">{score}</p>
                <div className="flex justify-center gap-4 mt-6">
                  <div className="bg-white/10 px-6 py-2 rounded-full border border-white/20 text-amber-400 font-bold">
                    Seviye {level}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link to="/bilsem-zeka" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xl py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                  Bilsem Zeka
                </Link>
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xl py-4 rounded-2xl transform active:scale-95 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest"
                  style={{ boxShadow: '0 8px 32px rgba(244, 63, 94, 0.4)' }}
                >
                  <RefreshCw className="w-6 h-6" /> Tekrar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alt Bilgi */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/10 text-[10px] uppercase tracking-[0.3em] font-black pointer-events-none text-center">
        Beyaz topu örüntüye uygun renkteki bir balona fırlat!
      </div>
    </div>
  );
};

export default OruntuluTop;
