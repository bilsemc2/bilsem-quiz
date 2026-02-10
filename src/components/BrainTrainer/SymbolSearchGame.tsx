import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, RotateCcw, Play, Star, Timer as TimerIcon, Target as TargetIcon,
    CheckCircle2, XCircle, ChevronLeft, Zap, Heart, ScanSearch,
    // Icon pool (~160 icons)
    Anchor, Aperture, Archive, Asterisk, Award,
    Backpack, BadgeCheck, Banana, Beaker, Bell,
    Binary, Bird, Bluetooth, Bomb, Bone,
    Book, Bookmark, Box, Briefcase, Bug,
    Calculator, Calendar, Camera, Candy, Car,
    Castle, Cat, Cherry, Circle, Citrus, Cloud, Clover, Code,
    Coffee, Coins, Compass, Cookie, Crown,
    Database, Diamond, Dice1, Disc, Dna,
    DollarSign, Droplet, Drum, Ear, Egg,
    Eye, Feather, Figma, File, Film,
    Flag, Flame, Flashlight, Flower, Folder,
    Gamepad, Gem, Ghost, Gift, GitBranch,
    Glasses, Globe, Hammer, Hexagon,
    Home, Hourglass, Image, Inbox, Infinity as InfinityIcon,
    Key, Lamp, Layers, Leaf, Library,
    LifeBuoy, Lightbulb, Link, Lock, Magnet,
    Mail, Map, Medal, Megaphone, Menu,
    Mic, Microscope, Moon, Mountain,
    Mouse, Music, Navigation, Network, Nut,
    Octagon, Package, Palette, Paperclip, PartyPopper,
    Pen, Phone, PieChart, PiggyBank, Pin,
    Plane, Plug, Pocket, Power, Printer,
    Puzzle, QrCode, Quote, Radio, Rocket,
    Save, Scale, Scissors, Search, Server,
    Settings, Share, Shield, Ship, Shirt,
    Shovel, Skull, Smartphone, Snowflake, Sofa,
    Speaker, Sun, Sword, Syringe,
    Tablet, Tag, Tent, Terminal,
    Thermometer, ThumbsUp, Ticket,
    Tornado, ToyBrick, Train, Trash,
    TreeDeciduous, TreePine, Truck, Tv,
    Umbrella, User, Utensils, Video, Wallet,
    Watch, Waves, Webcam, Wifi, Wind,
    Wine, Wrench, X, ZoomIn
} from 'lucide-react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useGamePersistence } from '../../hooks/useGamePersistence';
import { useExam } from '../../contexts/ExamContext';
import type { LucideIcon } from 'lucide-react';

// ─── Constants ──────────────────────────────────────
const INITIAL_LIVES = 5;
const TIME_LIMIT = 180;
const MAX_LEVEL = 20;
const FEEDBACK_DURATION = 1200;

const CORRECT_MESSAGES = ["Harikasın! 🎉", "Süpersin! ⭐", "Muhteşem! 🌟", "Bravo! 🎯", "Tam isabet! 🎨"];
const WRONG_MESSAGES = ["Tekrar dene! 💪", "Dikkatli bak! 🧐", "Biraz daha dikkat! 🎯"];

// ─── Icon Pool ──────────────────────────────────────
interface GameIcon {
    id: string;
    component: LucideIcon;
    name: string;
}

const RAW_ICONS: { c: LucideIcon; n: string }[] = [
    { c: Anchor, n: 'Çapa' }, { c: Aperture, n: 'Diyafram' }, { c: Archive, n: 'Arşiv' },
    { c: Asterisk, n: 'Yıldız' }, { c: Award, n: 'Ödül' }, { c: Backpack, n: 'Çanta' },
    { c: BadgeCheck, n: 'Rozet' }, { c: Banana, n: 'Muz' }, { c: Beaker, n: 'Deney' },
    { c: Bell, n: 'Zil' }, { c: Binary, n: 'İkili' }, { c: Bird, n: 'Kuş' },
    { c: Bluetooth, n: 'Bluetooth' }, { c: Bomb, n: 'Bomba' }, { c: Bone, n: 'Kemik' },
    { c: Book, n: 'Kitap' }, { c: Bookmark, n: 'Yer İmi' }, { c: Box, n: 'Kutu' },
    { c: Briefcase, n: 'Evrak Çantası' }, { c: Bug, n: 'Böcek' }, { c: Calculator, n: 'Hesap' },
    { c: Calendar, n: 'Takvim' }, { c: Camera, n: 'Kamera' }, { c: Candy, n: 'Şeker' },
    { c: Car, n: 'Araba' }, { c: Castle, n: 'Kale' }, { c: Cat, n: 'Kedi' },
    { c: Cherry, n: 'Kiraz' }, { c: Circle, n: 'Daire' },
    { c: Citrus, n: 'Narenciye' }, { c: Cloud, n: 'Bulut' }, { c: Clover, n: 'Yonca' },
    { c: Code, n: 'Kod' }, { c: Coffee, n: 'Kahve' }, { c: Coins, n: 'Para' },
    { c: Compass, n: 'Pusula' }, { c: Cookie, n: 'Kurabiye' }, { c: Crown, n: 'Taç' },
    { c: Database, n: 'Veri' }, { c: Diamond, n: 'Elmas' }, { c: Dice1, n: 'Zar' },
    { c: Disc, n: 'Disk' }, { c: Dna, n: 'DNA' }, { c: DollarSign, n: 'Dolar' },
    { c: Droplet, n: 'Damla' }, { c: Drum, n: 'Davul' }, { c: Ear, n: 'Kulak' },
    { c: Egg, n: 'Yumurta' }, { c: Eye, n: 'Göz' }, { c: Feather, n: 'Tüy' },
    { c: Figma, n: 'Figma' }, { c: File, n: 'Dosya' }, { c: Film, n: 'Film' },
    { c: Flag, n: 'Bayrak' }, { c: Flame, n: 'Alev' }, { c: Flashlight, n: 'El Feneri' },
    { c: Flower, n: 'Çiçek' }, { c: Folder, n: 'Klasör' }, { c: Gamepad, n: 'Oyun' },
    { c: Gem, n: 'Mücevher' }, { c: Ghost, n: 'Hayalet' }, { c: Gift, n: 'Hediye' },
    { c: GitBranch, n: 'Dal' }, { c: Glasses, n: 'Gözlük' }, { c: Globe, n: 'Küre' },
    { c: Hammer, n: 'Çekiç' }, { c: Heart, n: 'Kalp' }, { c: Hexagon, n: 'Altıgen' },
    { c: Home, n: 'Ev' }, { c: Hourglass, n: 'Kum Saati' }, { c: Image, n: 'Resim' },
    { c: Inbox, n: 'Gelen' }, { c: InfinityIcon, n: 'Sonsuz' }, { c: Key, n: 'Anahtar' },
    { c: Lamp, n: 'Lamba' }, { c: Layers, n: 'Katman' }, { c: Leaf, n: 'Yaprak' },
    { c: Library, n: 'Kütüphane' }, { c: LifeBuoy, n: 'Can Simidi' }, { c: Lightbulb, n: 'Ampul' },
    { c: Link, n: 'Bağlantı' }, { c: Lock, n: 'Kilit' }, { c: Magnet, n: 'Mıknatıs' },
    { c: Mail, n: 'Posta' }, { c: Map, n: 'Harita' }, { c: Medal, n: 'Madalya' },
    { c: Megaphone, n: 'Megafon' }, { c: Menu, n: 'Menü' }, { c: Mic, n: 'Mikrofon' },
    { c: Microscope, n: 'Mikroskop' }, { c: Moon, n: 'Ay' }, { c: Mountain, n: 'Dağ' },
    { c: Mouse, n: 'Fare' }, { c: Music, n: 'Müzik' }, { c: Navigation, n: 'Yön' },
    { c: Network, n: 'Ağ' }, { c: Nut, n: 'Somun' }, { c: Octagon, n: 'Sekizgen' },
    { c: Package, n: 'Paket' }, { c: Palette, n: 'Palet' }, { c: Paperclip, n: 'Ataç' },
    { c: PartyPopper, n: 'Konfeti' }, { c: Pen, n: 'Kalem' }, { c: Phone, n: 'Telefon' },
    { c: PieChart, n: 'Grafik' }, { c: PiggyBank, n: 'Kumbara' }, { c: Pin, n: 'Raptiye' },
    { c: Plane, n: 'Uçak' }, { c: Plug, n: 'Fiş' }, { c: Pocket, n: 'Cep' },
    { c: Power, n: 'Güç' }, { c: Printer, n: 'Yazıcı' }, { c: Puzzle, n: 'Bulmaca' },
    { c: QrCode, n: 'QR Kod' }, { c: Quote, n: 'Alıntı' }, { c: Radio, n: 'Radyo' },
    { c: Rocket, n: 'Roket' }, { c: Save, n: 'Kaydet' }, { c: Scale, n: 'Terazi' },
    { c: Scissors, n: 'Makas' }, { c: Search, n: 'Arama' }, { c: Server, n: 'Sunucu' },
    { c: Settings, n: 'Ayarlar' }, { c: Share, n: 'Paylaş' }, { c: Shield, n: 'Kalkan' },
    { c: Ship, n: 'Gemi' }, { c: Shirt, n: 'Gömlek' }, { c: Shovel, n: 'Kürek' },
    { c: Skull, n: 'Kafatası' }, { c: Smartphone, n: 'Akıllı Telefon' }, { c: Snowflake, n: 'Kar' },
    { c: Sofa, n: 'Kanepe' }, { c: Speaker, n: 'Hoparlör' }, { c: Sun, n: 'Güneş' },
    { c: Sword, n: 'Kılıç' }, { c: Syringe, n: 'Şırınga' }, { c: Tablet, n: 'Tablet' },
    { c: Tag, n: 'Etiket' }, { c: TargetIcon, n: 'Hedef' }, { c: Tent, n: 'Çadır' },
    { c: Terminal, n: 'Terminal' }, { c: Thermometer, n: 'Termometre' }, { c: ThumbsUp, n: 'Beğen' },
    { c: Ticket, n: 'Bilet' }, { c: TimerIcon, n: 'Sayaç' },
    { c: Tornado, n: 'Kasırga' }, { c: ToyBrick, n: 'Lego' },
    { c: Train, n: 'Tren' }, { c: Trash, n: 'Çöp' }, { c: TreeDeciduous, n: 'Yapraklı Ağaç' },
    { c: TreePine, n: 'Çam' }, { c: Trophy, n: 'Kupa' }, { c: Truck, n: 'Kamyon' },
    { c: Tv, n: 'Televizyon' }, { c: Umbrella, n: 'Şemsiye' }, { c: User, n: 'Kullanıcı' },
    { c: Utensils, n: 'Çatal Bıçak' }, { c: Video, n: 'Video' }, { c: Wallet, n: 'Cüzdan' },
    { c: Watch, n: 'Saat' }, { c: Waves, n: 'Dalga' }, { c: Webcam, n: 'Web Kamera' },
    { c: Wifi, n: 'Wifi' }, { c: Wind, n: 'Rüzgar' }, { c: Wine, n: 'Şarap' },
    { c: Wrench, n: 'İngiliz Anahtarı' }, { c: X, n: 'Çarpı' }, { c: Zap, n: 'Şimşek' },
    { c: ZoomIn, n: 'Yakınlaştır' },
];

const ICONS: GameIcon[] = RAW_ICONS.filter(i => i.c).map((i, idx) => ({
    id: `icon-${idx}`,
    component: i.c,
    name: i.n,
}));

// ─── Helpers ────────────────────────────────────────
const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const pick = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

interface RoundData {
    target: GameIcon;
    group: GameIcon[];
    hasTarget: boolean;
    startTime: number;
}

const generateRound = (level: number): RoundData => {
    // Grid size scales with level
    let groupSize = 5;
    if (level > 5) groupSize = 9;
    if (level > 10) groupSize = 15;
    if (level > 15) groupSize = 20;

    const shuffled = shuffle(ICONS);
    const target = shuffled[0];
    const distractors = shuffled.slice(1, groupSize + 2);
    const hasTarget = Math.random() > 0.5;

    let group: GameIcon[];
    if (hasTarget) {
        group = [target, ...distractors.slice(0, groupSize - 1)];
    } else {
        group = distractors.slice(0, groupSize);
    }
    group = shuffle(group);

    return { target, group, hasTarget, startTime: Date.now() };
};

// ─── Types ──────────────────────────────────────────
type Phase = 'welcome' | 'playing' | 'feedback' | 'game_over' | 'victory';

interface SymbolSearchGameProps {
    examMode?: boolean;
    examLevel?: number;
    examTimeLimit?: number;
}

// ─── Component ──────────────────────────────────────
const SymbolSearchGame: React.FC<SymbolSearchGameProps> = ({ examMode = false }) => {
    const { saveGamePlay } = useGamePersistence();
    const hasSavedRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { submitResult } = useExam();

    const [phase, setPhase] = useState<Phase>('welcome');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [level, setLevel] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
    const [round, setRound] = useState<RoundData | null>(null);
    const [feedbackCorrect, setFeedbackCorrect] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [avgReaction, setAvgReaction] = useState(0);
    const [totalReactions, setTotalReactions] = useState<number[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Timer
    useEffect(() => {
        if (phase === 'playing' && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(p => p - 1), 1000);
        } else if (timeLeft === 0 && phase === 'playing') {
            handleGameOver();
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [phase, timeLeft]);

    // Generate round on level change
    useEffect(() => {
        if (phase === 'playing') {
            setRound(generateRound(level));
        }
    }, [phase, level]);

    // Start
    const handleStart = useCallback(() => {
        setPhase('playing');
        setScore(0);
        setLives(INITIAL_LIVES);
        setLevel(1);
        setTimeLeft(TIME_LIMIT);
        setRound(generateRound(1));
        setTotalReactions([]);
        setAvgReaction(0);
        startTimeRef.current = Date.now();
        hasSavedRef.current = false;
    }, []);

    // Auto-start
    useEffect(() => {
        if ((location.state?.autoStart || examMode) && phase === 'welcome') handleStart();
    }, [location.state, examMode, phase, handleStart]);

    // Game Over
    const handleGameOver = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('game_over');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avg = totalReactions.length > 0 ? Math.round(totalReactions.reduce((a, b) => a + b, 0) / totalReactions.length) : 0;
        setAvgReaction(avg);

        if (examMode) {
            const passed = level >= 5;
            submitResult(passed, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'sembol-arama',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: level, final_lives: lives, avg_reaction_ms: avg },
        });
    }, [saveGamePlay, score, level, lives, examMode, submitResult, navigate, totalReactions]);

    // Victory
    const handleVictory = useCallback(async () => {
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;
        setPhase('victory');

        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const avg = totalReactions.length > 0 ? Math.round(totalReactions.reduce((a, b) => a + b, 0) / totalReactions.length) : 0;
        setAvgReaction(avg);

        if (examMode) {
            submitResult(true, score, 1000, duration);
            setTimeout(() => navigate('/sinav-simulasyonu'), 1500);
            return;
        }

        await saveGamePlay({
            game_id: 'sembol-arama',
            score_achieved: score,
            duration_seconds: duration,
            metadata: { levels_completed: MAX_LEVEL, victory: true, avg_reaction_ms: avg },
        });
    }, [saveGamePlay, score, examMode, submitResult, navigate, totalReactions]);

    // Answer
    const handleAnswer = useCallback((userAnswer: boolean) => {
        if (!round || phase !== 'playing') return;
        const reaction = Date.now() - round.startTime;
        const correct = userAnswer === round.hasTarget;

        setFeedbackCorrect(correct);
        setFeedbackMessage(correct
            ? pick(CORRECT_MESSAGES)
            : pick(WRONG_MESSAGES)
        );
        setPhase('feedback');
        setTotalReactions(prev => [...prev, reaction]);

        const newScore = correct ? score + 10 * level : score;
        const newLives = correct ? lives : lives - 1;
        if (correct) setScore(newScore);
        else setLives(newLives);

        setTimeout(() => {
            if (!correct && newLives <= 0) { handleGameOver(); return; }
            if (correct && level >= MAX_LEVEL) { handleVictory(); return; }
            if (correct) setLevel(l => l + 1);
            else { setRound(generateRound(level)); }
            setPhase('playing');
        }, FEEDBACK_DURATION);
    }, [round, phase, score, lives, level, handleGameOver, handleVictory]);

    // Keyboard controls
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (phase !== 'playing') return;
            if (e.key === 'ArrowLeft') handleAnswer(false);
            if (e.key === 'ArrowRight') handleAnswer(true);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [phase, handleAnswer]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            {/* Decorative */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative z-10 p-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <RouterLink to="/atolyeler/bireysel-degerlendirme" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} /><span>Geri</span>
                    </RouterLink>
                    {(phase === 'playing' || phase === 'feedback') && (
                        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-end">
                            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-500/30">
                                <Star className="text-amber-400" size={18} />
                                <span className="font-bold text-amber-400 text-sm">{score}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-500/30">
                                {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                    <Heart key={i} size={14} className={i < lives ? 'text-red-400 fill-red-400' : 'text-red-400/30'} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-blue-500/30">
                                <TimerIcon className="text-blue-400" size={18} />
                                <span className={`font-bold text-sm ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>{formatTime(timeLeft)}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-500/30">
                                <Zap className="text-emerald-400" size={18} />
                                <span className="font-bold text-emerald-400 text-sm">Seviye {level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
                <AnimatePresence mode="wait">

                    {/* ── Welcome ── */}
                    {phase === 'welcome' && (
                        <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                                <span className="text-[9px] font-black text-cyan-300 uppercase tracking-wider">TUZÖ</span>
                                <span className="text-[9px] font-bold text-cyan-400">5.7.1 Seçici Dikkat</span>
                            </div>

                            <motion.div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}
                                animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                                <ScanSearch size={52} className="text-white drop-shadow-lg" />
                            </motion.div>

                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Sembol Arama</h1>
                            <p className="text-slate-400 mb-6">Hedef sembolü incele, arama grubunda olup olmadığını <span className="font-bold text-white">en hızlı</span> şekilde bul!</p>

                            <div className="grid grid-cols-3 gap-3 mb-8">
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-3 rounded-xl flex flex-col items-center gap-1 border border-white/10">
                                    <Zap className="text-amber-400" size={18} />
                                    <span className="text-xs font-bold text-slate-300">Hız</span>
                                    <span className="text-[10px] text-slate-500">Tepki süren ölçülür</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-3 rounded-xl flex flex-col items-center gap-1 border border-white/10">
                                    <Eye className="text-indigo-400" size={18} />
                                    <span className="text-xs font-bold text-slate-300">Dikkat</span>
                                    <span className="text-[10px] text-slate-500">Sembolleri ayırt et</span>
                                </div>
                                <div className="bg-slate-800/50 backdrop-blur-xl px-4 py-3 rounded-xl flex flex-col items-center gap-1 border border-white/10">
                                    <ScanSearch className="text-emerald-400" size={18} />
                                    <span className="text-xs font-bold text-slate-300">Tarama</span>
                                    <span className="text-[10px] text-slate-500">Görsel tarama hızı</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><Heart className="text-red-400" size={16} /><span className="text-sm text-slate-300">{INITIAL_LIVES} Can</span></div>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><TimerIcon className="text-blue-400" size={16} /><span className="text-sm text-slate-300">{TIME_LIMIT / 60} Dakika</span></div>
                                <div className="bg-slate-800/50 px-4 py-2 rounded-xl flex items-center gap-2"><TargetIcon className="text-emerald-400" size={16} /><span className="text-sm text-slate-300">{MAX_LEVEL} Seviye</span></div>
                            </div>

                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl font-bold text-xl"
                                style={{ boxShadow: '0 8px 32px rgba(6,182,212,0.4)' }}>
                                <div className="flex items-center gap-3"><Play size={28} className="fill-white" /><span>Başla</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Playing ── */}
                    {(phase === 'playing' || phase === 'feedback') && round && (
                        <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-5xl">
                            {/* Progress */}
                            <div className="w-full bg-white/10 h-3 rounded-full mb-6 overflow-hidden">
                                <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                                    initial={{ width: 0 }} animate={{ width: `${(level / MAX_LEVEL) * 100}%` }} transition={{ duration: 0.5 }} />
                            </div>

                            {/* Game Board */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch mb-6">
                                {/* Target Panel */}
                                <div className="md:col-span-4">
                                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-cyan-500/30 p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[200px]"
                                        style={{ boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.15), 0 8px 32px rgba(6,182,212,0.15)' }}>
                                        <div className="absolute top-3 left-0 w-full text-center">
                                            <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-cyan-500/30">
                                                HEDEF SEMBOL
                                            </span>
                                        </div>
                                        {(() => { const TargetIcon = round.target.component; return <TargetIcon className="w-24 h-24 sm:w-28 sm:h-28 text-cyan-400 drop-shadow-lg" />; })()}
                                        <p className="mt-4 text-lg font-bold text-slate-200">{round.target.name}</p>
                                    </div>
                                </div>

                                {/* Search Group Panel */}
                                <div className="md:col-span-8">
                                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8 flex items-center justify-center relative overflow-hidden min-h-[200px]"
                                        style={{ boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.2)' }}>
                                        <div className="absolute top-3 left-0 w-full text-center">
                                            <span className="bg-white/10 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                                                ARAMA GRUBU
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-4">
                                            {round.group.map((icon) => {
                                                const IconComp = icon.component;
                                                return (
                                                    <motion.div key={icon.id}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="p-3 sm:p-4 rounded-2xl border border-white/10"
                                                        style={{
                                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                                                            boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.1)',
                                                        }}>
                                                        <IconComp className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* VAR / YOK Buttons */}
                            {phase === 'playing' && (
                                <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-xl mx-auto">
                                    <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAnswer(false)}
                                        className="py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 font-bold text-xl sm:text-2xl text-white"
                                        style={{ boxShadow: '0 6px 24px rgba(239,68,68,0.35)' }}>
                                        <div className="flex flex-col items-center">
                                            <XCircle size={28} className="mb-1 opacity-80" />
                                            <span>YOK</span>
                                            <span className="text-[10px] opacity-60 mt-1 hidden sm:block">← Sol Ok</span>
                                        </div>
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAnswer(true)}
                                        className="py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-xl sm:text-2xl text-white"
                                        style={{ boxShadow: '0 6px 24px rgba(16,185,129,0.35)' }}>
                                        <div className="flex flex-col items-center">
                                            <CheckCircle2 size={28} className="mb-1 opacity-80" />
                                            <span>VAR</span>
                                            <span className="text-[10px] opacity-60 mt-1 hidden sm:block">Sağ Ok →</span>
                                        </div>
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Game Over ── */}
                    {phase === 'game_over' && (
                        <motion.div key="game_over" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 24px rgba(0,0,0,0.3)' }}>
                                <XCircle size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">Oyun Bitti!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-2xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Seviye</p><p className="text-2xl font-bold text-emerald-400">{level}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Ort. Tepki</p><p className="text-2xl font-bold text-cyan-400">{avgReaction}ms</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(6,182,212,0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Dene</span></div>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Victory ── */}
                    {phase === 'victory' && (
                        <motion.div key="victory" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center max-w-xl">
                            <motion.div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-[40%] flex items-center justify-center"
                                style={{ boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.3)' }}
                                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                <Trophy size={48} className="text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-amber-400 mb-4">🎉 Şampiyon!</h2>
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="text-center"><p className="text-slate-400 text-sm">Skor</p><p className="text-3xl font-bold text-amber-400">{score}</p></div>
                                    <div className="text-center"><p className="text-slate-400 text-sm">Ort. Tepki</p><p className="text-3xl font-bold text-cyan-400">{avgReaction}ms</p></div>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleStart}
                                className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-bold text-xl" style={{ boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }}>
                                <div className="flex items-center gap-3"><RotateCcw size={24} /><span>Tekrar Oyna</span></div>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Feedback Overlay ── */}
                <AnimatePresence>
                    {phase === 'feedback' && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                            <motion.div initial={{ y: 50 }} animate={{ y: 0 }}
                                className={`px-12 py-8 rounded-3xl text-center ${feedbackCorrect ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}
                                style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
                                <motion.div animate={{ scale: [1, 1.2, 1], rotate: feedbackCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }} transition={{ duration: 0.5 }}>
                                    {feedbackCorrect ? <CheckCircle2 size={64} className="mx-auto mb-4 text-white" /> : <XCircle size={64} className="mx-auto mb-4 text-white" />}
                                </motion.div>
                                <p className="text-3xl font-black text-white">{feedbackMessage}</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SymbolSearchGame;
