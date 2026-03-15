// LabirentUstasi — State management hook

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence.ts';
import { useGameViewportFocus } from '../../../../hooks/useGameViewportFocus.ts';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE, ARCADE_FEEDBACK_TEXTS } from '../../Shared/ArcadeConstants.ts';
import { useArcadeSoundEffects } from '../../Shared/useArcadeSoundEffects.ts';
import {
    createEmptyGrid,
    generateBinaryTree,
    generateDFSMaze,
    generateHuntAndKill,
    generatePrimsMaze,
    solveMaze,
} from './services/mazeGenerator.ts';
import { AlgorithmType, type Cell } from './types.ts';
import { LEVELS, JOYSTICK_RADIUS, MOVE_THRESHOLD, MOVE_COOLDOWN } from './logic.ts';
import type { GamePhase } from './logic.ts';

export function useLabirentController() {
    const location = useLocation();
    const navigate = useNavigate();
    const { saveGamePlay } = useGamePersistence();
    const { playAreaRef, focusPlayArea } = useGameViewportFocus();
    const { playArcadeSound } = useArcadeSoundEffects();
    const gameStartTimeRef = useRef<number>(0);
    const isResolvingRef = useRef(false);
    const hasSavedRef = useRef(false);
    const timeoutIdsRef = useRef<number[]>([]);

    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [currentLevel, setCurrentLevel] = useState(0);
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [solution, setSolution] = useState<[number, number][]>([]);
    const [userPath, setUserPath] = useState<[number, number][]>([]);
    const [playerPosition, setPlayerPosition] = useState<[number, number] | null>(null);
    const [score, setScore] = useState(0);
    const [showLevelWin, setShowLevelWin] = useState(false);
    const [moves, setMoves] = useState(0);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const joystickRef = useRef<HTMLDivElement>(null);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMoveRef = useRef<number>(0);

    const clearScheduledTimeouts = useCallback(() => {
        timeoutIdsRef.current.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        timeoutIdsRef.current = [];
    }, []);

    const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
        const timeoutId = window.setTimeout(() => {
            timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
            callback();
        }, delay);

        timeoutIdsRef.current.push(timeoutId);
    }, []);

    const generateLevel = useCallback((levelIdx: number) => {
        const level = LEVELS[levelIdx];
        const initialGrid = createEmptyGrid(level.rows, level.cols);

        let generator;
        switch (level.algorithm) {
            case AlgorithmType.DFS:
                generator = generateDFSMaze(initialGrid);
                break;
            case AlgorithmType.PRIM:
                generator = generatePrimsMaze(initialGrid);
                break;
            case AlgorithmType.HUNT_AND_KILL:
                generator = generateHuntAndKill(initialGrid);
                break;
            case AlgorithmType.BINARY_TREE:
                generator = generateBinaryTree(initialGrid);
                break;
            default:
                generator = generateDFSMaze(initialGrid);
                break;
        }

        let lastValue;
        for (const step of generator) {
            lastValue = step;
        }

        if (lastValue) {
            setGrid(lastValue);
            setSolution([]);
            setUserPath([[0, 0]]);
            setPlayerPosition([0, 0]);
        }
    }, []);

    const startGame = useCallback(() => {
        clearScheduledTimeouts();
        playArcadeSound('start');
        setGamePhase('playing');
        setCurrentLevel(0);
        setScore(0);
        setMoves(0);
        setFeedback(null);
        setShowLevelWin(false);
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        gameStartTimeRef.current = Date.now();
        generateLevel(0);
        focusPlayArea();
    }, [clearScheduledTimeouts, focusPlayArea, generateLevel, playArcadeSound]);

    useEffect(() => {
        if (location.state?.autoStart && gamePhase === 'idle') {
            startGame();
        }
    }, [gamePhase, location.state, startGame]);

    useEffect(() => clearScheduledTimeouts, [clearScheduledTimeouts]);

    const level = LEVELS[currentLevel] ?? LEVELS[0];

    const movePlayer = useCallback((dr: number, dc: number) => {
        if (gamePhase !== 'playing' || !playerPosition || showLevelWin || isResolvingRef.current || grid.length === 0) {
            return;
        }

        const [r, c] = playerPosition;
        const nr = r + dr;
        const nc = c + dc;

        if (nr < 0 || nr >= level.rows || nc < 0 || nc >= level.cols) {
            return;
        }

        const currentCell = grid[r][c];
        let canMove = false;

        if (dr === -1 && !currentCell.walls.top) canMove = true;
        if (dr === 1 && !currentCell.walls.bottom) canMove = true;
        if (dc === -1 && !currentCell.walls.left) canMove = true;
        if (dc === 1 && !currentCell.walls.right) canMove = true;

        if (!canMove) {
            return;
        }

        setPlayerPosition([nr, nc]);
        setMoves((previousMoves) => previousMoves + 1);
        setUserPath((previousPath) => {
            if (previousPath.length > 0) {
                const [lastRow, lastCol] = previousPath[previousPath.length - 1];
                if (lastRow === nr && lastCol === nc) {
                    return previousPath;
                }
            }
            return [...previousPath, [nr, nc]];
        });

        if (nr === level.rows - 1 && nc === level.cols - 1) {
            isResolvingRef.current = true;
            const levelScore = ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, currentLevel + 1);
            const successMessages = ARCADE_FEEDBACK_TEXTS.SUCCESS_MESSAGES;

            setScore((previousScore) => previousScore + levelScore);
            setFeedback({
                message: successMessages[Math.floor(Math.random() * successMessages.length)],
                type: 'success',
            });
            playArcadeSound('success');

            scheduleTimeout(() => {
                setFeedback(null);
                setShowLevelWin(true);
                isResolvingRef.current = false;
            }, 1200);
        }
    }, [currentLevel, gamePhase, grid, level.cols, level.rows, playArcadeSound, playerPosition, scheduleTimeout, showLevelWin]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                    movePlayer(-1, 0);
                    break;
                case 'ArrowDown':
                case 's':
                    movePlayer(1, 0);
                    break;
                case 'ArrowLeft':
                case 'a':
                    movePlayer(0, -1);
                    break;
                case 'ArrowRight':
                case 'd':
                    movePlayer(0, 1);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePlayer]);

    const handleJoystickStart = useCallback(() => {
        if (!joystickRef.current) {
            return;
        }
        setIsDragging(true);
    }, []);

    const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
        if (!joystickRef.current || !isDragging) {
            return;
        }

        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > JOYSTICK_RADIUS) {
            dx = (dx / distance) * JOYSTICK_RADIUS;
            dy = (dy / distance) * JOYSTICK_RADIUS;
        }

        setJoystickPos({ x: dx, y: dy });

        const now = Date.now();
        if (now - lastMoveRef.current > MOVE_COOLDOWN && distance > MOVE_THRESHOLD) {
            lastMoveRef.current = now;
            if (Math.abs(dx) > Math.abs(dy)) {
                movePlayer(0, dx > 0 ? 1 : -1);
            } else {
                movePlayer(dy > 0 ? 1 : -1, 0);
            }
        }
    }, [isDragging, movePlayer]);

    const handleJoystickEnd = useCallback(() => {
        setIsDragging(false);
        setJoystickPos({ x: 0, y: 0 });
    }, []);

    const activeDirection = (() => {
        const { x, y } = joystickPos;
        const distance = Math.sqrt(x * x + y * y);
        if (distance < MOVE_THRESHOLD) {
            return null;
        }
        if (Math.abs(x) > Math.abs(y)) {
            return x > 0 ? 'right' : 'left';
        }
        return y > 0 ? 'down' : 'up';
    })();

    const finishGame = useCallback(() => {
        if (isResolvingRef.current) {
            return;
        }

        isResolvingRef.current = true;
        clearScheduledTimeouts();
        setGamePhase('finished');

        if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            void saveGamePlay({
                game_id: 'arcade-labirent-ustasi',
                score_achieved: score,
                duration_seconds: duration,
                metadata: {
                    game_name: 'Labirent Ustasi',
                    levels_completed: currentLevel + 1,
                    total_moves: moves,
                },
            });
        }
    }, [clearScheduledTimeouts, currentLevel, moves, saveGamePlay, score]);

    const nextLevel = useCallback(() => {
        clearScheduledTimeouts();
        playArcadeSound('levelUp');
        setShowLevelWin(false);
        setFeedback(null);
        if (currentLevel >= LEVELS.length - 1) {
            finishGame();
            return;
        }

        const nextLevelIndex = currentLevel + 1;
        setCurrentLevel(nextLevelIndex);
        setMoves(0);
        generateLevel(nextLevelIndex);
        focusPlayArea();
    }, [clearScheduledTimeouts, currentLevel, finishGame, focusPlayArea, generateLevel, playArcadeSound]);

    const showSolutionToggle = useCallback(() => {
        if (solution.length > 0) {
            setSolution([]);
            return;
        }

        const path = solveMaze(grid);
        setSolution(path);
        setScore((previousScore) => Math.max(0, previousScore - 50));
        setFeedback({ message: 'Çözüm gösteriliyor... (-50 puan)', type: 'error' });
        scheduleTimeout(() => setFeedback(null), 2000);
    }, [grid, scheduleTimeout, solution.length]);

    return {
        // State
        gamePhase,
        currentLevel,
        grid,
        solution,
        userPath,
        playerPosition,
        score,
        showLevelWin,
        moves,
        feedback,
        level,
        joystickRef,
        joystickPos,
        isDragging,
        activeDirection,
        playAreaRef,

        // Actions
        startGame,
        movePlayer,
        finishGame,
        nextLevel,
        showSolutionToggle,
        handleJoystickStart,
        handleJoystickMove,
        handleJoystickEnd,
        navigate,
    };
}
