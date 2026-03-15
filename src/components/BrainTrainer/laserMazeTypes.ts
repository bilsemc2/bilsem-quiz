import * as THREE from "three";

// ─── Constants ──────────────────────────────────────
export const CELL_SIZE = 2.2;
export const WALL_THICK = 0.25;
export const WALL_HEIGHT = 0.9;
export const LASER_Y = WALL_HEIGHT * 0.55;
export const LASER_STEP = CELL_SIZE * 0.2;
export const LASER_RADIUS = 0.085;
export const LASER_COLOR = "#ff0f1f";
export const LASER_EMISSIVE = "#ff3a3a";

// Maze Dirs
export const DIRS: Record<string, { dr: number; dc: number; vec: THREE.Vector3 }> = {
    N: { dr: -1, dc: 0, vec: new THREE.Vector3(0, 0, -1) },
    S: { dr: 1, dc: 0, vec: new THREE.Vector3(0, 0, 1) },
    W: { dr: 0, dc: -1, vec: new THREE.Vector3(-1, 0, 0) },
    E: { dr: 0, dc: 1, vec: new THREE.Vector3(1, 0, 0) },
};
export const OPPOSITE: Record<string, string> = { N: "S", S: "N", W: "E", E: "W" };

// Helpers
export const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
export const shuffle = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// ─── Types ──────────────────────────────────────────
export interface MazeCell {
    row: number;
    col: number;
    visited: boolean;
    walls: Record<string, boolean>;
}
export interface MirrorData {
    row: number;
    col: number;
    incoming: string;
    outgoing: string;
    real: boolean;
}
export interface ExitData {
    row: number;
    col: number;
    side: string;
    id: number;
}
export interface MazeConfig {
    cells: MazeCell[][];
    entrance: { row: number; col: number; side: string };
    exits: ExitData[];
    correctIndex: number;
    path: { row: number; col: number }[];
    mirrors: MirrorData[];
    entryDir: string;
    exitDir: string;
}

// Coordinate helpers
export const cellKey = (c: { row: number; col: number }) => `${c.row},${c.col}`;
export const cellToWorld = (r: number, c: number, size: number) => {
    const off = (size - 1) / 2;
    return new THREE.Vector3((c - off) * CELL_SIZE, 0, (r - off) * CELL_SIZE);
};
