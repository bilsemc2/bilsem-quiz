import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
import ArcadeGameShell from '../../Shared/ArcadeGameShell';
import ArcadeFeedbackBanner from '../../Shared/ArcadeFeedbackBanner';
import { ARCADE_SCORE_FORMULA, ARCADE_SCORE_BASE } from '../../Shared/ArcadeConstants';
import { FoldDirection, PaperState, PunchShape } from './types';
import { calculateUnfoldedPunches, getFoldedDimensions } from './utils';
import {
    Scissors,
    RotateCcw,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
} from 'lucide-react';

const PAPER_COLORS = [
    { name: 'Kraft', value: '#d4b483' },
    { name: 'Sky Blue', value: '#bae6fd' },
    { name: 'Peach', value: '#ffedd5' },
    { name: 'Lavender', value: '#f3e8ff' },
];

const ShapeIcon = ({ shape, className }: { shape: PunchShape, className?: string }) => {
    switch (shape) {
        case PunchShape.HEART:
            return (
                <svg viewBox="0 0 24 24" className={className} fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
            );
        case PunchShape.STAR:
            return (
                <svg viewBox="0 0 24 24" className={className} fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
            );
        case PunchShape.SQUARE:
            return <div className={`aspect-square bg-current rounded-sm ${className}`} />;
        default:
            return <div className={`aspect-square bg-current rounded-full ${className}`} />;
    }
};

type GamePhase = 'idle' | 'playing' | 'finished';

const KraftOrigami: React.FC = () => {
    const location = useLocation();
    const { saveGamePlay } = useGamePersistence();
    const gameStartTimeRef = useRef<number>(0);
    const isResolvingRef = useRef(false);
    const hasSavedRef = useRef(false);

    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [state, setState] = useState<PaperState>({
        folds: [],
        punches: [],
        isUnfolded: false,
        paperColor: PAPER_COLORS[0].value
    });
    const [currentShape, setCurrentShape] = useState<PunchShape>(PunchShape.CIRCLE);

    const foldedDim = useMemo(() => getFoldedDimensions(state.folds), [state.folds]);

    const finalPunches = useMemo(() => {
        return state.isUnfolded
            ? calculateUnfoldedPunches(state.folds, state.punches)
            : state.punches;
    }, [state.isUnfolded, state.folds, state.punches]);

    const score = useMemo(() => {
        const foldBonus = state.folds.length * ARCADE_SCORE_FORMULA(ARCADE_SCORE_BASE, 1);
        const punchBonus = finalPunches.length * Math.round(ARCADE_SCORE_BASE * 0.5);
        return foldBonus + punchBonus;
    }, [state.folds.length, finalPunches.length]);

    // Auto-start from Arcade Hub
    useEffect(() => {
        if (location.state?.autoStart && gamePhase === 'idle') {
            startGame();
        }
    }, [location.state]);

    const startGame = () => {
        window.scrollTo(0, 0);
        setGamePhase('playing');
        setState({
            folds: [],
            punches: [],
            isUnfolded: false,
            paperColor: PAPER_COLORS[0].value
        });
        setFeedback(null);
        hasSavedRef.current = false;
        isResolvingRef.current = false;
        gameStartTimeRef.current = Date.now();
    };

    const handleFold = (direction: FoldDirection) => {
        if (state.isUnfolded) return;
        if (state.folds.length >= 6) return;
        setState(prev => ({
            ...prev,
            folds: [...prev.folds, direction],
        }));
        setFeedback({ message: `Katlama ${state.folds.length + 1} yapıldı! 📐`, type: 'success' });
        setTimeout(() => setFeedback(null), 1500);
    };

    const handlePunch = (e: React.MouseEvent<HTMLDivElement>) => {
        if (state.isUnfolded) return;
        if (state.folds.length === 0) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;

        const absX = foldedDim.offsetX + relX * foldedDim.width;
        const absY = foldedDim.offsetY + relY * foldedDim.height;

        setState(prev => ({
            ...prev,
            punches: [...prev.punches, { x: absX, y: absY, shape: currentShape }]
        }));
    };

    const toggleUnfold = () => {
        setState(prev => ({ ...prev, isUnfolded: !prev.isUnfolded }));
        if (!state.isUnfolded) {
            setFeedback({ message: 'Simetri açıldı! ✨', type: 'success' });
            setTimeout(() => setFeedback(null), 1500);
        }
    };

    const handleReset = () => {
        setState(prev => ({ ...prev, folds: [], punches: [], isUnfolded: false }));
    };

    const finishGame = () => {
        if (isResolvingRef.current) return;
        isResolvingRef.current = true;
        setGamePhase('finished');
        if (!hasSavedRef.current) {
            hasSavedRef.current = true;
            const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
            saveGamePlay({
                game_id: 'arcade-kraft-origami',
                score_achieved: score,
                duration_seconds: duration,
                metadata: {
                    game_name: 'Kraft Origami',
                    total_folds: state.folds.length,
                    total_punches: state.punches.length,
                    unfolded_holes: finalPunches.length
                }
            });
        }
    };

    const isPunchable = !state.isUnfolded && state.folds.length > 0;

    // ─── Shell status mapping ────────────────────────────────────────────
    const shellStatus: 'START' | 'PLAYING' | 'GAME_OVER' =
        gamePhase === 'idle' ? 'START' :
            gamePhase === 'finished' ? 'GAME_OVER' : 'PLAYING';

    // ─── HUD Extras (katman + delik) ─────────────────────────────────────
    const statsHud = (
        <div className="flex items-center gap-2">
            <span className="bg-sky-200 dark:bg-sky-800 px-2 py-0.5 rounded-lg border-2 border-black/10 text-[10px] font-black uppercase">
                Katman: <span className="text-sm">{Math.pow(2, state.folds.length)}</span>
            </span>
            <span className="bg-rose-200 dark:bg-rose-800 px-2 py-0.5 rounded-lg border-2 border-black/10 text-[10px] font-black uppercase">
                Delik: <span className="text-sm">{finalPunches.length}</span>
            </span>
        </div>
    );

    return (
        <ArcadeGameShell
            gameState={{ score, level: state.folds.length || 1, lives: 1, status: shellStatus }}
            gameMetadata={{
                id: 'arcade-kraft-origami',
                title: 'KRAFT ORİGAMİ',
                description: (
                    <>
                        <p>✂️ Kağıdı katla, del ve açtığında simetrik desenleri keşfet!</p>
                        <p className="mt-2">🧠 Simetri keşfi ve görsel-uzamsal algı testi!</p>
                    </>
                ),
                tuzoCode: '5.5.1 Simetri Keşfi',
                icon: <Scissors className="w-14 h-14 text-black" strokeWidth={3} />,
                iconBgColor: 'bg-orange-400',
                containerBgColor: 'bg-amber-100 dark:bg-slate-900'
            }}
            onStart={startGame}
            onRestart={startGame}
            showLevel={true}
            showLives={false}
            hudExtras={statsHud}
        >
            <div className="h-full overflow-hidden overscroll-none flex flex-col bg-amber-100 dark:bg-slate-900 text-black font-black transition-colors duration-300" style={{ WebkitTapHighlightColor: 'transparent' }}>

                {/* Feedback Banner */}
                <ArcadeFeedbackBanner message={feedback?.message ?? null} type={feedback?.type} />

                <div className="flex-1 flex flex-col sm:flex-row min-h-0">

                    {/* LEFT SIDEBAR PANEL */}
                    <aside className="w-full sm:w-64 bg-white dark:bg-slate-800 border-b-8 sm:border-b-0 sm:border-r-8 border-black/10 dark:border-slate-700 p-4 sm:p-6 flex flex-row sm:flex-col gap-4 sm:gap-8 overflow-x-auto overflow-y-hidden sm:overflow-x-hidden sm:overflow-y-auto touch-pan-x sm:touch-pan-y z-10 shrink-0 snap-x transition-colors duration-300">

                        {/* DELGEÇ ŞEKLİ */}
                        <section className="bg-sky-100 dark:bg-sky-900/30 p-3 sm:p-4 rounded-3xl border-2 border-black/10 dark:border-slate-600 shadow-neo-sm rotate-1 min-w-[200px] sm:min-w-0 snap-center transition-colors duration-300">
                            <h2 className="text-[10px] sm:text-sm font-black text-black dark:text-white tracking-widest uppercase mb-3 sm:mb-4 text-center bg-white dark:bg-slate-700 py-1 rounded-xl border-2 border-black/10 dark:border-slate-600 -rotate-2 transition-colors duration-300">Delgeç Şekli</h2>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                {Object.values(PunchShape).map(shape => (
                                    <button
                                        key={shape}
                                        onClick={() => setCurrentShape(shape)}
                                        className={`aspect-square rounded-2xl flex items-center justify-center transition-all border-2 border-black/10 ${currentShape === shape
                                            ? 'bg-amber-400 text-black shadow-none translate-y-1 rotate-3'
                                            : 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm hover:bg-slate-100'
                                            }`}
                                    >
                                        <ShapeIcon shape={shape} className="w-5 h-5 sm:w-8 sm:h-8" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* KATLAMA */}
                        <section className="bg-emerald-100 dark:bg-emerald-900/30 p-3 sm:p-4 rounded-3xl border-2 border-black/10 dark:border-slate-600 shadow-neo-sm -rotate-1 min-w-[200px] sm:min-w-0 snap-center transition-colors duration-300">
                            <h2 className="text-[10px] sm:text-sm font-black text-black dark:text-white tracking-widest uppercase mb-4 sm:mb-6 text-center bg-white dark:bg-slate-700 py-1 rounded-xl border-2 border-black/10 dark:border-slate-600 rotate-2 transition-colors duration-300">Katlama</h2>
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto bg-white dark:bg-slate-700 rounded-full flex items-center justify-center border-2 border-black/10 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)] transition-colors duration-300">

                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-400 rounded-full flex items-center justify-center z-10 border-2 border-black/10 shadow-neo-sm">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full" />
                                </div>

                                <button
                                    onClick={() => handleFold(FoldDirection.UP)}
                                    disabled={state.isUnfolded || state.folds.length >= 6}
                                    className="absolute -top-3 w-8 h-8 sm:w-10 sm:h-10 bg-rose-400 text-black border-2 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-all z-20"
                                >
                                    <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                                </button>

                                <button
                                    onClick={() => handleFold(FoldDirection.LEFT)}
                                    disabled={state.isUnfolded || state.folds.length >= 6}
                                    className="absolute -left-3 w-8 h-8 sm:w-10 sm:h-10 bg-rose-400 text-black border-2 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-all z-20"
                                >
                                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                                </button>

                                <button
                                    onClick={() => handleFold(FoldDirection.RIGHT)}
                                    disabled={state.isUnfolded || state.folds.length >= 6}
                                    className="absolute -right-3 w-8 h-8 sm:w-10 sm:h-10 bg-rose-400 text-black border-2 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-all z-20"
                                >
                                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                                </button>

                                <button
                                    onClick={() => handleFold(FoldDirection.DOWN)}
                                    disabled={state.isUnfolded || state.folds.length >= 6}
                                    className="absolute -bottom-3 w-8 h-8 sm:w-10 sm:h-10 bg-rose-400 text-black border-2 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-all z-20"
                                >
                                    <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                                </button>
                            </div>
                        </section>

                        {/* RENK SEÇİMİ */}
                        <section className="bg-rose-100 dark:bg-rose-900/30 p-3 sm:p-4 rounded-3xl border-2 border-black/10 dark:border-slate-600 shadow-neo-sm rotate-2 min-w-[200px] sm:min-w-0 snap-center transition-colors duration-300">
                            <h2 className="text-[10px] sm:text-sm font-black text-black dark:text-white tracking-widest uppercase mb-3 sm:mb-4 text-center bg-white dark:bg-slate-700 py-1 rounded-xl border-2 border-black/10 dark:border-slate-600 -rotate-1 transition-colors duration-300">Kağıt Rengi</h2>
                            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                                {PAPER_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setState(s => ({ ...s, paperColor: c.value }))}
                                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-black/10 transition-all ${state.paperColor === c.value ? 'scale-125 shadow-none translate-y-1' : 'shadow-neo-sm hover:-translate-y-1'
                                            }`}
                                        style={{ backgroundColor: c.value }}
                                    />
                                ))}
                            </div>
                        </section>

                    </aside>

                    {/* MAIN WORK AREA */}
                    <main className="flex-1 p-4 sm:p-8 bg-amber-100 dark:bg-slate-900 relative overflow-hidden touch-none flex flex-col items-center justify-center shrink transition-colors duration-300">

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 mb-4 w-full max-w-3xl justify-end">
                            <button
                                onClick={handleReset}
                                className="p-2 sm:p-2.5 bg-rose-200 dark:bg-rose-700 rounded-xl border-2 border-black/10 shadow-neo-sm rotate-2 hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none transition-all"
                                title="Sıfırla"
                            >
                                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white" strokeWidth={3} />
                            </button>

                            <button
                                onClick={toggleUnfold}
                                disabled={state.punches.length === 0}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all uppercase border-2 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none -rotate-1 ${state.isUnfolded
                                    ? 'bg-amber-400 text-black'
                                    : state.punches.length === 0
                                        ? 'bg-slate-300 text-slate-500 opacity-50 cursor-not-allowed shadow-none hover:translate-y-0 active:translate-y-0'
                                        : 'bg-emerald-400 text-black'
                                    }`}
                            >
                                {state.isUnfolded ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />}
                                <span className="hidden sm:inline">{state.isUnfolded ? 'KAPAT' : 'AÇ'}</span>
                            </button>

                            <button
                                onClick={finishGame}
                                disabled={state.punches.length === 0}
                                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all uppercase border-2 border-black/10 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-sm active:translate-y-1 active:shadow-none rotate-1 bg-sky-300 text-black disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0"
                            >
                                Bitir
                            </button>
                        </div>

                        {/* Desk Container */}
                        <div className="relative w-full h-full max-w-3xl max-h-[70vh] bg-emerald-100 dark:bg-emerald-900/20 rounded-[3rem] p-6 sm:p-10 border-2 border-black/10 dark:border-slate-700 shadow-neo-sm dark:shadow-[16px_16px_0_#0f172a] flex items-center justify-center overflow-hidden rotate-1 transition-colors duration-300">

                            {/* Playful Grid Background */}
                            <div
                                className="absolute inset-0 z-0 opacity-20"
                                style={{
                                    backgroundImage: 'radial-gradient(#000 2px, transparent 2px)',
                                    backgroundSize: '30px 30px'
                                }}
                            />

                            {/* PAPER MOUNTING POINT */}
                            <div className="relative w-full max-w-[350px] aspect-square z-20 flex items-center justify-center -rotate-2">

                                {/* THE PAPER */}
                                <div
                                    className={`absolute transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden ${state.isUnfolded ? 'rounded-none shadow-[12px_12px_0_rgba(0,0,0,0.5)]' : 'rounded-sm'
                                        } ${isPunchable ? 'cursor-crosshair' : 'cursor-default'} border-2 border-black/10`}
                                    onClick={handlePunch}
                                    style={{
                                        backgroundColor: state.paperColor,
                                        width: `${(state.isUnfolded ? 1 : foldedDim.width) * 100}%`,
                                        height: `${(state.isUnfolded ? 1 : foldedDim.height) * 100}%`,
                                        left: `${(state.isUnfolded ? 0 : foldedDim.offsetX) * 100}%`,
                                        top: `${(state.isUnfolded ? 0 : foldedDim.offsetY) * 100}%`,
                                        boxShadow: state.isUnfolded
                                            ? '8px 8px 0 rgba(0,0,0,0.8)'
                                            : '4px 4px 0 rgba(0,0,0,0.8)'
                                    }}
                                >
                                    {/* Crease Effects */}
                                    {!state.isUnfolded && state.folds.length > 0 && (
                                        <div className="absolute inset-0 shadow-[inset_4px_4px_0_rgba(0,0,0,0.1)] pointer-events-none"></div>
                                    )}

                                    {/* Holes */}
                                    {finalPunches.map((punch, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute -translate-x-1/2 -translate-y-1/2"
                                            style={{
                                                left: `${(state.isUnfolded ? punch.x : ((punch.x - foldedDim.offsetX) / foldedDim.width)) * 100}%`,
                                                top: `${(state.isUnfolded ? punch.y : ((punch.y - foldedDim.offsetY) / foldedDim.height)) * 100}%`,
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        >
                                            <div className="relative group text-emerald-100">
                                                <ShapeIcon shape={punch.shape} className="w-5 h-5 sm:w-6 sm:h-6" />
                                                <div className="absolute inset-0 pointer-events-none scale-105 border-[3px] border-black/10 rounded-full opacity-50 hidden" />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Initial Instruction Hint */}
                                    {!state.isUnfolded && state.folds.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center p-6 text-center pointer-events-none">
                                            <div className="bg-white px-4 py-2 rounded-xl border-2 border-black/10 shadow-neo-sm rotate-2 text-black font-black text-xs uppercase tracking-widest leading-relaxed">
                                                KATLA + DEL
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </ArcadeGameShell>
    );
};

export default KraftOrigami;
