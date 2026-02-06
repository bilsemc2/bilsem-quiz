// Matrix Puzzle System - Shape Renderer
// SVG tabanlı şekil çizici - 3D Gummy Candy estetiği

import React from 'react';
import { BaseShape, CANDY_COLORS } from '../../../types/matrixRules';

interface ShapeRendererProps {
    shape: BaseShape;
    size: number;
    className?: string;
    isHidden?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
    shape,
    size,
    className = '',
    isHidden = false,
    isSelected = false,
    onClick,
}) => {
    const center = size / 2;
    const shapeSize = (size * 0.7 * shape.scale);

    // Gummy candy gölge efekti
    const gummyShadow = `
    drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))
  `;

    // Gizli hücre için placeholder
    if (isHidden) {
        return (
            <div
                className={`relative flex items-center justify-center ${className}`}
                style={{
                    width: size,
                    height: size,
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                    borderRadius: 16,
                    border: '3px dashed rgba(139, 92, 246, 0.5)',
                }}
                onClick={onClick}
            >
                <span className="text-4xl">❓</span>
            </div>
        );
    }

    // İç ızgara render'ı
    if (shape.type === 'grid' && shape.innerGrid) {
        return (
            <div
                className={`relative ${className} ${isSelected ? 'ring-4 ring-amber-400' : ''}`}
                style={{
                    width: size,
                    height: size,
                    transform: `rotate(${shape.rotation}deg)`,
                    transition: 'transform 0.3s ease',
                    cursor: onClick ? 'pointer' : 'default',
                }}
                onClick={onClick}
            >
                <InnerGridRenderer
                    grid={shape.innerGrid}
                    size={size}
                    cellColor={shape.innerGrid.cellColor || CANDY_COLORS[0]}
                />
            </div>
        );
    }

    // Normal şekil render'ı
    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={`${className} ${isSelected ? 'ring-4 ring-amber-400 rounded-2xl' : ''}`}
            style={{
                filter: gummyShadow,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s ease',
            }}
            onClick={onClick}
        >
            <defs>
                {/* Gradient tanımları */}
                <linearGradient id={`grad-${shape.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={shape.fillLeft || shape.fill || CANDY_COLORS[0]} />
                    <stop offset="100%" stopColor={shape.fillRight || shape.fill || CANDY_COLORS[0]} />
                </linearGradient>

                {/* İkiye bölünmüş şekil için clip path */}
                {shape.isSplit && (
                    <>
                        <clipPath id={`clip-left-${shape.id}`}>
                            <rect x="0" y="0" width={center} height={size} />
                        </clipPath>
                        <clipPath id={`clip-right-${shape.id}`}>
                            <rect x={center} y="0" width={center} height={size} />
                        </clipPath>
                    </>
                )}

                {/* Gummy iç gölge */}
                <filter id={`inner-shadow-${shape.id}`}>
                    <feOffset dx="0" dy="2" />
                    <feGaussianBlur stdDeviation="2" result="offset-blur" />
                    <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                    <feFlood floodColor="white" floodOpacity="0.3" result="color" />
                    <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                    <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                </filter>
            </defs>

            <g
                transform={`rotate(${shape.rotation} ${center} ${center})`}
                style={{ transition: 'transform 0.3s ease' }}
            >
                {shape.isSplit ? (
                    <>
                        {/* Sol yarı */}
                        <g clipPath={`url(#clip-left-${shape.id})`}>
                            {renderShape(shape.type, center, center, shapeSize, shape.fillLeft || CANDY_COLORS[0], shape.id, shape.strokeWidth, shape.strokeColor)}
                        </g>
                        {/* Sağ yarı */}
                        <g clipPath={`url(#clip-right-${shape.id})`}>
                            {renderShape(shape.type, center, center, shapeSize, shape.fillRight || CANDY_COLORS[1], shape.id, shape.strokeWidth, shape.strokeColor)}
                        </g>
                        {/* Ayırıcı çizgi */}
                        <line
                            x1={center}
                            y1={center - shapeSize / 2}
                            x2={center}
                            y2={center + shapeSize / 2}
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth="2"
                        />
                    </>
                ) : (
                    renderShape(shape.type, center, center, shapeSize, shape.fill || CANDY_COLORS[0], shape.id, shape.strokeWidth, shape.strokeColor)
                )}

                {/* Renkli Çubuklar */}
                {shape.coloredBars && (
                    <g>
                        {shape.coloredBars.colors.map((color, index) => {
                            const barCount = shape.coloredBars!.colors.length;
                            const isVertical = shape.coloredBars!.orientation === 'vertical';

                            // Offset ile pozisyon hesapla (wrap around)
                            const offsetIndex = (index + shape.coloredBars!.offset) % barCount;

                            if (isVertical) {
                                // Dikey çubuklar (soldan sağa)
                                const barWidth = shapeSize / (barCount + 2);
                                const barHeight = shapeSize * 0.8;
                                const startX = center - shapeSize / 2 + barWidth;
                                const x = startX + offsetIndex * barWidth;

                                return (
                                    <rect
                                        key={index}
                                        x={x}
                                        y={center - barHeight / 2}
                                        width={barWidth * 0.7}
                                        height={barHeight}
                                        fill={color}
                                        rx={4}
                                        opacity={0.9}
                                    />
                                );
                            } else {
                                // Yatay çubuklar (yukarıdan aşağıya)
                                const barHeight = shapeSize / (barCount + 2);
                                const barWidth = shapeSize * 0.8;
                                const startY = center - shapeSize / 2 + barHeight;
                                const y = startY + offsetIndex * barHeight;

                                return (
                                    <rect
                                        key={index}
                                        x={center - barWidth / 2}
                                        y={y}
                                        width={barWidth}
                                        height={barHeight * 0.7}
                                        fill={color}
                                        rx={4}
                                        opacity={0.9}
                                    />
                                );
                            }
                        })}
                    </g>
                )}
            </g>
        </svg>
    );
};

// Şekil çizici yardımcı fonksiyon
function renderShape(
    type: string,
    cx: number,
    cy: number,
    size: number,
    fill: string,
    id: string,
    strokeWidth?: number,
    strokeColor?: string
): React.ReactNode {
    const halfSize = size / 2;

    const commonStyle: React.CSSProperties = {
        filter: `url(#inner-shadow-${id})`,
    };

    // Çerçeve özellikleri
    const strokeProps = strokeWidth ? {
        stroke: strokeColor || '#333333',
        strokeWidth: strokeWidth,
    } : {};

    switch (type) {
        case 'rectangle':
            return (
                <rect
                    x={cx - halfSize}
                    y={cy - halfSize}
                    width={size}
                    height={size}
                    rx={size * 0.15}
                    fill={fill}
                    {...strokeProps}
                    style={commonStyle}
                />
            );

        case 'circle':
            return (
                <circle
                    cx={cx}
                    cy={cy}
                    r={halfSize}
                    fill={fill}
                    {...strokeProps}
                    style={commonStyle}
                />
            );

        case 'triangle':
            const trianglePoints = [
                `${cx},${cy - halfSize}`,
                `${cx - halfSize},${cy + halfSize * 0.7}`,
                `${cx + halfSize},${cy + halfSize * 0.7}`,
            ].join(' ');
            return (
                <polygon
                    points={trianglePoints}
                    fill={fill}
                    {...strokeProps}
                    style={commonStyle}
                />
            );

        case 'diamond':
            const diamondPoints = [
                `${cx},${cy - halfSize}`,
                `${cx + halfSize},${cy}`,
                `${cx},${cy + halfSize}`,
                `${cx - halfSize},${cy}`,
            ].join(' ');
            return (
                <polygon
                    points={diamondPoints}
                    fill={fill}
                    {...strokeProps}
                    style={commonStyle}
                />
            );

        case 'star':
            return renderStar(cx, cy, halfSize, fill, commonStyle);

        case 'hexagon':
            return renderHexagon(cx, cy, halfSize, fill, commonStyle);

        default:
            return (
                <rect
                    x={cx - halfSize}
                    y={cy - halfSize}
                    width={size}
                    height={size}
                    fill={fill}
                    style={commonStyle}
                />
            );
    }
}

function renderStar(cx: number, cy: number, r: number, fill: string, style: React.CSSProperties): React.ReactNode {
    const points: string[] = [];
    for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? r : r * 0.5;
        const angle = (i * 36 - 90) * (Math.PI / 180);
        points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
    }
    return <polygon points={points.join(' ')} fill={fill} style={style} />;
}

function renderHexagon(cx: number, cy: number, r: number, fill: string, style: React.CSSProperties): React.ReactNode {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * (Math.PI / 180);
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return <polygon points={points.join(' ')} fill={fill} style={style} />;
}

// İç ızgara renderer
interface InnerGridRendererProps {
    grid: { size: 3 | 4; cells: boolean[][] };
    size: number;
    cellColor: string;
}

const InnerGridRenderer: React.FC<InnerGridRendererProps> = ({ grid, size, cellColor }) => {
    const cellSize = (size - 16) / grid.size; // 16px padding

    return (
        <div
            className="rounded-2xl p-2"
            style={{
                width: size,
                height: size,
                background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9) 0%, rgba(20, 20, 40, 0.9) 100%)',
                boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 4px 8px rgba(255,255,255,0.1)',
                display: 'grid',
                gridTemplateColumns: `repeat(${grid.size}, 1fr)`,
                gap: 3,
            }}
        >
            {grid.cells.flat().map((filled, index) => (
                <div
                    key={index}
                    style={{
                        width: cellSize - 4,
                        height: cellSize - 4,
                        borderRadius: 6,
                        background: filled
                            ? `linear-gradient(135deg, ${cellColor} 0%, ${adjustColor(cellColor, -20)} 100%)`
                            : 'rgba(255, 255, 255, 0.05)',
                        boxShadow: filled
                            ? `inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3), 0 2px 6px ${cellColor}40`
                            : 'inset 0 1px 2px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease',
                    }}
                />
            ))}
        </div>
    );
};

// Renk ayarlama yardımcısı
function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default ShapeRenderer;
