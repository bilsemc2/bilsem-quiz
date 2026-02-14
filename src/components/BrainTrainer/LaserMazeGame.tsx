import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon, ChevronLeft, Zap, Heart, Crosshair, Eye, Sparkles
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';
import { useSound } from '../../hooks/useSound';
import * as THREE from 'three';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const CELL_SIZE = 2.2;
const WALL_THICK = 0.25;
const WALL_HEIGHT = 0.9;
const LASER_Y = WALL_HEIGHT * 0.55;
const LASER_STEP = CELL_SIZE * 0.2;
const LASER_RADIUS = 0.085;
const LASER_COLOR = '#ff0f1f';
const LASER_EMISSIVE = '#ff3a3a';

type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

// Maze Dirs
const DIRS: Record<string, { dr: number; dc: number; vec: THREE.Vector3 }> = {
    N: { dr: -1, dc: 0, vec: new THREE.Vector3(0, 0, -1) },
    S: { dr: 1, dc: 0, vec: new THREE.Vector3(0, 0, 1) },
    W: { dr: 0, dc: -1, vec: new THREE.Vector3(-1, 0, 0) },
    E: { dr: 0, dc: 1, vec: new THREE.Vector3(1, 0, 0) },
};
const OPPOSITE: Record<string, string> = { N: 'S', S: 'N', W: 'E', E: 'W' };

// Helpers
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

interface MazeCell { row: number; col: number; visited: boolean; walls: Record<string, boolean>; }
interface MirrorData { row: number; col: number; incoming: string; outgoing: string; real: boolean; }
interface ExitData { row: number; col: number; side: string; id: number; }
interface MazeConfig {
    cells: MazeCell[][]; entrance: { row: number; col: number; side: string };
    exits: ExitData[]; correctIndex: number; path: { row: number; col: number }[];
    mirrors: MirrorData[]; entryDir: string; exitDir: string;
}

const cellKey = (c: { row: number; col: number }) => `${c.row},${c.col}`;
const cellToWorld = (r: number, c: number, size: number) => {
    const off = (size - 1) / 2;
    return new THREE.Vector3((c - off) * CELL_SIZE, 0, (r - off) * CELL_SIZE);
};

// Logic
function generateMazeCells(size: number): MazeCell[][] {
    const cells: MazeCell[][] = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => ({ r, c, visited: false, walls: { N: true, E: true, S: true, W: true }, row: r, col: c }))
    );
    const stack: MazeCell[] = [];
    let cur = cells[randInt(0, size - 1)][randInt(0, size - 1)];
    cur.visited = true;
    let visited = 1;
    while (visited < size * size) {
        const neighbors: { neighbor: MazeCell; dir: string }[] = [];
        Object.entries(DIRS).forEach(([dir, data]) => {
            const nr = cur.row + data.dr, nc = cur.col + data.dc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) return;
            if (!cells[nr][nc].visited) neighbors.push({ neighbor: cells[nr][nc], dir });
        });
        if (neighbors.length > 0) {
            const { neighbor, dir } = neighbors[randInt(0, neighbors.length - 1)];
            cur.walls[dir] = false;
            neighbor.walls[OPPOSITE[dir]] = false;
            stack.push(cur);
            cur = neighbor;
            cur.visited = true;
            visited++;
        } else if (stack.length > 0) { cur = stack.pop()!; }
    }
    return cells;
}

function boundaryCells(size: number) {
    const list: { row: number; col: number; side: string }[] = [];
    for (let col = 1; col < size - 1; col++) { list.push({ row: 0, col, side: 'N' }); list.push({ row: size - 1, col, side: 'S' }); }
    for (let row = 1; row < size - 1; row++) { list.push({ row, col: 0, side: 'W' }); list.push({ row, col: size - 1, side: 'E' }); }
    return list;
}

function bfs(cells: MazeCell[][], start: { row: number; col: number }) {
    const size = cells.length;
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const parent: ({ row: number; col: number } | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
    const queue = [start];
    visited[start.row][start.col] = true;
    while (queue.length > 0) {
        const cur = queue.shift()!;
        Object.entries(DIRS).forEach(([dir, data]) => {
            if (cells[cur.row][cur.col].walls[dir]) return;
            const nr = cur.row + data.dr, nc = cur.col + data.dc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size || visited[nr][nc]) return;
            visited[nr][nc] = true;
            parent[nr][nc] = { row: cur.row, col: cur.col };
            queue.push({ row: nr, col: nc });
        });
    }
    return { parent };
}

function buildPath(parent: ({ row: number; col: number } | null)[][], start: { row: number; col: number }, end: { row: number; col: number }) {
    const path: { row: number; col: number }[] = [];
    let cur: { row: number; col: number } | null = { row: end.row, col: end.col };
    while (cur && !(cur.row === start.row && cur.col === start.col)) { path.push(cur); cur = parent[cur.row][cur.col]; }
    path.push({ row: start.row, col: start.col });
    path.reverse();
    return path;
}

function getMoveDir(from: { row: number; col: number }, to: { row: number; col: number }) {
    if (to.row === from.row - 1) return 'N';
    if (to.row === from.row + 1) return 'S';
    if (to.col === from.col - 1) return 'W';
    if (to.col === from.col + 1) return 'E';
    return '';
}

function createMazeConfig(gridSize: number, exitCount: number): MazeConfig {
    const boundary = boundaryCells(gridSize);
    const safeExitCount = Math.min(exitCount, Math.max(2, boundary.length - 1));
    for (let attempt = 0; attempt < 50; attempt++) {
        const cells = generateMazeCells(gridSize);
        const entrance = boundary[randInt(0, boundary.length - 1)];
        const { parent } = bfs(cells, entrance);
        const boundaryChoices = boundary.filter(c => cellKey(c) !== cellKey(entrance));
        shuffle(boundaryChoices);
        for (let i = 0; i < boundaryChoices.length; i++) {
            const candidate = boundaryChoices[i];
            const path = buildPath(parent, entrance, candidate);
            const pathSet = new Set(path.map(cellKey));
            const others = boundaryChoices.filter(c => cellKey(c) !== cellKey(candidate) && !pathSet.has(cellKey(c)));
            if (others.length < safeExitCount - 1) continue;
            shuffle(others);
            const decoys = others.slice(0, safeExitCount - 1);
            const exits: ExitData[] = shuffle([candidate, ...decoys]).map((exit, idx) => ({ ...exit, id: idx + 1 }));
            const correctIndex = exits.findIndex(e => e.row === candidate.row && e.col === candidate.col);
            cells[entrance.row][entrance.col].walls[entrance.side] = false;
            exits.forEach(e => { cells[e.row][e.col].walls[e.side] = false; });
            const entryDir = OPPOSITE[entrance.side];
            const exitDir = candidate.side;
            const pathDirs: string[] = [];
            for (let p = 0; p < path.length - 1; p++) pathDirs.push(getMoveDir(path[p], path[p + 1]));
            const mirrors: MirrorData[] = [];
            for (let p = 0; p < path.length; p++) {
                const incoming = p === 0 ? entryDir : pathDirs[p - 1];
                const outgoing = p === path.length - 1 ? exitDir : pathDirs[p];
                if (incoming !== outgoing) mirrors.push({ row: path[p].row, col: path[p].col, incoming, outgoing, real: true });
            }
            const mirrorSet = new Set(mirrors.map(cellKey));
            const decoyCandidates: { row: number; col: number }[] = [];
            for (let r = 0; r < gridSize; r++)
                for (let c = 0; c < gridSize; c++) {
                    const key = `${r},${c}`;
                    if (!pathSet.has(key) && !mirrorSet.has(key)) decoyCandidates.push({ row: r, col: c });
                }
            shuffle(decoyCandidates);
            const decoyMirrors = Math.floor(gridSize * gridSize * 0.07);
            for (let d = 0; d < decoyMirrors && d < decoyCandidates.length; d++) {
                const cell = decoyCandidates[d];
                const inc = ['N', 'S', 'E', 'W'][randInt(0, 3)];
                const out = (inc === 'N' || inc === 'S') ? ['E', 'W'][randInt(0, 1)] : ['N', 'S'][randInt(0, 1)];
                mirrors.push({ row: cell.row, col: cell.col, incoming: inc, outgoing: out, real: false });
            }
            return { cells, entrance, exits, correctIndex, path, mirrors, entryDir, exitDir };
        }
    }
    throw new Error('Maze fail');
}

function densifyPath(points: THREE.Vector3[], step: number) {
    if (!points || points.length < 2) return points || [];
    const dense: THREE.Vector3[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        const seg = b.clone().sub(a);
        const len = seg.length();
        if (len <= 0.001) continue;
        const dir = seg.clone().normalize();
        const steps = Math.max(1, Math.ceil(len / step));
        for (let s = 0; s < steps; s++) dense.push(a.clone().add(dir.clone().multiplyScalar(len * (s / steps))));
    }
    dense.push(points[points.length - 1].clone());
    return dense;
}

// Three Engine
function createEngine(container: HTMLDivElement, gridSize: number, exitCount: number) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1a2e');
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
    camera.position.set(0, 26, 0); camera.up.set(0, 0, -1); camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight('#f6f2e7', 0.6));
    const keyLight = new THREE.DirectionalLight('#ffffff', 0.9);
    keyLight.position.set(10, 18, 8); keyLight.castShadow = true;
    scene.add(keyLight);

    const config = createMazeConfig(gridSize, exitCount);
    const group = new THREE.Group(); scene.add(group);

    const floorSize = gridSize * CELL_SIZE + CELL_SIZE;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorSize, floorSize), new THREE.MeshStandardMaterial({ color: '#16213e' }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; group.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: '#4a5a8a' });
    const wallNS = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, WALL_THICK);
    const wallWE = new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, CELL_SIZE);
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = config.cells[r][c]; const cur = cellToWorld(r, c, gridSize);
            if (cell.walls.N) { const w = new THREE.Mesh(wallNS, wallMat); w.position.set(cur.x, WALL_HEIGHT / 2, cur.z - CELL_SIZE / 2); w.castShadow = true; group.add(w); }
            if (cell.walls.W) { const w = new THREE.Mesh(wallWE, wallMat); w.position.set(cur.x - CELL_SIZE / 2, WALL_HEIGHT / 2, cur.z); w.castShadow = true; group.add(w); }
            if (r === gridSize - 1 && cell.walls.S) { const w = new THREE.Mesh(wallNS, wallMat); w.position.set(cur.x, WALL_HEIGHT / 2, cur.z + CELL_SIZE / 2); w.castShadow = true; group.add(w); }
            if (c === gridSize - 1 && cell.walls.E) { const w = new THREE.Mesh(wallWE, wallMat); w.position.set(cur.x + CELL_SIZE / 2, WALL_HEIGHT / 2, cur.z); w.castShadow = true; group.add(w); }
        }
    }

    const mRMat = new THREE.MeshStandardMaterial({ color: '#60d5f7', emissive: '#40c0ff', emissiveIntensity: 0.8 });
    const mDMat = new THREE.MeshStandardMaterial({ color: '#8888aa', emissive: '#6666aa', emissiveIntensity: 0.4 });
    const mSize = CELL_SIZE * 0.55;
    const mGeo = new THREE.BoxGeometry(mSize, 0.15, mSize * 0.18);
    config.mirrors.forEach(m => {
        const cur = cellToWorld(m.row, m.col, gridSize); const mesh = new THREE.Mesh(mGeo, m.real ? mRMat : mDMat);
        mesh.position.set(cur.x, 0.12, cur.z);
        const p = m.incoming + m.outgoing;
        mesh.rotation.y = (p === 'NE' || p === 'EN' || p === 'SW' || p === 'WS') ? Math.PI / 4 : -Math.PI / 4;
        mesh.castShadow = true; group.add(mesh);
    });

    // ── Entrance: glowing laser source ──
    const entranceWorld = cellToWorld(config.entrance.row, config.entrance.col, gridSize);
    const entranceOff = DIRS[config.entrance.side].vec.clone().multiplyScalar(CELL_SIZE * 0.55);
    const entrancePos = entranceWorld.clone().add(entranceOff);
    const laserSourceGeo = new THREE.SphereGeometry(CELL_SIZE * 0.18, 16, 16);
    const laserSourceMat = new THREE.MeshStandardMaterial({ color: '#ff2020', emissive: '#ff4444', emissiveIntensity: 1.5, transparent: true, opacity: 0.9 });
    const laserSource = new THREE.Mesh(laserSourceGeo, laserSourceMat);
    laserSource.position.set(entrancePos.x, 0.35, entrancePos.z);
    group.add(laserSource);
    // Laser source glow ring
    const glowRingGeo = new THREE.RingGeometry(CELL_SIZE * 0.22, CELL_SIZE * 0.32, 32);
    const glowRingMat = new THREE.MeshBasicMaterial({ color: '#ff4444', transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
    glowRing.position.set(entrancePos.x, 0.02, entrancePos.z);
    glowRing.rotation.x = -Math.PI / 2;
    group.add(glowRing);

    // ── Helper: create text sprite ──
    const createTextSprite = (text: string, color: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx2d = canvas.getContext('2d')!;
        ctx2d.clearRect(0, 0, 128, 128);
        // Background circle
        ctx2d.beginPath();
        ctx2d.arc(64, 64, 56, 0, Math.PI * 2);
        ctx2d.fillStyle = color;
        ctx2d.fill();
        // Border
        ctx2d.lineWidth = 4;
        ctx2d.strokeStyle = '#ffffff';
        ctx2d.stroke();
        // Text
        ctx2d.fillStyle = '#ffffff';
        ctx2d.font = 'bold 64px Arial';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        ctx2d.fillText(text, 64, 68);
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(CELL_SIZE * 0.6, CELL_SIZE * 0.6, 1);
        return sprite;
    };

    // ── Exits with numbered labels ──
    const exitGeo = new THREE.BoxGeometry(CELL_SIZE * 0.75, 0.6, 0.18);
    config.exits.forEach((e) => {
        const cur = cellToWorld(e.row, e.col, gridSize); const off = DIRS[e.side].vec.clone().multiplyScalar(CELL_SIZE * 0.55);
        const pos = cur.clone().add(off);
        const m = new THREE.Mesh(exitGeo, new THREE.MeshStandardMaterial({ color: '#6366f1', emissive: '#818cf8', emissiveIntensity: 0.6 }));
        m.position.set(pos.x, 0.25, pos.z);
        m.rotation.y = e.side === 'N' ? Math.PI : e.side === 'E' ? Math.PI / 2 : e.side === 'W' ? -Math.PI / 2 : 0;
        group.add(m);
        // Number label above exit
        const label = createTextSprite(String(e.id), '#6366f1');
        label.position.set(pos.x, 1.6, pos.z);
        group.add(label);
    });

    const pathPoints: THREE.Vector3[] = [];
    const enCur = cellToWorld(config.entrance.row, config.entrance.col, gridSize);
    pathPoints.push(enCur.clone().add(DIRS[config.entrance.side].vec.clone().multiplyScalar(CELL_SIZE * 0.6)).setY(LASER_Y));
    config.path.forEach(c => pathPoints.push(cellToWorld(c.row, c.col, gridSize).setY(LASER_Y)));
    const last = config.path[config.path.length - 1];
    pathPoints.push(cellToWorld(last.row, last.col, gridSize).add(DIRS[config.exitDir].vec.clone().multiplyScalar(CELL_SIZE * 0.6)).setY(LASER_Y));
    const laserPoints = densifyPath(pathPoints, LASER_STEP);

    const laserMat = new THREE.MeshStandardMaterial({ color: LASER_COLOR, emissive: LASER_EMISSIVE, emissiveIntensity: 1.2, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const segments: THREE.Mesh[] = [];
    for (let i = 0; i < laserPoints.length - 1; i++) {
        const a = laserPoints[i], b = laserPoints[i + 1]; const dir = b.clone().sub(a); const len = dir.length();
        if (len <= 0.001) continue;
        const g = new THREE.CylinderGeometry(LASER_RADIUS, LASER_RADIUS, len, 8); const s = new THREE.Mesh(g, laserMat);
        s.position.copy(a.clone().add(b).multiplyScalar(0.5));
        s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        s.visible = false; group.add(s); segments.push(s);
    }

    const aspect = rect.width / rect.height; const s = gridSize * CELL_SIZE * 0.65;
    camera.left = -s * aspect; camera.right = s * aspect; camera.top = s; camera.bottom = -s; camera.updateProjectionMatrix();

    let run = true; let lAnim = { active: false, start: 0, dur: 0, hold: 0, fade: 0 };
    function animate() {
        if (!run) return;
        if (lAnim.active) {
            const el = performance.now() - lAnim.start; const tot = lAnim.dur + lAnim.hold + lAnim.fade;
            if (el <= tot) {
                let op = 0.95; let d = segments.length;
                if (el < lAnim.dur) { d = Math.max(1, Math.floor((el / lAnim.dur) * segments.length)); }
                else if (el > lAnim.dur + lAnim.hold) { op = 0.95 * (1 - (el - lAnim.dur - lAnim.hold) / lAnim.fade); }
                laserMat.opacity = op; segments.forEach((s, i) => s.visible = i < d);
            } else { laserMat.opacity = 0; segments.forEach(s => s.visible = false); lAnim.active = false; }
        }
        renderer.render(scene, camera); requestAnimationFrame(animate);
    }
    animate();

    return {
        correctIndex: config.correctIndex, exitCount: config.exits.length,
        guess(idx: number) {
            const ok = idx === config.correctIndex;
            lAnim = { active: true, start: performance.now(), dur: ok ? 2800 : 1400, hold: ok ? 800 : 300, fade: 700 };
            return ok;
        },
        dispose() { run = false; renderer.dispose(); if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement); }
    };
}

const LaserMazeGame: React.FC = () => {
    const { playSound } = useSound();
    const { saveGamePlay } = useGamePersistence();
    const { feedbackState, showFeedback, dismissFeedback } = useGameFeedback({ duration: 1500 });
    const { submitResult } = useExam();
    const location = useLocation();
    const navigate = useNavigate();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [exitCount, setExitCount] = useState(3);
    const [puzzleKey, setPuzzleKey] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<{ correctIndex: number; exitCount: number; guess: (idx: number) => boolean; dispose: () => void } | null>(null);
    const guessedRef = useRef(false);
    const hasSavedRef = useRef(false);

    const examMode = location.state?.examMode || false;
    const examTimeLimit = location.state?.examTimeLimit || TIME_LIMIT;

    const initEngine = useCallback(() => {
        if (!canvasRef.current) return;
        if (engineRef.current) engineRef.current.dispose();
        const cfg = level <= 4 ? { s: 6, e: 3 } : level <= 8 ? { s: 6, e: 4 } : level <= 12 ? { s: 8, e: 4 } : level <= 16 ? { s: 8, e: 5 } : { s: 10, e: 6 };
        const engine = createEngine(canvasRef.current, cfg.s, cfg.e);
        engineRef.current = engine;
        setExitCount(engine.exitCount);
        guessedRef.current = false;
        setPhase('playing');
        playSound('detective_mystery');
    }, [level, playSound]);

    // Initialize 3D engine when canvas mounts or puzzleKey changes
    useEffect(() => {
        if (phase === 'playing' || phase === 'feedback') {
            const timer = setTimeout(initEngine, 50);
            return () => clearTimeout(timer);
        }
    }, [puzzleKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(examMode ? examTimeLimit : TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
        setPhase('playing');
        setPuzzleKey(k => k + 1);
    }, [examMode, examTimeLimit]);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, phase, handleStart, examMode]);

    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(p => {
                if (p <= 1) { clearInterval(timerRef.current!); setPhase('game_over'); return 0; }
                return p - 1;
            }), 1000);
            return () => clearInterval(timerRef.current!);
        }
    }, [phase, timeLeft]);

    const handleFinish = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const isVictory = phase === 'victory';

        if (examMode) {
            await submitResult(isVictory || level >= 5, score, MAX_LEVEL * 100, duration);
            navigate("/atolyeler/sinav-simulasyonu/devam");
            return;
        }

        await saveGamePlay({
            game_id: 'lazer-labirent', score_achieved: score, duration_seconds: duration,
            metadata: { level_reached: level, game_name: 'Lazer Labirent', victory: isVictory }
        });
    }, [phase, score, level, saveGamePlay, examMode, submitResult, navigate]);

    useEffect(() => {
        if (phase === 'game_over' || phase === 'victory') handleFinish();
    }, [phase, handleFinish]);

    const handleGuess = (idx: number) => {
        if (!engineRef.current || guessedRef.current) return;
        guessedRef.current = true;
        const ok = engineRef.current.guess(idx);
        playSound(ok ? 'detective_correct' : 'detective_incorrect');
        setPhase('feedback');

        setTimeout(() => {
            showFeedback(ok);
            if (ok) {
                setScore(p => p + 10 * level);
                setTimeout(() => {
                    dismissFeedback();
                    if (level >= MAX_LEVEL) setPhase('victory');
                    else { setLevel(p => p + 1); setPuzzleKey(k => k + 1); }
                }, 1500);
            } else {
                setLives(l => {
                    const nl = l - 1;
                    if (nl <= 0) setTimeout(() => setPhase('game_over'), 1500);
                    else setTimeout(() => { dismissFeedback(); setPuzzleKey(k => k + 1); }, 1500);
                    return nl;
                });
            }
        }, ok ? 3000 : 1500);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const backLink = location.state?.arcadeMode ? "/bilsem-zeka" : "/atolyeler/bireysel-degerlendirme";
    const backLabel = location.state?.arcadeMode ? "Arcade" : "Geri";

    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-6 text-white relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                </div>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-xl relative z-10">
                    <motion.div className="w-28 h-28 rounded-[40%] flex items-center justify-center mx-auto mb-6 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3)] bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_8px_16px_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.3)]" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}><Crosshair size={52} className="text-white drop-shadow-lg" /></motion.div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Lazer Labirent</h1>
                    <p className="text-slate-400 mb-8 text-lg">Görünmez lazerin aynalardan yansıyarak hangi çıkışa ulaştığını tahmin et! Uzamsal zekanı ve analiz yeteneğini kullan.</p>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 mb-6 text-left border border-white/20">
                        <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2"><Eye size={20} /> Nasıl Oynanır?</h3>
                        <ul className="space-y-2 text-slate-300 text-sm">
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Aynaların yerlerini ve yönlerini analiz et</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Lazerin izleyeceği yolu zihninde canlandır</span></li>
                            <li className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /><span>Doğru çıkışı seç ve lazeri ateşle!</span></li>
                        </ul>
                    </div>
                    <div className="bg-indigo-500/10 text-indigo-300 text-[10px] px-4 py-2 rounded-full mb-6 inline-block border border-indigo-500/30 font-bold uppercase tracking-widest">TUZÖ 5.3.3 Uzamsal İlişki Çözümleme</div>
                    <motion.button whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl shadow-2xl"><div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div></motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
            <div className="relative z-10 p-4 pt-20">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to={backLink} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20} /><span>{backLabel}</span></Link>
                    {(phase !== 'game_over' && phase !== 'victory') && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30"><Star className="text-amber-400 fill-amber-400" size={18} /><span className="font-bold text-amber-400">{score}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30">{Array.from({ length: INITIAL_LIVES }).map((_, i) => (<Heart key={i} size={18} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-900'} />))}</div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30"><TimerIcon className={timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'} size={18} /><span className={`font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span></div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30"><Zap className="text-indigo-400" size={18} /><span className="font-bold text-indigo-400">Seviye {level}</span></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl flex flex-col items-center">
                            <div ref={canvasRef} className="w-full aspect-square max-h-[60vh] rounded-3xl overflow-hidden border border-white/10 shadow-3xl mb-10" />
                            <div className="flex flex-wrap justify-center gap-4">
                                {Array.from({ length: exitCount }).map((_, i) => (
                                    <motion.button key={i} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => handleGuess(i)} disabled={phase === 'feedback'} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-black text-xl shadow-xl disabled:opacity-50">ÇIKIŞ {i + 1}</motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {(phase === 'game_over' || phase === 'victory') && (
                        <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[40%] flex items-center justify-center shadow-2xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><Trophy size={48} className="text-white" /></motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-2">{phase === 'victory' ? '🎖️ Lazer Ustası!' : 'Tebrikler!'}</h2>
                            <p className="text-slate-400 mb-6">{phase === 'victory' ? 'Tüm labirentleri başarıyla çözdün ve ışığın yolunu buldun!' : 'Uzamsal zekanı geliştirmek için labirentleri çözmeye devam et.'}</p>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10"><div className="grid grid-cols-2 gap-4"><div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div><div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-indigo-400">{level}/{MAX_LEVEL}</p></div></div></div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl mb-4 shadow-2xl"><div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div></motion.button>
                            <Link to={backLink} className="block text-slate-500 hover:text-white transition-colors">Geri Dön</Link>
                        </motion.div>
                    )}
                </AnimatePresence>
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default LaserMazeGame;
