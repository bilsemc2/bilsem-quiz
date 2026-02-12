import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useGamePersistence } from '../../../../hooks/useGamePersistence';
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
    Play,
    Trophy,
    ArrowLeft
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

type GameState = 'idle' | 'playing' | 'finished';

const KraftOrigami: React.FC = () => {
    const location = useLocation();
    const { saveGamePlay } = useGamePersistence();
    const gameStartTimeRef = useRef<number>(0);

    const [gameState, setGameState] = useState<GameState>('idle');
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

    // Auto-start from Arcade Hub
    useEffect(() => {
        if (location.state?.autoStart && gameState === 'idle') {
            startGame();
        }
    }, [location.state]);

    const startGame = () => {
        window.scrollTo(0, 0);
        setGameState('playing');
        setState({
            folds: [],
            punches: [],
            isUnfolded: false,
            paperColor: PAPER_COLORS[0].value
        });
        gameStartTimeRef.current = Date.now();
    };

    const handleFold = (direction: FoldDirection) => {
        if (state.isUnfolded) return;
        if (state.folds.length >= 6) return;
        setState(prev => ({
            ...prev,
            folds: [...prev.folds, direction],
        }));
    };

    const handlePunch = (e: React.MouseEvent<HTMLDivElement>) => {
        if (state.isUnfolded) return;
        if (state.folds.length === 0) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;

        const absX = relX * foldedDim.width;
        const absY = relY * foldedDim.height;

        setState(prev => ({
            ...prev,
            punches: [...prev.punches, { x: absX, y: absY, shape: currentShape }]
        }));
    };

    const toggleUnfold = () => {
        setState(prev => ({ ...prev, isUnfolded: !prev.isUnfolded }));
    };

    const handleReset = () => {
        setState(prev => ({ ...prev, folds: [], punches: [], isUnfolded: false }));
    };

    const finishGame = () => {
        setGameState('finished');
        const duration = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        const score = finalPunches.length * 10 + state.folds.length * 50;
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
    };

    const isPunchable = !state.isUnfolded && state.folds.length > 0;

    // Start overlay
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen bg-[#0a0f1e] text-white pt-24 pb-12 flex flex-col items-center justify-center">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center border border-white/20 mx-4">
                    <div
                        className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                        style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                    >
                        <Scissors size={48} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent tracking-tight mb-4">
                        Kraft Origami
                    </h1>
                    <p className="text-slate-400 font-medium text-lg mb-4 max-w-md mx-auto">
                        Kağıdı katla, del ve açtığında simetrik desenleri keşfet!
                    </p>
                    <div className="bg-amber-500/20 text-amber-300 text-xs px-4 py-2 rounded-full mb-6 inline-block border border-amber-500/30">
                        TUZÖ 5.5.1 Simetri Keşfi / Mental Katlama
                    </div>
                    <button
                        onClick={startGame}
                        className="w-full px-12 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-xl active:scale-95 transition-all flex items-center gap-3 justify-center mx-auto"
                        style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}
                    >
                        <Play size={24} /> BAŞLA
                    </button>
                    <Link
                        to="/bilsem-zeka"
                        className="mt-4 inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm"
                    >
                        <ArrowLeft size={16} /> BİLSEM Zeka'ya Dön
                    </Link>
                </div>
            </div>
        );
    }

    // Finished overlay
    if (gameState === 'finished') {
        const score = finalPunches.length * 10 + state.folds.length * 50;
        return (
            <div className="min-h-screen bg-[#0a0f1e] text-white pt-24 pb-12 flex flex-col items-center justify-center">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 max-w-md w-full text-center border border-white/20 mx-4">
                    <div
                        className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[40%] flex items-center justify-center mx-auto mb-6"
                        style={{ boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.2), inset 0 6px 12px rgba(255,255,255,0.4), 0 6px 16px rgba(0,0,0,0.3)' }}
                    >
                        <Trophy size={40} className="text-white" />
                    </div>
                    <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Harika Tasarım!</h2>
                    <p className="text-2xl text-white mb-2">Skor: <span className="text-orange-400 font-black">{score}</span></p>
                    <p className="text-slate-400 mb-2">Katman: {Math.pow(2, state.folds.length)} | Delik: {finalPunches.length}</p>
                    <button
                        onClick={startGame}
                        className="w-full mt-8 px-12 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-xl active:scale-95 transition-all"
                        style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}
                    >
                        TEKRAR OYNA
                    </button>
                    <Link
                        to="/bilsem-zeka"
                        className="mt-4 inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold text-sm"
                    >
                        <ArrowLeft size={16} /> BİLSEM Zeka'ya Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0f1e] text-white pt-20 overflow-hidden">

            {/* HEADER */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0f1e] z-50">
                <div className="flex items-center gap-4">
                    <Link
                        to="/bilsem-zeka"
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="p-2 bg-amber-500 rounded-xl">
                        <Scissors className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-widest text-amber-500 uppercase">
                            Kraft Origami
                        </h1>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                            Katla, del, aç ve simetrik desenleri keşfet!
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleReset}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                        title="Sıfırla"
                    >
                        <RotateCcw className="w-5 h-5 text-white/60 group-hover:text-white" />
                    </button>

                    <button
                        onClick={toggleUnfold}
                        disabled={state.punches.length === 0}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-bold text-xs transition-all uppercase ${state.isUnfolded
                            ? 'bg-slate-700 hover:bg-slate-600'
                            : state.punches.length === 0
                                ? 'bg-slate-800 text-white/20 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            }`}
                    >
                        {state.isUnfolded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {state.isUnfolded ? 'Kağıdı Kapat' : 'Kağıdı Aç'}
                    </button>

                    <button
                        onClick={finishGame}
                        disabled={state.punches.length === 0}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-md font-bold text-xs transition-all uppercase bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Bitir
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">

                {/* LEFT SIDEBAR PANEL */}
                <aside className="w-56 bg-[#0a0f1e] border-r border-white/5 p-4 flex flex-col gap-8 overflow-y-auto pt-6">

                    {/* DELGEÇ ŞEKLİ */}
                    <section>
                        <h2 className="text-[10px] font-black text-amber-500 tracking-widest uppercase mb-4 text-center">Delgeç Şekli</h2>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.values(PunchShape).map(shape => (
                                <button
                                    key={shape}
                                    onClick={() => setCurrentShape(shape)}
                                    className={`aspect-square rounded-md flex items-center justify-center transition-all ${currentShape === shape
                                        ? 'bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                        : 'bg-slate-800 text-white/40 hover:bg-slate-700'
                                        }`}
                                >
                                    <ShapeIcon shape={shape} className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* KATLAMA */}
                    <section>
                        <h2 className="text-[10px] font-black text-amber-500 tracking-widest uppercase mb-6 text-center">Katlama Kontrolü</h2>
                        <div className="relative w-32 h-32 mx-auto bg-slate-800/30 rounded-full flex items-center justify-center border border-white/5">

                            <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center z-10">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            </div>

                            <button
                                onClick={() => handleFold(FoldDirection.HORIZONTAL)}
                                disabled={state.isUnfolded || state.folds.length >= 6}
                                className="absolute top-0 w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center disabled:opacity-20 transition-colors"
                            >
                                <ChevronUp className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => handleFold(FoldDirection.VERTICAL)}
                                disabled={state.isUnfolded || state.folds.length >= 6}
                                className="absolute left-0 w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center disabled:opacity-20 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => handleFold(FoldDirection.VERTICAL)}
                                disabled={state.isUnfolded || state.folds.length >= 6}
                                className="absolute right-0 w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center disabled:opacity-20 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => handleFold(FoldDirection.HORIZONTAL)}
                                disabled={state.isUnfolded || state.folds.length >= 6}
                                className="absolute bottom-0 w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center disabled:opacity-20 hover:bg-amber-400 transition-all active:translate-y-0.5"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>
                    </section>

                    {/* RENK SEÇİMİ */}
                    <section className="border-t border-white/5 pt-6">
                        <h2 className="text-[10px] font-black text-amber-500 tracking-widest uppercase mb-4 text-center">Kağıt Rengi</h2>
                        <div className="flex justify-center gap-3">
                            {PAPER_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setState(s => ({ ...s, paperColor: c.value }))}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${state.paperColor === c.value ? 'border-amber-500 scale-125 shadow-lg' : 'border-white/20'
                                        }`}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    </section>

                </aside>

                {/* MAIN WORK AREA */}
                <main className="flex-1 p-8 bg-[#0a0f1e] relative overflow-hidden flex items-center justify-center">

                    {/* Desk Container */}
                    <div className="relative w-full h-full max-w-4xl max-h-[75vh] bg-[#1a110b] rounded-[3rem] p-10 border-[12px] border-[#2d1e16] shadow-[inset_0_20px_60px_rgba(0,0,0,0.9),0_40px_80px_-15px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden">

                        {/* Dark Wood Pattern */}
                        <div
                            className="absolute inset-0 z-0 opacity-30 mix-blend-multiply"
                            style={{
                                backgroundImage: `url('https://images.unsplash.com/photo-1541123437800-1bb1317badc2?q=80&w=2070&auto=format&fit=crop')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />

                        {/* Depth Shadows */}
                        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,1)] pointer-events-none z-10"></div>

                        {/* PAPER MOUNTING POINT */}
                        <div className="relative w-full max-w-[400px] aspect-square z-20 flex items-center justify-center">

                            {/* THE PAPER */}
                            <div
                                className={`relative aspect-square w-full transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden ${state.isUnfolded ? 'rounded-none shadow-[0_40px_100px_rgba(0,0,0,0.7)]' : 'rounded-sm'
                                    } ${isPunchable ? 'cursor-crosshair' : 'cursor-default'}`}
                                onClick={handlePunch}
                                style={{
                                    backgroundColor: state.paperColor,
                                    transform: state.isUnfolded ? 'none' : `scale(${foldedDim.width}, ${foldedDim.height})`,
                                    transformOrigin: '0 0',
                                    boxShadow: state.isUnfolded
                                        ? '0 30px 60px rgba(0,0,0,0.6)'
                                        : '0 15px 30px rgba(0,0,0,0.4)'
                                }}
                            >
                                {/* Paper Texture Overlay */}
                                <div className="absolute inset-0 opacity-[0.12] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')]"></div>

                                {/* Crease Effects */}
                                {!state.isUnfolded && state.folds.length > 0 && (
                                    <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.1)] pointer-events-none"></div>
                                )}

                                {/* Holes */}
                                {finalPunches.map((punch, idx) => (
                                    <div
                                        key={idx}
                                        className="absolute -translate-x-1/2 -translate-y-1/2"
                                        style={{
                                            left: `${(state.isUnfolded ? punch.x : (punch.x / foldedDim.width)) * 100}%`,
                                            top: `${(state.isUnfolded ? punch.y : (punch.y / foldedDim.height)) * 100}%`,
                                            transform: `translate(-50%, -50%) ${state.isUnfolded ? 'scale(1)' : `scale(${1 / foldedDim.width}, ${1 / foldedDim.height})`}`
                                        }}
                                    >
                                        <div className="relative group text-black/80">
                                            <ShapeIcon shape={punch.shape} className="w-5 h-5 sm:w-6 sm:h-6 opacity-95" />
                                            <div className="absolute inset-0 blur-[3px] opacity-40 group-hover:opacity-70 pointer-events-none -z-10 bg-black scale-90 rounded-full" />
                                        </div>
                                    </div>
                                ))}

                                {/* Initial Instruction Hint */}
                                {!state.isUnfolded && state.folds.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
                                        <div className="text-[#3d2a1e]/30 font-black text-center text-xs uppercase tracking-widest leading-relaxed">
                                            KATLAMA PANELİYLE<br />KAĞIDI KÜÇÜLT<br />VE DELMEYE BAŞLA
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* FOOTER BAR */}
            <footer className="h-10 bg-[#0a0f1e] border-t border-white/5 flex items-center justify-between px-6 text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">
                <div className="flex gap-6">
                    <span className="text-white/40">KATMAN: <span className="text-amber-500">{Math.pow(2, state.folds.length)}</span></span>
                    <span className="text-white/40">DELİK: <span className="text-amber-500">{finalPunches.length}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    SİSTEM AKTİF
                </div>
            </footer>
        </div>
    );
};

export default KraftOrigami;
