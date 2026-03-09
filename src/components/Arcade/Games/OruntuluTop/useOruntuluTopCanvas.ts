import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { GAME_CONFIG } from './constants';
import {
    repositionBubbles
} from './logic';
import {
    advanceFlyingBall,
    calculateLaunchVelocity
} from './physics';
import {
    drawBubble,
    drawParticles,
    drawSlingshot,
    drawTrajectoryGuide,
    drawWhiteBall,
    resolveCanvasLayout
} from './canvasRendering';
import type { Bubble, Particle, Point } from './types';

interface CanvasLayoutSnapshot {
    width: number;
    bubbleRadius: number;
    gridCols: number;
    gridOffsetY: number;
}

interface UseOruntuluTopCanvasConfig {
    isPlaying: boolean;
    feedbackActive: boolean;
    isResolvingRef: MutableRefObject<boolean>;
    bubblesRef: MutableRefObject<Bubble[]>;
    particlesRef: MutableRefObject<Particle[]>;
    onBubbleHit: (bubble: Bubble) => void;
}

export const useOruntuluTopCanvas = ({
    isPlaying,
    feedbackActive,
    isResolvingRef,
    bubblesRef,
    particlesRef,
    onBubbleHit
}: UseOruntuluTopCanvasConfig) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const ballPosRef = useRef<Point>({ x: 0, y: 0 });
    const ballVelocityRef = useRef<Point>({ x: 0, y: 0 });
    const anchorPosRef = useRef<Point>({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const isFlyingRef = useRef(false);
    const dynamicRadiusRef = useRef(GAME_CONFIG.BUBBLE_RADIUS);
    const gridOffsetYRef = useRef(300);
    const gridColsRef = useRef(GAME_CONFIG.GRID_COLS);

    const getLayoutSnapshot = useCallback((): CanvasLayoutSnapshot => ({
        width: canvasRef.current?.width || 800,
        bubbleRadius: dynamicRadiusRef.current,
        gridCols: gridColsRef.current,
        gridOffsetY: gridOffsetYRef.current
    }), []);

    const handlePointerStart = useCallback((x: number, y: number) => {
        if (!isPlaying || isFlyingRef.current || feedbackActive || isResolvingRef.current) {
            return;
        }

        const distance = Math.sqrt(
            (x - ballPosRef.current.x) ** 2 +
            (y - ballPosRef.current.y) ** 2
        );

        if (distance < 60) {
            isDraggingRef.current = true;
        }
    }, [feedbackActive, isPlaying, isResolvingRef]);

    const handlePointerMove = useCallback((x: number, y: number) => {
        if (!isDraggingRef.current || !isPlaying) {
            return;
        }

        const dx = x - anchorPosRef.current.x;
        const dy = y - anchorPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const limitedDistance = Math.min(distance, GAME_CONFIG.MAX_DRAG_DIST);
        const angle = Math.atan2(dy, dx);

        ballPosRef.current = {
            x: anchorPosRef.current.x + Math.cos(angle) * limitedDistance,
            y: anchorPosRef.current.y + Math.sin(angle) * limitedDistance
        };
    }, [isPlaying]);

    const handlePointerEnd = useCallback(() => {
        if (!isDraggingRef.current || !isPlaying) {
            return;
        }

        isDraggingRef.current = false;
        const velocity = calculateLaunchVelocity(
            anchorPosRef.current,
            ballPosRef.current,
            GAME_CONFIG.MAX_DRAG_DIST,
            GAME_CONFIG.MIN_FORCE_MULT,
            GAME_CONFIG.MAX_FORCE_MULT
        );

        if (!velocity) {
            ballPosRef.current = { ...anchorPosRef.current };
            return;
        }

        isFlyingRef.current = true;
        ballVelocityRef.current = velocity;
    }, [isPlaying]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;

        if (!canvas || !container) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const resizeCanvas = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            const layout = resolveCanvasLayout(canvas.width, canvas.height);
            dynamicRadiusRef.current = layout.bubbleRadius;
            gridColsRef.current = layout.gridCols;
            gridOffsetYRef.current = layout.gridOffsetY;
            anchorPosRef.current = layout.anchorPos;

            if (!isFlyingRef.current && !isDraggingRef.current) {
                ballPosRef.current = { ...anchorPosRef.current };
            }

            if (bubblesRef.current.length > 0) {
                bubblesRef.current = repositionBubbles(
                    bubblesRef.current,
                    getLayoutSnapshot()
                );
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        let animationFrame = 0;
        const update = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            const bubbleRadius = dynamicRadiusRef.current;

            bubblesRef.current.forEach((bubble) => {
                if (bubble.active) {
                    drawBubble(context, bubble.x, bubble.y, bubbleRadius - 1, bubble.color);
                }
            });

            if (isDraggingRef.current) {
                drawTrajectoryGuide({
                    context,
                    anchorPos: anchorPosRef.current,
                    ballPos: ballPosRef.current,
                    bubbleRadius,
                    canvasWidth: canvas.width,
                    gridOffsetY: gridOffsetYRef.current
                });
            }

            if (isFlyingRef.current) {
                const { hitBubble, shouldReset } = advanceFlyingBall({
                    ballPos: ballPosRef.current,
                    ballVelocity: ballVelocityRef.current,
                    bubbleRadius,
                    canvasWidth: canvas.width,
                    canvasHeight: canvas.height,
                    bubbles: bubblesRef.current
                });

                if (hitBubble) {
                    onBubbleHit(hitBubble);
                }

                if (shouldReset) {
                    isFlyingRef.current = false;
                    ballPosRef.current = { ...anchorPosRef.current };
                    ballVelocityRef.current = { x: 0, y: 0 };
                }
            }

            if (!isFlyingRef.current) {
                drawSlingshot(
                    context,
                    anchorPosRef.current,
                    ballPosRef.current,
                    canvas.height,
                    isDraggingRef.current
                );
            }

            drawWhiteBall(
                context,
                ballPosRef.current.x,
                ballPosRef.current.y,
                bubbleRadius
            );

            drawParticles(context, particlesRef.current);
            animationFrame = requestAnimationFrame(update);
        };

        animationFrame = requestAnimationFrame(update);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrame);
        };
    }, [
        bubblesRef,
        feedbackActive,
        getLayoutSnapshot,
        isPlaying,
        isResolvingRef,
        onBubbleHit,
        particlesRef
    ]);

    return {
        canvasRef,
        containerRef,
        getLayoutSnapshot,
        handlePointerStart,
        handlePointerMove,
        handlePointerEnd
    };
};
