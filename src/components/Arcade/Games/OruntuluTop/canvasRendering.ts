import { COLOR_CONFIG, GAME_CONFIG } from './constants.ts';
import type { BubbleColor, Particle, Point } from './types.ts';

export interface CanvasLayout {
    bubbleRadius: number;
    gridCols: number;
    gridOffsetY: number;
    anchorPos: Point;
}

export const resolveCanvasLayout = (
    width: number,
    height: number
): CanvasLayout => {
    const isMobile = width < 600;
    const isTablet = width < 900;
    const bubbleRadius = isMobile
        ? 14
        : isTablet
            ? 18
            : GAME_CONFIG.BUBBLE_RADIUS;
    const gridCols = isMobile
        ? 8
        : isTablet
            ? 10
            : GAME_CONFIG.GRID_COLS;
    const gridOffsetY = isMobile
        ? Math.max(height * 0.35, 240)
        : Math.min(height * 0.3, 300);

    return {
        bubbleRadius,
        gridCols,
        gridOffsetY,
        anchorPos: {
            x: width / 2,
            y: height - (isMobile ? 80 : GAME_CONFIG.SLINGSHOT_BOTTOM_OFFSET)
        }
    };
};

export const drawBubble = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: BubbleColor
) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = COLOR_CONFIG[color].hex;
    context.fill();
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.stroke();
    context.beginPath();
    context.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.6)';
    context.fill();
};

export const drawWhiteBall = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = '#ffffff';
    context.fill();
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.stroke();
    context.beginPath();
    context.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fill();
};

export const drawTrajectoryGuide = ({
    context,
    anchorPos,
    ballPos,
    bubbleRadius,
    canvasWidth,
    gridOffsetY
}: {
    context: CanvasRenderingContext2D;
    anchorPos: Point;
    ballPos: Point;
    bubbleRadius: number;
    canvasWidth: number;
    gridOffsetY: number;
}) => {
    const dx = anchorPos.x - ballPos.x;
    const dy = anchorPos.y - ballPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 20) {
        return;
    }

    let velocityX = dx / distance;
    let velocityY = dy / distance;
    if (velocityY > 0) {
        velocityY = -Math.abs(velocityY);
    }

    const trajectoryPoints: Point[] = [{ ...anchorPos }];
    const bouncePoints: Point[] = [];
    let currentX = anchorPos.x;
    let currentY = anchorPos.y;

    for (let step = 0; step < 100; step += 1) {
        const nextX = currentX + velocityX * 10;
        const nextY = currentY + velocityY * 10;

        if (nextX < bubbleRadius) {
            const ratio = (bubbleRadius - currentX) / (velocityX * 10);
            const bounceY = currentY + velocityY * 10 * ratio;
            bouncePoints.push({ x: bubbleRadius, y: bounceY });
            trajectoryPoints.push({ x: bubbleRadius, y: bounceY });
            currentX = bubbleRadius + (nextX - bubbleRadius) * -1;
            currentY = nextY;
            velocityX *= -1;
        } else if (nextX > canvasWidth - bubbleRadius) {
            const wall = canvasWidth - bubbleRadius;
            const ratio = (wall - currentX) / (velocityX * 10);
            const bounceY = currentY + velocityY * 10 * ratio;
            bouncePoints.push({ x: wall, y: bounceY });
            trajectoryPoints.push({ x: wall, y: bounceY });
            currentX = wall - (nextX - wall);
            currentY = nextY;
            velocityX *= -1;
        } else {
            currentX = nextX;
            currentY = nextY;
        }

        trajectoryPoints.push({ x: currentX, y: currentY });
        if (currentY < gridOffsetY + 50) {
            break;
        }
    }

    context.save();
    context.shadowBlur = 15;
    context.shadowColor = 'rgba(100, 200, 255, 0.8)';
    context.beginPath();
    context.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);
    for (let index = 1; index < trajectoryPoints.length; index += 1) {
        context.lineTo(trajectoryPoints[index].x, trajectoryPoints[index].y);
    }
    context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    context.lineWidth = 4;
    context.setLineDash([12, 8]);
    context.lineCap = 'round';
    context.stroke();

    context.shadowBlur = 0;
    context.beginPath();
    context.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);
    for (let index = 1; index < trajectoryPoints.length; index += 1) {
        context.lineTo(trajectoryPoints[index].x, trajectoryPoints[index].y);
    }
    context.strokeStyle = 'rgba(100, 220, 255, 0.6)';
    context.lineWidth = 2;
    context.setLineDash([12, 8]);
    context.stroke();
    context.setLineDash([]);
    context.restore();

    bouncePoints.forEach((point) => {
        context.beginPath();
        context.arc(point.x, point.y, 14, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255, 150, 50, 0.3)';
        context.fill();

        context.beginPath();
        context.arc(point.x, point.y, 8, 0, Math.PI * 2);
        const bounceGradient = context.createRadialGradient(
            point.x - 2,
            point.y - 2,
            0,
            point.x,
            point.y,
            8
        );
        bounceGradient.addColorStop(0, '#ffdd00');
        bounceGradient.addColorStop(1, '#ff8800');
        context.fillStyle = bounceGradient;
        context.fill();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();
    });
};

export const drawSlingshot = (
    context: CanvasRenderingContext2D,
    anchorPos: Point,
    ballPos: Point,
    canvasHeight: number,
    isDragging: boolean
) => {
    context.beginPath();
    context.moveTo(anchorPos.x - 30, anchorPos.y);
    context.lineTo(ballPos.x, ballPos.y);
    context.lineTo(anchorPos.x + 30, anchorPos.y);
    context.strokeStyle = isDragging
        ? 'rgba(255,255,255,0.6)'
        : 'rgba(255,255,255,0.1)';
    context.lineWidth = 2;
    context.stroke();

    context.beginPath();
    context.moveTo(anchorPos.x, canvasHeight);
    context.lineTo(anchorPos.x, anchorPos.y + 20);
    context.lineWidth = 4;
    context.strokeStyle = '#111';
    context.stroke();
};

export const drawParticles = (
    context: CanvasRenderingContext2D,
    particles: Particle[]
) => {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;

        if (particle.life <= 0) {
            particles.splice(index, 1);
            continue;
        }

        context.globalAlpha = particle.life;
        context.beginPath();
        context.arc(particle.x, particle.y, Math.random() * 4, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.fill();
    }

    context.globalAlpha = 1;
};
