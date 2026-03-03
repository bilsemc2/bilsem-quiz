/**
 * Design Token Sistemi — Faz 1
 * 
 * Tüm tasarım değerlerinin tek kaynağı (Single Source of Truth).
 * Tailwind config (cyber-*) ile senkronize.
 * 
 * Kullanım:
 *   import { colors, typography, shadows } from '@/styles/designTokens';
 */

// ═══════════════════════════════════════════════
// 🎨 RENKLER
// ═══════════════════════════════════════════════

export const colors = {
    // --- Ana Palet (cyber-* tokens — tailwind.config.js ile eşleşir) ---
    cyber: {
        yellow: '#dcf126',  // Acid yellow — vurgu, highlight
        blue: '#1e40af',  // Electric blue — bilgi, soru kartları
        pink: '#f43f5e',  // Hot pink — hata, yanlış
        emerald: '#14F195',  // Neon green — doğru, başarı
        purple: '#B026FF',  // Neon purple — premium, özel
        orange: '#FF9500',  // Bright orange — uyarı
        obsidian: '#0B0C10',  // Koyu yüzey
        paper: '#FAF9F6',  // Açık yüzey
        cyan: '#06b6d4',  // Teal — bilgi ikincil
        gold: '#FFD700',  // Altın — XP, ödül
        red: '#FF2745',  // Kırmızı — profil hero, dikkat
    },

    // --- Semantik Renkler ---
    semantic: {
        success: '#14F195',
        error: '#f43f5e',
        warning: '#FF9500',
        info: '#1e40af',
        xp: '#FFD700',
        premium: '#B026FF',
    },

    // --- Nötr Tonlar ---
    neutral: {
        white: '#ffffff',
        black: '#000000',
        bg: '#FAF9F6',
        surface: '#ffffff',
        border: '#0B0C10',
        muted: '#94a3b8',
        dimmed: '#64748b',
        dark: '#0f172a',
    },

    // --- Dark Mode ---
    dark: {
        bg: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        text: '#f8fafc',
        muted: '#94a3b8',
    },
} as const;

// ═══════════════════════════════════════════════
// 🔤 TİPOGRAFİ
// ═══════════════════════════════════════════════

export const typography = {
    // --- Font Aileleri ---
    fonts: {
        display: '"Syne", sans-serif',      // Başlıklar — bold, dikkat çekici
        body: '"Nunito", sans-serif',     // Gövde metin — yumuşak, okunabilir, çocuk dostu
        mono: '"JetBrains Mono", monospace', // Kod/sayaç
    },

    // --- Font Ağırlıkları ---
    weights: {
        normal: 400,
        medium: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
    },

    // --- Boyut Skalası (rem) ---
    sizes: {
        xs: '0.75rem',   // 12px
        sm: '0.875rem',  // 14px
        base: '1rem',      // 16px
        md: '1.125rem',  // 18px
        lg: '1.25rem',   // 20px
        xl: '1.5rem',    // 24px
        '2xl': '1.875rem',  // 30px
        '3xl': '2.25rem',   // 36px
        '4xl': '3rem',      // 48px
        '5xl': '3.75rem',   // 60px
    },

    // --- Satır Yükseklikleri ---
    lineHeights: {
        tight: 1.1,
        snug: 1.25,
        normal: 1.5,
        relaxed: 1.75,
    },

    // --- Harf Aralığı ---
    tracking: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.05em',
        wider: '0.1em',
        widest: '0.2em',
    },
} as const;

// ═══════════════════════════════════════════════
// 📐 SPACING (4px tabanlı)
// ═══════════════════════════════════════════════

export const spacing = {
    px: '1px',
    0: '0',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
} as const;

// ═══════════════════════════════════════════════
// 🔲 KÖŞE YARIÇAPI
// ═══════════════════════════════════════════════

export const radius = {
    none: '0',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
} as const;

// ═══════════════════════════════════════════════
// 🌑 GÖLGELER (Neobrutalist)
// ═══════════════════════════════════════════════

export const shadows = {
    // --- Neobrutalist Offset Gölgeler ---
    neo: {
        sm: '2px 2px 0 #000',
        md: '4px 4px 0 #000',
        lg: '8px 8px 0 #000',
        xl: '12px 12px 0 #000',
    },

    // --- Hover/ Active Durumları ---
    neoHover: {
        sm: '1px 1px 0 #000',
        md: '2px 2px 0 #000',
        lg: '4px 4px 0 #000',
    },

    // --- İç Gölge ---
    inner: 'inset 0 2px 4px rgba(0,0,0,0.1)',
    innerLight: 'inset 0 2px 4px rgba(255,255,255,0.3)',

    // --- Glow Efektleri ---
    glow: {
        emerald: '0 0 20px rgba(20, 241, 149, 0.4)',
        purple: '0 0 20px rgba(176, 38, 255, 0.4)',
        gold: '0 0 20px rgba(255, 215, 0, 0.4)',
        pink: '0 0 20px rgba(244, 63, 94, 0.4)',
    },
} as const;

// ═══════════════════════════════════════════════
// 🎭 ANİMASYON
// ═══════════════════════════════════════════════

export const animation = {
    // --- Süre ---
    duration: {
        instant: '100ms',
        fast: '200ms',
        normal: '300ms',
        slow: '500ms',
        slower: '800ms',
    },

    // --- Easing ---
    easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },

    // --- Spring Config (Framer Motion) ---
    spring: {
        gentle: { type: 'spring', stiffness: 120, damping: 14 } as const,
        bouncy: { type: 'spring', stiffness: 260, damping: 20 } as const,
        stiff: { type: 'spring', stiffness: 400, damping: 30 } as const,
        wobbly: { type: 'spring', stiffness: 180, damping: 12 } as const,
    },
} as const;

// ═══════════════════════════════════════════════
// 📏 BILEŞEN SABİTLERİ
// ═══════════════════════════════════════════════

export const components = {
    // --- Buton Boyutları ---
    button: {
        sm: { height: '36px', padding: '8px 16px', fontSize: typography.sizes.sm },
        md: { height: '44px', padding: '10px 20px', fontSize: typography.sizes.base },
        lg: { height: '52px', padding: '12px 28px', fontSize: typography.sizes.lg },
        xl: { height: '60px', padding: '16px 36px', fontSize: typography.sizes.xl },
    },

    // --- Kart ---
    card: {
        borderWidth: '4px',
        borderRadius: radius.xl,
        padding: spacing[6],
    },

    // --- Badge ---
    badge: {
        borderWidth: '2px',
        borderRadius: radius.md,
        padding: '4px 12px',
        fontSize: typography.sizes.xs,
    },

    // --- Minimum Dokunma Alanı (WCAG) ---
    touchTarget: '48px',
} as const;

// ═══════════════════════════════════════════════
// 🎯 Z-INDEX SİSTEMİ
// ═══════════════════════════════════════════════

export const zIndex = {
    base: 0,
    above: 10,
    dropdown: 20,
    sticky: 30,
    overlay: 40,
    modal: 50,
    toast: 60,
    tooltip: 70,
} as const;
