// ─── Sabit Renk Paleti (Tek Kaynak) ─────────────────────────────────────────
// Çocuk dostu, göz yormayan "Candy-pastel" tonu.
// Orta doygunluk, açık renk — hem beyaz hem koyu temada okunabilir.
export const ARCADE_PALETTE = Object.freeze({
    red: { hex: '#FF6B6B', name: 'Kırmızı' },   // Mercan - yumuşak
    blue: { hex: '#74B9FF', name: 'Mavi' },       // Gökyüzü - sakin
    green: { hex: '#55EFC4', name: 'Yeşil' },      // Nane - ferah
    yellow: { hex: '#FFEAA7', name: 'Sarı' },       // Limon - tatlı
    purple: { hex: '#A29BFE', name: 'Mor' },        // Lavanta - yumuşak
    pink: { hex: '#FD79A8', name: 'Pembe' },      // Şeker - oyuncu
    orange: { hex: '#FDCB6E', name: 'Turuncu' },    // Mandalin - enerji
    teal: { hex: '#00CEC9', name: 'Turkuaz' },    // Deniz - berrak
} as const);

export type ArcadeColorId = keyof typeof ARCADE_PALETTE;

// Geriye dönük uyumluluk için türetilmiş diziler
export const ARCADE_COLORS: string[] =
    Object.values(ARCADE_PALETTE).map(c => c.hex);

export const ARCADE_COLOR_NAMES: Record<string, string> =
    Object.fromEntries(Object.values(ARCADE_PALETTE).map(c => [c.hex, c.name]));

export const ARCADE_FEEDBACK_TEXTS = {
    SUCCESS_MESSAGES: [
        "Harika!",
        "Mükemmel!",
        "Süper Gidiyorsun!",
        "Çok İyi!",
        "İşte Bu!"
    ],
    ERROR_MESSAGES: [
        "Dikkatlice Bakalım",
        "Bir Daha Deneyelim",
        "Biraz Daha Dikkat",
        "Olmadı, Tekrar Yakala!"
    ]
};

// ─── Zorluk Eşikleri (Standart) ──────────────────────────────────────────────
// Oyunlar bu eşikleri kullanarak EASY/MEDIUM/HARD geçişini standart tutar.
export const ARCADE_DIFFICULTY_THRESHOLDS = Object.freeze({
    MEDIUM_LEVEL: 5,   // Bu seviyeden sonra MEDIUM başlar
    HARD_LEVEL: 10,    // Bu seviyeden sonra HARD başlar
} as const);

// ─── Skor Formülü (Standart) ──────────────────────────────────────────────────
// Tüm oyunlar doğru cevapta aynı skor formülünü kullanır.
// base: oyuna özgü puan (varsayılan 20), level: mevcut seviye
export const ARCADE_SCORE_FORMULA = (base: number, level: number): number =>
    base * level;

export const ARCADE_SCORE_BASE = 20; // Varsayılan puan birimi

// ─── Spawn & Hız Parametreleri (Standart) ────────────────────────────────────
// Oyunlardaki nesne spawn hızı ve zorluk dengesi için ortak sabitleri tanımlar.
export const ARCADE_SPAWN_CONFIG = Object.freeze({
    INTERVAL_BASE_MS: 1800,       // Başlangıç spawn aralığı (ms)
    INTERVAL_MIN_MS: 700,         // Minimum spawn aralığı (ms)
    INTERVAL_DECAY_PER_LEVEL: 80, // Her seviyede araliğin azalma miktarı
    SPEED_BASE: 5,                // Başlangıç hareket hızı (saniye)
    SPEED_VARIANCE: 2,            // Rastgele hız varyasyonu
    SPEED_DECAY_PER_LEVEL: 0.15,  // Her seviyede hız artış oranı
    SPEED_MIN: 1.5,               // Minimum hız (saniye) - asla daha hızlı olmaz
} as const);
