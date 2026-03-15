import * as THREE from "three";

import {
    DIRS,
    OPPOSITE,
    randInt,
    shuffle,
    cellKey,
} from "./laserMazeTypes.ts";

import type {
    MazeCell,
    MirrorData,
    ExitData,
    MazeConfig,
} from "./laserMazeTypes.ts";

// ─── Maze grid generation (recursive backtracker) ───
export function generateMazeCells(size: number): MazeCell[][] {
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

// ─── Boundary helpers ───────────────────────────────
export function boundaryCells(size: number) {
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

// ─── BFS & path building ────────────────────────────
export function bfs(cells: MazeCell[][], start: { row: number; col: number }) {
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

export function buildPath(
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

export function getMoveDir(from: { row: number; col: number }, to: { row: number; col: number }) {
    if (to.row === from.row - 1) return "N";
    if (to.row === from.row + 1) return "S";
    if (to.col === from.col - 1) return "W";
    if (to.col === from.col + 1) return "E";
    return "";
}

// ─── Full maze config builder ───────────────────────
export function createMazeConfig(gridSize: number, exitCount: number): MazeConfig {
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

// ─── Laser path densification ───────────────────────
export function densifyPath(points: THREE.Vector3[], step: number) {
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
