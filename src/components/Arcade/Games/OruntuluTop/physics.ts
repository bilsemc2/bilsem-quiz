import type { Bubble, Particle, Point } from './types.ts';

export const createExplosionParticles = (
    x: number,
    y: number,
    color: string,
    count: number = 20,
    randomFn: () => number = Math.random
): Particle[] => {
    return Array.from({ length: count }, () => ({
        x,
        y,
        vx: (randomFn() - 0.5) * 15,
        vy: (randomFn() - 0.5) * 15,
        life: 1,
        color
    }));
};

export const calculateLaunchVelocity = (
    anchorPos: Point,
    ballPos: Point,
    maxDragDistance: number,
    minForceMultiplier: number,
    maxForceMultiplier: number
) => {
    const dx = anchorPos.x - ballPos.x;
    const dy = anchorPos.y - ballPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 30) {
        return null;
    }

    const power = distance / maxDragDistance;
    const forceMultiplier =
        minForceMultiplier +
        (maxForceMultiplier - minForceMultiplier) * power;

    return {
        x: dx * forceMultiplier,
        y: dy * forceMultiplier
    };
};

export const advanceFlyingBall = ({
    ballPos,
    ballVelocity,
    bubbleRadius,
    canvasWidth,
    canvasHeight,
    bubbles,
    steps = 10
}: {
    ballPos: Point;
    ballVelocity: Point;
    bubbleRadius: number;
    canvasWidth: number;
    canvasHeight: number;
    bubbles: Bubble[];
    steps?: number;
}) => {
    for (let step = 0; step < steps; step += 1) {
        ballPos.x += ballVelocity.x / steps;
        ballPos.y += ballVelocity.y / steps;

        if (ballPos.x < bubbleRadius || ballPos.x > canvasWidth - bubbleRadius) {
            ballVelocity.x *= -1;
        }

        const hitBubble = bubbles.find((bubble) =>
            bubble.active &&
            Math.sqrt((ballPos.x - bubble.x) ** 2 + (ballPos.y - bubble.y) ** 2) < bubbleRadius * 1.7
        );

        if (hitBubble) {
            return {
                hitBubble,
                shouldReset: true
            };
        }
    }

    return {
        hitBubble: null,
        shouldReset: ballPos.y < 0 || ballPos.y > canvasHeight
    };
};
