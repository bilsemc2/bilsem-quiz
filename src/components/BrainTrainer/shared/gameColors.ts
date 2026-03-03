/**
 * Standart Oyun Renk Paleti
 * Arcade cyber-* sistemiyle senkronize (tailwind.config.js)
 * 
 * Tüm BrainTrainer oyunları bu sabitleri kullanmalıdır.
 * Oyun mekaniği renkleri (Stroop renk isimleri vb.) hariç tutulur.
 */

export const GAME_COLORS = {
    // === Ana Palet (cyber-* tokens) ===
    yellow: '#dcf126',     // cyber-yellow — vurgu, highlight
    blue: '#1e40af',       // cyber-blue — bilgi, soru kartları
    pink: '#f43f5e',       // cyber-pink — hata, yanlış
    emerald: '#14F195',    // cyber-emerald — doğru, başarı
    purple: '#B026FF',     // cyber-purple — özel, premium
    orange: '#FF9500',     // cyber-orange — uyarı, dikkat
    obsidian: '#0B0C10',   // cyber-obsidian — koyu yüzey
    paper: '#FAF9F6',      // cyber-paper — açık yüzey

    // === Semantik Renkler ===
    correct: '#14F195',    // emerald — doğru cevap
    incorrect: '#f43f5e',  // pink — yanlış cevap
    highlight: '#dcf126',  // yellow — seçili öğe
    info: '#1e40af',       // blue — bilgi
    warning: '#FF9500',    // orange — uyarı
    special: '#B026FF',    // purple — özel durum

    // === Nötr Renkler ===
    white: '#ffffff',
    black: '#000000',
    dark: '#0f172a',       // slate-900
    muted: '#94a3b8',      // slate-400
    dimmed: '#64748b',     // slate-500

    // === Canvas/SVG Şekil Renkleri ===
    // Oyunlarda şekiller, kartlar, toplar vb. için kullanılacak palette
    shapes: [
        '#f43f5e',   // pink
        '#1e40af',   // blue
        '#14F195',   // emerald
        '#dcf126',   // yellow
        '#B026FF',   // purple
        '#FF9500',   // orange
        '#06b6d4',   // cyan
        '#ec4899',   // magenta
    ] as const,

    // === Glow/Shadow Renkleri ===
    glow: {
        pink: 'rgba(244, 63, 94, 0.5)',
        emerald: 'rgba(20, 241, 149, 0.5)',
        purple: 'rgba(176, 38, 255, 0.5)',
        yellow: 'rgba(220, 241, 38, 0.5)',
        blue: 'rgba(30, 64, 175, 0.5)',
        orange: 'rgba(255, 149, 0, 0.5)',
    },
} as const;

export type GameColor = keyof typeof GAME_COLORS;
