import { Point, PuzzlePiece } from '../types';
import { COLORS } from '../constants';
import { Delaunay } from 'd3-delaunay';

export function generatePuzzlePieces(count: number, colorCount: number): PuzzlePiece[] {
    // We work in a 10x10 coordinate space for the square
    const size = 10;
    const points: Point[] = [];

    // Random interior points
    for (let i = 0; i < count; i++) {
        points.push([
            Math.random() * size,
            Math.random() * size
        ]);
    }

    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, size, size]);

    const activeColors = COLORS.slice(0, colorCount);
    const pieces: PuzzlePiece[] = [];

    for (let i = 0; i < count; i++) {
        const polygon = voronoi.cellPolygon(i);
        if (!polygon) continue;

        // Convert to relative coordinates around center for easier 3D centering
        const relativePoints = polygon.map(p => [p[0] - size / 2, p[1] - size / 2] as Point);

        pieces.push({
            id: `piece-${i}`,
            points: relativePoints,
            targetColor: activeColors[Math.floor(Math.random() * activeColors.length)],
            depth: 0.5 + Math.random() * 1.5,
            isSelected: false,
            isCorrect: false
        });
    }

    return pieces;
}
