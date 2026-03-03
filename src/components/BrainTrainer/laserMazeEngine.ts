import * as THREE from "three";

// ─── Constants ──────────────────────────────────────
export const CELL_SIZE = 2.2;
const WALL_THICK = 0.25;
const WALL_HEIGHT = 0.9;
const LASER_Y = WALL_HEIGHT * 0.55;
const LASER_STEP = CELL_SIZE * 0.2;
const LASER_RADIUS = 0.085;
const LASER_COLOR = "#ff0f1f";
const LASER_EMISSIVE = "#ff3a3a";

import { GAME_COLORS } from './shared/gameColors';

// Maze Dirs
const DIRS: Record<string, { dr: number; dc: number; vec: THREE.Vector3 }> = {
    N: { dr: -1, dc: 0, vec: new THREE.Vector3(0, 0, -1) },
    S: { dr: 1, dc: 0, vec: new THREE.Vector3(0, 0, 1) },
    W: { dr: 0, dc: -1, vec: new THREE.Vector3(-1, 0, 0) },
    E: { dr: 0, dc: 1, vec: new THREE.Vector3(1, 0, 0) },
};
const OPPOSITE: Record<string, string> = { N: "S", S: "N", W: "E", E: "W" };

// Helpers
const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

interface MazeCell {
    row: number;
    col: number;
    visited: boolean;
    walls: Record<string, boolean>;
}
interface MirrorData {
    row: number;
    col: number;
    incoming: string;
    outgoing: string;
    real: boolean;
}
interface ExitData {
    row: number;
    col: number;
    side: string;
    id: number;
}
interface MazeConfig {
    cells: MazeCell[][];
    entrance: { row: number; col: number; side: string };
    exits: ExitData[];
    correctIndex: number;
    path: { row: number; col: number }[];
    mirrors: MirrorData[];
    entryDir: string;
    exitDir: string;
}

const cellKey = (c: { row: number; col: number }) => `${c.row},${c.col}`;
const cellToWorld = (r: number, c: number, size: number) => {
    const off = (size - 1) / 2;
    return new THREE.Vector3((c - off) * CELL_SIZE, 0, (r - off) * CELL_SIZE);
};

// Logic
function generateMazeCells(size: number): MazeCell[][] {
    const cells: MazeCell[][] = Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => ({
            r, c, visited: false,
            walls: { N: true, E: true, S: true, W: true },
            row: r, col: c,
        })),
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
        } else if (stack.length > 0) {
            cur = stack.pop()!;
        }
    }
    return cells;
}

function boundaryCells(size: number) {
    const list: { row: number; col: number; side: string }[] = [];
    for (let col = 1; col < size - 1; col++) {
        list.push({ row: 0, col, side: "N" });
        list.push({ row: size - 1, col, side: "S" });
    }
    for (let row = 1; row < size - 1; row++) {
        list.push({ row, col: 0, side: "W" });
        list.push({ row, col: size - 1, side: "E" });
    }
    return list;
}

function bfs(cells: MazeCell[][], start: { row: number; col: number }) {
    const size = cells.length;
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const parent: ({ row: number; col: number } | null)[][] = Array.from(
        { length: size }, () => Array(size).fill(null),
    );
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

function buildPath(
    parent: ({ row: number; col: number } | null)[][],
    start: { row: number; col: number },
    end: { row: number; col: number },
) {
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

function getMoveDir(from: { row: number; col: number }, to: { row: number; col: number }) {
    if (to.row === from.row - 1) return "N";
    if (to.row === from.row + 1) return "S";
    if (to.col === from.col - 1) return "W";
    if (to.col === from.col + 1) return "E";
    return "";
}

function createMazeConfig(gridSize: number, exitCount: number): MazeConfig {
    const boundary = boundaryCells(gridSize);
    const safeExitCount = Math.min(exitCount, Math.max(2, boundary.length - 1));
    for (let attempt = 0; attempt < 50; attempt++) {
        const cells = generateMazeCells(gridSize);
        const entrance = boundary[randInt(0, boundary.length - 1)];
        const { parent } = bfs(cells, entrance);
        const boundaryChoices = boundary.filter((c) => cellKey(c) !== cellKey(entrance));
        shuffle(boundaryChoices);
        for (let i = 0; i < boundaryChoices.length; i++) {
            const candidate = boundaryChoices[i];
            const path = buildPath(parent, entrance, candidate);
            const pathSet = new Set(path.map(cellKey));
            const others = boundaryChoices.filter(
                (c) => cellKey(c) !== cellKey(candidate) && !pathSet.has(cellKey(c)),
            );
            if (others.length < safeExitCount - 1) continue;
            shuffle(others);
            const decoys = others.slice(0, safeExitCount - 1);
            const exits: ExitData[] = shuffle([candidate, ...decoys]).map(
                (exit, idx) => ({ ...exit, id: idx + 1 }),
            );
            const correctIndex = exits.findIndex(
                (e) => e.row === candidate.row && e.col === candidate.col,
            );
            cells[entrance.row][entrance.col].walls[entrance.side] = false;
            exits.forEach((e) => { cells[e.row][e.col].walls[e.side] = false; });
            const entryDir = OPPOSITE[entrance.side];
            const exitDir = candidate.side;
            const pathDirs: string[] = [];
            for (let p = 0; p < path.length - 1; p++) pathDirs.push(getMoveDir(path[p], path[p + 1]));
            const mirrors: MirrorData[] = [];
            for (let p = 0; p < path.length; p++) {
                const incoming = p === 0 ? entryDir : pathDirs[p - 1];
                const outgoing = p === path.length - 1 ? exitDir : pathDirs[p];
                if (incoming !== outgoing)
                    mirrors.push({ row: path[p].row, col: path[p].col, incoming, outgoing, real: true });
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
                const inc = ["N", "S", "E", "W"][randInt(0, 3)];
                const out = inc === "N" || inc === "S" ? ["E", "W"][randInt(0, 1)] : ["N", "S"][randInt(0, 1)];
                mirrors.push({ row: cell.row, col: cell.col, incoming: inc, outgoing: out, real: false });
            }
            return { cells, entrance, exits, correctIndex, path, mirrors, entryDir, exitDir };
        }
    }
    throw new Error("Maze fail");
}

function densifyPath(points: THREE.Vector3[], step: number) {
    if (!points || points.length < 2) return points || [];
    const dense: THREE.Vector3[] = [];
    const scratch = new THREE.Vector3();
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        const len = scratch.copy(b).sub(a).length();
        if (len <= 0.001) continue;
        const dirX = (b.x - a.x) / len, dirY = (b.y - a.y) / len, dirZ = (b.z - a.z) / len;
        const steps = Math.max(1, Math.ceil(len / step));
        for (let s = 0; s < steps; s++) {
            const t = len * (s / steps);
            dense.push(new THREE.Vector3(a.x + dirX * t, a.y + dirY * t, a.z + dirZ * t));
        }
    }
    dense.push(points[points.length - 1].clone());
    return dense;
}

// ── Public Engine Factory ──
export interface LaserMazeEngine {
    correctIndex: number;
    exitCount: number;
    guess: (idx: number) => boolean;
    dispose: () => void;
}

export function createLaserMazeEngine(
    container: HTMLDivElement,
    gridSize: number,
    exitCount: number,
): LaserMazeEngine {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#1a1a2e");
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
    camera.position.set(0, 26, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight("#f6f2e7", 0.6));
    const keyLight = new THREE.DirectionalLight("#ffffff", 0.9);
    keyLight.position.set(10, 18, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const config = createMazeConfig(gridSize, exitCount);
    const group = new THREE.Group();
    scene.add(group);

    const floorSize = gridSize * CELL_SIZE + CELL_SIZE;
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(floorSize, floorSize),
        new THREE.MeshStandardMaterial({ color: "#16213e" }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: "#4a5a8a" });
    const wallNS = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, WALL_THICK);
    const wallWE = new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, CELL_SIZE);
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = config.cells[r][c];
            const cur = cellToWorld(r, c, gridSize);
            if (cell.walls.N) { const w = new THREE.Mesh(wallNS, wallMat); w.position.set(cur.x, WALL_HEIGHT / 2, cur.z - CELL_SIZE / 2); w.castShadow = true; group.add(w); }
            if (cell.walls.W) { const w = new THREE.Mesh(wallWE, wallMat); w.position.set(cur.x - CELL_SIZE / 2, WALL_HEIGHT / 2, cur.z); w.castShadow = true; group.add(w); }
            if (r === gridSize - 1 && cell.walls.S) { const w = new THREE.Mesh(wallNS, wallMat); w.position.set(cur.x, WALL_HEIGHT / 2, cur.z + CELL_SIZE / 2); w.castShadow = true; group.add(w); }
            if (c === gridSize - 1 && cell.walls.E) { const w = new THREE.Mesh(wallWE, wallMat); w.position.set(cur.x + CELL_SIZE / 2, WALL_HEIGHT / 2, cur.z); w.castShadow = true; group.add(w); }
        }
    }

    const mirrorMat = new THREE.MeshStandardMaterial({ color: "#75c9ff", emissive: "#5aa8df", emissiveIntensity: 0.55 });
    const mSize = CELL_SIZE * 0.55;
    const mGeo = new THREE.BoxGeometry(mSize, 0.15, mSize * 0.18);
    config.mirrors.forEach((m) => {
        const cur = cellToWorld(m.row, m.col, gridSize);
        const mesh = new THREE.Mesh(mGeo, mirrorMat);
        mesh.position.set(cur.x, 0.12, cur.z);
        const p = m.incoming + m.outgoing;
        mesh.rotation.y = p === "NE" || p === "EN" || p === "SW" || p === "WS" ? Math.PI / 4 : -Math.PI / 4;
        mesh.castShadow = true;
        group.add(mesh);
    });

    // Entrance
    const entranceWorld = cellToWorld(config.entrance.row, config.entrance.col, gridSize);
    const entranceOff = DIRS[config.entrance.side].vec.clone().multiplyScalar(CELL_SIZE * 0.55);
    const entrancePos = entranceWorld.clone().add(entranceOff);
    const laserSource = new THREE.Mesh(
        new THREE.SphereGeometry(CELL_SIZE * 0.18, 16, 16),
        new THREE.MeshStandardMaterial({ color: "#ff2020", emissive: GAME_COLORS.pink, emissiveIntensity: 1.5, transparent: true, opacity: 0.9 }),
    );
    laserSource.position.set(entrancePos.x, 0.35, entrancePos.z);
    group.add(laserSource);
    const glowRing = new THREE.Mesh(
        new THREE.RingGeometry(CELL_SIZE * 0.22, CELL_SIZE * 0.32, 32),
        new THREE.MeshBasicMaterial({ color: GAME_COLORS.pink, transparent: true, opacity: 0.4, side: THREE.DoubleSide }),
    );
    glowRing.position.set(entrancePos.x, 0.02, entrancePos.z);
    glowRing.rotation.x = -Math.PI / 2;
    group.add(glowRing);

    // Text sprite helper
    const createTextSprite = (text: string, color: string) => {
        const canvas = document.createElement("canvas");
        canvas.width = 128; canvas.height = 128;
        const ctx2d = canvas.getContext("2d")!;
        ctx2d.clearRect(0, 0, 128, 128);
        ctx2d.beginPath(); ctx2d.arc(64, 64, 56, 0, Math.PI * 2); ctx2d.fillStyle = color; ctx2d.fill();
        ctx2d.lineWidth = 4; ctx2d.strokeStyle = "#ffffff"; ctx2d.stroke();
        ctx2d.fillStyle = "#ffffff"; ctx2d.font = "bold 64px Arial"; ctx2d.textAlign = "center"; ctx2d.textBaseline = "middle"; ctx2d.fillText(text, 64, 68);
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
        sprite.scale.set(CELL_SIZE * 0.6, CELL_SIZE * 0.6, 1);
        return sprite;
    };

    // Exits — shared material for all exits
    const exitGeo = new THREE.BoxGeometry(CELL_SIZE * 0.75, 0.6, 0.18);
    const exitMat = new THREE.MeshStandardMaterial({ color: "#6366f1", emissive: GAME_COLORS.purple, emissiveIntensity: 0.6 });
    config.exits.forEach((e) => {
        const cur = cellToWorld(e.row, e.col, gridSize);
        const off = DIRS[e.side].vec.clone().multiplyScalar(CELL_SIZE * 0.55);
        const pos = cur.clone().add(off);
        const m = new THREE.Mesh(exitGeo, exitMat);
        m.position.set(pos.x, 0.25, pos.z);
        m.rotation.y = e.side === "N" ? Math.PI : e.side === "E" ? Math.PI / 2 : e.side === "W" ? -Math.PI / 2 : 0;
        group.add(m);
        const label = createTextSprite(String(e.id), "#6366f1");
        label.position.set(pos.x, 1.6, pos.z);
        group.add(label);
    });

    // Laser path
    const pathPoints: THREE.Vector3[] = [];
    const enCur = cellToWorld(config.entrance.row, config.entrance.col, gridSize);
    pathPoints.push(enCur.clone().add(DIRS[config.entrance.side].vec.clone().multiplyScalar(CELL_SIZE * 0.6)).setY(LASER_Y));
    config.path.forEach((c) => pathPoints.push(cellToWorld(c.row, c.col, gridSize).setY(LASER_Y)));
    const last = config.path[config.path.length - 1];
    pathPoints.push(cellToWorld(last.row, last.col, gridSize).add(DIRS[config.exitDir].vec.clone().multiplyScalar(CELL_SIZE * 0.6)).setY(LASER_Y));
    const laserPoints = densifyPath(pathPoints, LASER_STEP);

    const laserMat = new THREE.MeshStandardMaterial({
        color: LASER_COLOR, emissive: LASER_EMISSIVE, emissiveIntensity: 1.2,
        transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    });
    const segments: THREE.Mesh[] = [];
    for (let i = 0; i < laserPoints.length - 1; i++) {
        const a = laserPoints[i], b = laserPoints[i + 1];
        const dir = b.clone().sub(a);
        const len = dir.length();
        if (len <= 0.001) continue;
        const g = new THREE.CylinderGeometry(LASER_RADIUS, LASER_RADIUS, len, 8);
        const s = new THREE.Mesh(g, laserMat);
        s.position.copy(a.clone().add(b).multiplyScalar(0.5));
        s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        s.visible = false;
        group.add(s);
        segments.push(s);
    }

    // Camera
    const aspect = rect.width / rect.height;
    const s = gridSize * CELL_SIZE * 0.65;
    camera.left = -s * aspect; camera.right = s * aspect; camera.top = s; camera.bottom = -s;
    camera.updateProjectionMatrix();

    // Animation loop — with proper cancelAnimationFrame
    let run = true;
    let rafId = 0;
    let lAnim = { active: false, start: 0, dur: 0, hold: 0, fade: 0 };
    function animate() {
        if (!run) return;
        if (lAnim.active) {
            const el = performance.now() - lAnim.start;
            const tot = lAnim.dur + lAnim.hold + lAnim.fade;
            if (el <= tot) {
                let op = 0.95;
                let d = segments.length;
                if (el < lAnim.dur) { d = Math.max(1, Math.floor((el / lAnim.dur) * segments.length)); }
                else if (el > lAnim.dur + lAnim.hold) { op = 0.95 * (1 - (el - lAnim.dur - lAnim.hold) / lAnim.fade); }
                laserMat.opacity = op;
                segments.forEach((s, i) => (s.visible = i < d));
            } else {
                laserMat.opacity = 0;
                segments.forEach((s) => (s.visible = false));
                lAnim.active = false;
            }
        }
        renderer.render(scene, camera);
        rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);

    return {
        correctIndex: config.correctIndex,
        exitCount: config.exits.length,
        guess(idx: number) {
            const ok = idx === config.correctIndex;
            lAnim = { active: true, start: performance.now(), dur: ok ? 2800 : 1400, hold: ok ? 800 : 300, fade: 700 };
            return ok;
        },
        dispose() {
            run = false;
            cancelAnimationFrame(rafId);

            // Full GPU resource cleanup — traverse all objects
            scene.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.geometry.dispose();
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => { m.dispose(); if (m.map) m.map.dispose(); });
                    } else {
                        if (obj.material.map) obj.material.map.dispose();
                        obj.material.dispose();
                    }
                }
                if (obj instanceof THREE.Sprite) {
                    if (obj.material.map) obj.material.map.dispose();
                    obj.material.dispose();
                }
            });

            renderer.dispose();
            if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
        },
    };
}
