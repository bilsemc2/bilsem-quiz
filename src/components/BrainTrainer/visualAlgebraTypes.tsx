import React from "react";
import { GAME_COLORS } from './shared/gameColors';

export enum ShapeType {
    SQUARE = "SQUARE",
    TRIANGLE = "TRIANGLE",
    CIRCLE = "CIRCLE",
    STAR = "STAR",
    PENTAGON = "PENTAGON",
}

export type WeightMap = { [key in ShapeType]?: number };
export type PanContent = { [key in ShapeType]?: number };

export interface BalanceState {
    left: PanContent;
    right: PanContent;
}

export interface LevelData {
    levelNumber: number;
    weights: WeightMap;
    referenceEquation: BalanceState;
    question: { left: PanContent };
    description: string;
    detailedExplanation?: string;
}

export const AVAILABLE_SHAPES = [
    ShapeType.SQUARE,
    ShapeType.TRIANGLE,
    ShapeType.CIRCLE,
    ShapeType.STAR,
];

export const getShapesForLevel = (l: number) =>
    l <= 3
        ? AVAILABLE_SHAPES.slice(0, 2)
        : l <= 7
            ? AVAILABLE_SHAPES.slice(0, 3)
            : AVAILABLE_SHAPES;

export const calcWeight = (c: PanContent, w: WeightMap) =>
    Object.entries(c).reduce(
        (t, [s, n]) => t + (w[s as ShapeType] || 0) * (n as number),
        0,
    );

const shuffle = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const genWeights = (sh: ShapeType[], l: number) => {
    const w: WeightMap = {};
    const max = Math.min(3 + Math.floor(l / 3), 10);
    sh.forEach((s) => (w[s] = Math.floor(Math.random() * max) + 1));
    const v = Object.values(w) as number[];
    if (v.every((x) => x === v[0]) && sh.length > 1)
        w[sh[1]] = (w[sh[0]]! % max) + 1;
    return w;
};

const findBalancedRightPan = (
    sh: ShapeType[],
    w: WeightMap,
    target: number,
    maxCountPerShape: number,
    leftPan: PanContent,
): PanContent | null => {
    const solutions: PanContent[] = [];

    const dfs = (idx: number, cur: PanContent, sum: number) => {
        if (sum > target) return;
        if (idx === sh.length) {
            if (sum !== target) return;
            const totalItems = Object.values(cur).reduce((acc, n) => acc + (n || 0), 0);
            if (totalItems === 0) return;
            solutions.push({ ...cur });
            return;
        }
        const s = sh[idx];
        const val = w[s]!;
        const maxByTarget = Math.floor((target - sum) / val);
        const maxUse = Math.min(maxCountPerShape, maxByTarget);
        const countOptions = shuffle(Array.from({ length: maxUse + 1 }, (_, i) => i));
        for (const c of countOptions) {
            if (c > 0) cur[s] = c;
            else delete cur[s];
            dfs(idx + 1, cur, sum + c * val);
        }
        delete cur[s];
    };

    dfs(0, {}, 0);
    if (solutions.length === 0) return null;
    const nonIdentical = solutions.filter((sol) =>
        sh.some((s) => (sol[s] || 0) !== (leftPan[s] || 0)),
    );
    const pool = nonIdentical.length > 0 ? nonIdentical : solutions;
    return pool[Math.floor(Math.random() * pool.length)];
};

export const genLevel = (l: number): LevelData => {
    const sh = getShapesForLevel(l);
    const n = Math.min(1 + Math.floor(l / 4), 3);
    const m = Math.min(1 + Math.floor(l / 3), 4);

    for (let attempt = 0; attempt < 60; attempt++) {
        const w = genWeights(sh, l);
        const rl: PanContent = {};
        for (let i = 0; i < n; i++) {
            const s = sh[i % sh.length];
            rl[s] = (rl[s] || 0) + 1;
        }
        const target = calcWeight(rl, w);
        const rr = findBalancedRightPan(sh, w, target, Math.ceil(l / 5) + 2, rl) || null;
        if (!rr) continue;

        const ql: PanContent = {};
        for (let i = 0; i < m; i++) {
            const s = sh[Math.floor(Math.random() * sh.length)];
            ql[s] = (ql[s] || 0) + 1;
        }
        if (calcWeight(rl, w) !== calcWeight(rr, w)) continue;

        const expl =
            `Ağırlıklar:\n` +
            sh.filter((s) => w[s]).map((s) => `• ${s} = ${w[s]}`).join("\n") +
            `\nSol: ${calcWeight(ql, w)}`;

        return {
            levelNumber: l, weights: w,
            referenceEquation: { left: rl, right: rr },
            question: { left: ql },
            description: l <= 2 ? "Kuralı çöz ve soru terazisini dengele!" : "İpucu terazisinden kuralı bul!",
            detailedExplanation: expl,
        };
    }

    const fw = genWeights(sh, l);
    const fl: PanContent = {};
    for (let i = 0; i < n; i++) { const s = sh[i % sh.length]; fl[s] = (fl[s] || 0) + 1; }
    const fq: PanContent = {};
    for (let i = 0; i < m; i++) { const s = sh[Math.floor(Math.random() * sh.length)]; fq[s] = (fq[s] || 0) + 1; }
    return {
        levelNumber: l, weights: fw,
        referenceEquation: { left: fl, right: { ...fl } },
        question: { left: fq },
        description: l <= 2 ? "Kuralı çöz ve soru terazisini dengele!" : "İpucu terazisinden kuralı bul!",
        detailedExplanation: `Ağırlıklar:\n` + sh.filter((s) => fw[s]).map((s) => `• ${s} = ${fw[s]}`).join("\n") + `\nSol: ${calcWeight(fq, fw)}`,
    };
};

// ── ShapeIcon component ──

export const ShapeIcon: React.FC<{
    type: ShapeType;
    size?: number;
    weight?: number;
    className?: string;
}> = ({ type, size = 32, weight, className = "" }) => {
    const textEl = weight !== undefined && (
        <text x="12" y="16.5" textAnchor="middle" fill="#1e293b" fontSize="10"
            fontFamily="Syne, sans-serif" fontWeight="900" stroke="white" strokeWidth="3"
            paintOrder="stroke" style={{ pointerEvents: "none" }}>
            {weight}
        </text>
    );

    const cls = `transition-all duration-300 drop-shadow-neo-sm ${className}`;
    const colors = {
        [ShapeType.SQUARE]: "#14f195",
        [ShapeType.TRIANGLE]: "#ff2745",
        [ShapeType.CIRCLE]: "#3374ff",
        [ShapeType.STAR]: GAME_COLORS.yellow,
        [ShapeType.PENTAGON]: "#fff",
    };

    const shapes = {
        [ShapeType.SQUARE]: <rect x="3" y="3" width="18" height="18" rx="4" ry="4" stroke="black" strokeWidth="2.5" />,
        [ShapeType.TRIANGLE]: <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="black" strokeWidth="2.5" strokeLinejoin="round" />,
        [ShapeType.CIRCLE]: <circle cx="12" cy="12" r="9" stroke="black" strokeWidth="2.5" />,
        [ShapeType.STAR]: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="black" strokeWidth="2.5" strokeLinejoin="round" />,
        [ShapeType.PENTAGON]: <path d="M12 2L2 9l4 13h12l4-13L12 2z" stroke="black" strokeWidth="2.5" strokeLinejoin="round" />,
    };

    return (
        <svg viewBox="0 0 24 24" fill={colors[type]} className={cls} width={size} height={size} style={{ overflow: "visible" }}>
            {shapes[type]}
            {textEl}
        </svg>
    );
};
