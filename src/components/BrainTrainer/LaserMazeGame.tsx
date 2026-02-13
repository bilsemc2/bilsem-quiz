import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer, Target, XCircle, ChevronLeft, Zap, Heart, Crosshair
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useGameFeedback } from '../../hooks/useGameFeedback';
import GameFeedbackBanner from './shared/GameFeedbackBanner';
import { useExam } from '../../contexts/ExamContext';
import * as THREE from 'three';

// Game Constants
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

interface LaserMazeGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// --- Maze Generation Utilities ---
const DIRS: Record<string, { dr: number; dc: number; vec: THREE.Vector3 }> = {
    N: { dr: -1, dc: 0, vec: new THREE.Vector3(0, 0, -1) },
    S: { dr: 1, dc: 0, vec: new THREE.Vector3(0, 0, 1) },
    W: { dr: 0, dc: -1, vec: new THREE.Vector3(-1, 0, 0) },
    E: { dr: 0, dc: 1, vec: new THREE.Vector3(1, 0, 0) },
};
const OPPOSITE: Record<string, string> = { N: 'S', S: 'N', W: 'E', E: 'W' };

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

interface MazeCell {
    row: number; col: number; visited: boolean;
    walls: Record<string, boolean>;
}
interface MirrorData {
    row: number; col: number; incoming: string; outgoing: string; real: boolean;
}
interface ExitData {
    row: number; col: number; side: string; id: number;
}
interface MazeConfig {
    cells: MazeCell[][]; entrance: { row: number; col: number; side: string };
    exits: ExitData[]; correctIndex: number; path: { row: number; col: number }[];
    mirrors: MirrorData[]; entryDir: string; exitDir: string;
}

function cellKey(c: { row: number; col: number }) { return `${c.row},${c.col}`; }
function cellToWorld(row: number, col: number, gridSize: number) {
    const offset = (gridSize - 1) / 2;
    return new THREE.Vector3((col - offset) * CELL_SIZE, 0, (row - offset) * CELL_SIZE);
}

function generateMazeCells(size: number): MazeCell[][] {
    const cells: MazeCell[][] = Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => ({
            row, col, visited: false, walls: { N: true, E: true, S: true, W: true },
        }))
    );
    const stack: MazeCell[] = [];
    let current = cells[randInt(0, size - 1)][randInt(0, size - 1)];
    current.visited = true;
    let visited = 1;
    while (visited < size * size) {
        const neighbors: { neighbor: MazeCell; dir: string }[] = [];
        Object.entries(DIRS).forEach(([dir, data]) => {
            const nr = current.row + data.dr, nc = current.col + data.dc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) return;
            if (!cells[nr][nc].visited) neighbors.push({ neighbor: cells[nr][nc], dir });
        });
        if (neighbors.length > 0) {
            const { neighbor, dir } = neighbors[randInt(0, neighbors.length - 1)];
            current.walls[dir] = false;
            neighbor.walls[OPPOSITE[dir]] = false;
            stack.push(current);
            current = neighbor;
            current.visited = true;
            visited++;
        } else if (stack.length > 0) {
            current = stack.pop()!;
        }
    }
    return cells;
}

function boundaryCells(size: number) {
    const list: { row: number; col: number; side: string }[] = [];
    for (let col = 1; col < size - 1; col++) {
        list.push({ row: 0, col, side: 'N' });
        list.push({ row: size - 1, col, side: 'S' });
    }
    for (let row = 1; row < size - 1; row++) {
        list.push({ row, col: 0, side: 'W' });
        list.push({ row, col: size - 1, side: 'E' });
    }
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
    while (cur && !(cur.row === start.row && cur.col === start.col)) {
        path.push(cur);
        cur = parent[cur.row][cur.col];
    }
    path.push({ row: start.row, col: start.col });
    path.reverse();
    return path;
}

function getDir(from: { row: number; col: number }, to: { row: number; col: number }) {
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
            for (let p = 0; p < path.length - 1; p++) pathDirs.push(getDir(path[p], path[p + 1]));
            const mirrors: MirrorData[] = [];
            for (let p = 0; p < path.length; p++) {
                const cell = path[p];
                const incoming = p === 0 ? entryDir : pathDirs[p - 1];
                const outgoing = p === path.length - 1 ? exitDir : pathDirs[p];
                if (incoming !== outgoing) mirrors.push({ row: cell.row, col: cell.col, incoming, outgoing, real: true });
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
    throw new Error('Maze generation failed');
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

// --- Level Config ---
function getLevelConfig(level: number): { gridSize: number; exitCount: number } {
    if (level <= 4) return { gridSize: 6, exitCount: 3 };
    if (level <= 8) return { gridSize: 6, exitCount: 4 };
    if (level <= 12) return { gridSize: 8, exitCount: 4 };
    if (level <= 16) return { gridSize: 8, exitCount: 5 };
    return { gridSize: 10, exitCount: 6 };
}

// --- Three.js Engine ---
function createEngine(container: HTMLDivElement, gridSize: number, exitCount: number) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1a2e');
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
    camera.position.set(0, 26, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight('#f6f2e7', 0.6));
    const keyLight = new THREE.DirectionalLight('#ffffff', 0.95);
    keyLight.position.set(10, 18, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 2; keyLight.shadow.camera.far = 80;
    keyLight.shadow.camera.left = -30; keyLight.shadow.camera.right = 30;
    keyLight.shadow.camera.top = 30; keyLight.shadow.camera.bottom = -30;
    scene.add(keyLight);

    const mazeConfig = createMazeConfig(gridSize, exitCount);
    const group = new THREE.Group();
    scene.add(group);

    // Floor
    const floorSize = gridSize * CELL_SIZE + CELL_SIZE;
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(floorSize, floorSize),
        new THREE.MeshStandardMaterial({ color: '#16213e', roughness: 0.85 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const gridHelper = new THREE.GridHelper(gridSize * CELL_SIZE, gridSize, '#2a2a5a', '#1e1e4a');
    gridHelper.position.y = 0.02;
    group.add(gridHelper);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: '#4a5a8a', roughness: 0.6, metalness: 0.05 });
    const wallNS = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, WALL_THICK);
    const wallWE = new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, CELL_SIZE);
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = mazeConfig.cells[r][c];
            const center = cellToWorld(r, c, gridSize);
            if (cell.walls.N) { const w = new THREE.Mesh(wallNS, wallMat); w.position.set(center.x, WALL_HEIGHT / 2, center.z - CELL_SIZE / 2); w.castShadow = true; group.add(w); }
            if (cell.walls.W) { const w = new THREE.Mesh(wallWE, wallMat); w.position.set(center.x - CELL_SIZE / 2, WALL_HEIGHT / 2, center.z); w.castShadow = true; group.add(w); }
            if (r === gridSize - 1 && cell.walls.S) { const w = new THREE.Mesh(wallNS, wallMat); w.position.set(center.x, WALL_HEIGHT / 2, center.z + CELL_SIZE / 2); w.castShadow = true; group.add(w); }
            if (c === gridSize - 1 && cell.walls.E) { const w = new THREE.Mesh(wallWE, wallMat); w.position.set(center.x + CELL_SIZE / 2, WALL_HEIGHT / 2, center.z); w.castShadow = true; group.add(w); }
        }
    }

    // Mirrors — flat diamond markers visible from top-down camera
    const mirrorRealMat = new THREE.MeshStandardMaterial({ color: '#60d5f7', emissive: '#40c0ff', emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.4 });
    const mirrorDecoyMat = new THREE.MeshStandardMaterial({ color: '#8888aa', emissive: '#6666aa', emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.3 });
    const mirrorSize = CELL_SIZE * 0.55;
    const mirrorGeo = new THREE.BoxGeometry(mirrorSize, 0.15, mirrorSize * 0.18);

    function getMirrorAngle(incoming: string, outgoing: string): number {
        // Determine the rotation angle for the mirror on the XZ plane
        const pair = incoming + outgoing;
        // Mirror reflects: NE/EN→45°, NW/WN→-45°, SE/ES→-45°, SW/WS→45°
        if (pair === 'NE' || pair === 'EN' || pair === 'SW' || pair === 'WS') return Math.PI / 4;
        if (pair === 'NW' || pair === 'WN' || pair === 'SE' || pair === 'ES') return -Math.PI / 4;
        return 0;
    }

    mazeConfig.mirrors.forEach(m => {
        const center = cellToWorld(m.row, m.col, gridSize);
        const mat = m.real ? mirrorRealMat : mirrorDecoyMat;
        const mesh = new THREE.Mesh(mirrorGeo, mat);
        mesh.position.set(center.x, 0.12, center.z);
        mesh.rotation.y = getMirrorAngle(m.incoming, m.outgoing);
        mesh.castShadow = true;
        group.add(mesh);

        // Glow ring under mirror
        const ringGeo = new THREE.RingGeometry(mirrorSize * 0.3, mirrorSize * 0.45, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: m.real ? '#40c0ff' : '#6666aa', transparent: true, opacity: 0.4, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(center.x, 0.03, center.z);
        group.add(ring);
    });

    // Exit markers with text sprites
    function makeTextSprite(text: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, 128, 128);
        ctx.fillStyle = '#1a1a3e';
        ctx.beginPath(); ctx.arc(64, 64, 58, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 6; ctx.strokeStyle = '#6366f1'; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '700 60px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 68);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.85, 0.85, 1);
        return sprite;
    }

    const exitMat = new THREE.MeshStandardMaterial({ color: '#6366f1', emissive: '#818cf8', emissiveIntensity: 0.6, roughness: 0.35 });
    const exitGeo = new THREE.BoxGeometry(CELL_SIZE * 0.75, 0.6, 0.18);
    mazeConfig.exits.forEach((exit, idx) => {
        const center = cellToWorld(exit.row, exit.col, gridSize);
        const offset = DIRS[exit.side].vec.clone().multiplyScalar(CELL_SIZE * 0.55);
        const pos = center.clone().add(offset);
        const marker = new THREE.Mesh(exitGeo, exitMat.clone());
        marker.position.set(pos.x, 0.25, pos.z);
        marker.rotation.y = exit.side === 'N' ? Math.PI : exit.side === 'E' ? Math.PI / 2 : exit.side === 'W' ? -Math.PI / 2 : 0;
        group.add(marker);
        const sprite = makeTextSprite(`${idx + 1}`);
        sprite.position.set(pos.x, 1.2, pos.z);
        group.add(sprite);
    });

    // Entrance marker — laser-colored
    const entranceCenter = cellToWorld(mazeConfig.entrance.row, mazeConfig.entrance.col, gridSize);
    const entranceOffset = DIRS[mazeConfig.entrance.side].vec.clone().multiplyScalar(CELL_SIZE * 0.55);
    const entrancePos = entranceCenter.clone().add(entranceOffset);
    const entMarker = new THREE.Mesh(exitGeo, new THREE.MeshStandardMaterial({ color: LASER_COLOR, emissive: LASER_EMISSIVE, emissiveIntensity: 0.8, roughness: 0.3 }));
    entMarker.position.set(entrancePos.x, 0.25, entrancePos.z);
    entMarker.rotation.y = mazeConfig.entrance.side === 'N' ? Math.PI : mazeConfig.entrance.side === 'E' ? Math.PI / 2 : mazeConfig.entrance.side === 'W' ? -Math.PI / 2 : 0;
    group.add(entMarker);
    const entSprite = makeTextSprite('G');
    entSprite.position.set(entrancePos.x, 1.2, entrancePos.z);
    group.add(entSprite);

    // Laser path
    const entryVec = DIRS[mazeConfig.entrance.side].vec.clone();
    const exitVec = DIRS[mazeConfig.exitDir].vec.clone();
    const pathPoints: THREE.Vector3[] = [];
    pathPoints.push(entranceCenter.clone().add(entryVec.clone().multiplyScalar(CELL_SIZE * 0.6)).setY(LASER_Y));
    mazeConfig.path.forEach(c => pathPoints.push(cellToWorld(c.row, c.col, gridSize).setY(LASER_Y)));
    const lastCell = mazeConfig.path[mazeConfig.path.length - 1];
    pathPoints.push(cellToWorld(lastCell.row, lastCell.col, gridSize).add(exitVec.clone().multiplyScalar(CELL_SIZE * 0.6)).setY(LASER_Y));
    const laserPoints = densifyPath(pathPoints, LASER_STEP);

    const laserMat = new THREE.MeshStandardMaterial({
        color: LASER_COLOR, emissive: LASER_EMISSIVE, emissiveIntensity: 1.2,
        roughness: 0.25, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const laserSegments: THREE.Mesh[] = [];
    for (let i = 0; i < laserPoints.length - 1; i++) {
        const a = laserPoints[i], b = laserPoints[i + 1];
        const dir = b.clone().sub(a);
        const len = dir.length();
        if (len <= 0.001) continue;
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const geo = new THREE.CylinderGeometry(LASER_RADIUS, LASER_RADIUS, len, 8, 1, true);
        const seg = new THREE.Mesh(geo, laserMat);
        seg.position.copy(mid);
        seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        seg.visible = false;
        group.add(seg);
        laserSegments.push(seg);
    }

    // Camera
    const aspect = rect.width / rect.height;
    const camSize = gridSize * CELL_SIZE * 0.65;
    camera.left = -camSize * aspect; camera.right = camSize * aspect;
    camera.top = camSize; camera.bottom = -camSize;
    camera.updateProjectionMatrix();

    let running = true;
    let frameId: number;
    let laserAnim = { active: false, start: 0, duration: 0, hold: 0, fade: 0, peak: 0.9 };

    function animate() {
        if (!running) return;
        const now = performance.now();
        if (laserAnim.active) {
            const elapsed = now - laserAnim.start;
            const total = laserAnim.duration + laserAnim.hold + laserAnim.fade;
            if (elapsed <= total) {
                let opacity = laserAnim.peak;
                let drawCount = laserSegments.length;
                if (elapsed < laserAnim.duration) {
                    const progress = elapsed / laserAnim.duration;
                    drawCount = Math.max(1, Math.floor(progress * laserSegments.length));
                } else if (elapsed > laserAnim.duration + laserAnim.hold) {
                    const fadeP = (elapsed - laserAnim.duration - laserAnim.hold) / laserAnim.fade;
                    opacity = laserAnim.peak * (1 - Math.min(1, fadeP));
                }
                laserMat.opacity = opacity;
                laserSegments.forEach((seg, i) => { seg.visible = i < drawCount; });
            } else {
                laserMat.opacity = 0;
                laserSegments.forEach(s => { s.visible = false; });
                laserAnim.active = false;
            }
        }
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
    }

    function handleResize() {
        const r = container.getBoundingClientRect();
        renderer.setSize(r.width, r.height);
        const a = r.width / r.height;
        const s = gridSize * CELL_SIZE * 0.65;
        camera.left = -s * a; camera.right = s * a; camera.top = s; camera.bottom = -s;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', handleResize);
    animate();

    return {
        correctIndex: mazeConfig.correctIndex,
        exitCount: mazeConfig.exits.length,
        guess(index: number) {
            const isCorrect = index === mazeConfig.correctIndex;
            laserSegments.forEach(s => { s.visible = false; });
            laserAnim = {
                active: true, start: performance.now(),
                duration: isCorrect ? 2800 : 1400, hold: isCorrect ? 800 : 300, fade: 700, peak: 0.95,
            };
            return isCorrect;
        },
        dispose() {
            running = false;
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
        },
    };
}

// --- Feedback Messages ---

const LaserMazeGame: React.FC<LaserMazeGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();
    const { feedbackState, showFeedback } = useGameFeedback();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [exitCount, setExitCount] = useState(3);
    const [puzzleKey, setPuzzleKey] = useState(0);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startTimeRef = useRef(0);
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
    const guessedRef = useRef(false);

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Build maze when canvas mounts or level changes
    const mountedLevelRef = useRef(0);

    const canvasCallbackRef = useCallback((node: HTMLDivElement | null) => {
        canvasRef.current = node;
        if (!node) {
            if (engineRef.current) { engineRef.current.dispose(); engineRef.current = null; }
            return;
        }
        if (engineRef.current) engineRef.current.dispose();
        const config = getLevelConfig(level);
        const engine = createEngine(node, config.gridSize, config.exitCount);
        engineRef.current = engine;
        setExitCount(engine.exitCount);
        guessedRef.current = false;
        mountedLevelRef.current = level;
    }, [level, puzzleKey]);

    // Rebuild maze when level changes while already mounted
    useEffect(() => {
        if (phase !== 'playing') return;
        if (!canvasRef.current) return;
        if (mountedLevelRef.current === level) return; // Already built by callback ref
        if (engineRef.current) engineRef.current.dispose();
        const config = getLevelConfig(level);
        const engine = createEngine(canvasRef.current, config.gridSize, config.exitCount);
        engineRef.current = engine;
        setExitCount(engine.exitCount);
        guessedRef.current = false;
        mountedLevelRef.current = level;
    }, [level, phase, puzzleKey]);

    const handleStart = useCallback(() => {
        window.scrollTo(0, 0);
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(level >= 5, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }
        await saveGamePlay({
            game_id: 'lazer-labirent', score_achieved: score, duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate]);

    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (examMode) {
            await submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/atolyeler/sinav-simulasyonu/devam'), 1500);
            return;
        }
        await saveGamePlay({
            game_id: 'lazer-labirent', score_achieved: score, duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate]);

    const handleGuess = useCallback((index: number) => {
        if (!engineRef.current || guessedRef.current) return;
        guessedRef.current = true;
        const isCorrect = engineRef.current.guess(index);

        // Wait for laser animation to finish before showing feedback
        const laserDuration = isCorrect ? 2800 + 800 : 1400 + 300;
        setTimeout(() => {
            showFeedback(isCorrect);

            setPhase('feedback');

            if (isCorrect) {
                setScore(p => p + 10 * level);
                setTimeout(() => {
                    if (level >= MAX_LEVEL) { handleVictory(); }
                    else { setLevel(p => p + 1); setPhase('playing'); }
                }, 2000);
            } else {
                const newLives = lives - 1;
                setLives(newLives);
                setTimeout(() => {
                    if (newLives <= 0) { handleGameOver(); }
                    else {
                        setPuzzleKey(k => k + 1);
                        guessedRef.current = false;
                        setPhase('playing');
                    }
                }, 1500);
            }
        }, laserDuration);
    }, [level, lives, handleVictory, handleGameOver]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} /><span>Geri</span>
                    </Link>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-4 flex-wrap justify-end">
                            <div className="flex items-center gap-2 bg-amber-500/20 px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={16} /><span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-xl border border-blue-500/30">
                                <Timer className="text-blue-400" size={16} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={16} /><span className="font-bold text-emerald-400 text-sm">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Crosshair size={52} className="text-white drop-shadow-lg" />
                            </motion.div>
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full">
                                <span className="text-[9px] font-black text-violet-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-violet-400">5.3.3 Uzamsal İlişki Çözümleme</span>
                            </div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Lazer Labirent</h1>
                            <p className="text-slate-400 mb-8">Görünmez lazerin aynalardan yansıyarak hangi çıkışa ulaştığını tahmin et! Ayna açılarını analiz et ve doğru çıkışı bul.</p>
                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Heart className="text-red-400" size={16} /><span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Timer className="text-blue-400" size={16} /><span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Target className="text-emerald-400" size={16} /><span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}
                            >
                                <div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {(phase === 'playing' || phase === 'feedback') && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
                            <div ref={canvasCallbackRef} className="w-full aspect-square max-h-[60vh] rounded-3xl overflow-hidden border border-white/10 mb-6" />
                            <div className="flex flex-wrap justify-center gap-3">
                                {Array.from({ length: exitCount }).map((_, i) => (
                                    <motion.button key={i} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => handleGuess(i)} disabled={phase === 'feedback'}
                                        className="min-w-[80px] min-h-[56px] px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
                                    >
                                        Çıkış {i + 1}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)' }}>
                                <XCircle size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-bold text-lg">
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center animate-bounce"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)' }}>
                                <Trophy size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
                                <p className="text-4xl font-bold text-amber-400">{score}</p><p className="text-slate-400">Toplam Puan</p>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-lg">
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Feedback Overlay */}
                <GameFeedbackBanner feedback={feedbackState} />
            </div>
        </div>
    );
};

export default LaserMazeGame;

