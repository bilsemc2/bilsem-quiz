/**
 * Zeka Türleri ve Oyun Eşleştirmeleri
 * Tablet Değerlendirme (1. Aşama) ve Bireysel Değerlendirme (2. Aşama) oyunları için
 */

export const ZEKA_TURLERI = {
    GORSEL_UZAMSAL: 'Görsel-Uzamsal Zeka',
    CALISMA_BELLEGI: 'Çalışma Belleği',
    AKICI_ZEKA: 'Akıcı Zeka',
    SOZEL_ZEKA: 'Sözel Zeka',
    SAYISAL_ZEKA: 'Sayısal Zeka',
    MANTIKSAL_ZEKA: 'Mantıksal Zeka',
    SECICI_DIKKAT: 'Seçici Dikkat',
    BILISSEL_ESNEKLIK: 'Bilişsel Esneklik',
    MOTOR_KOORDINASYON: 'Motor Koordinasyon',
    GORSEL_ALGI: 'Görsel Algı',
    GORSEL_HAFIZA: 'Görsel Hafıza',
    UZAMSAL_DIKKAT: 'Uzamsal Dikkat',
    ISLEME_HIZI: 'İşleme Hızı',
} as const;

export type ZekaTuru = typeof ZEKA_TURLERI[keyof typeof ZEKA_TURLERI];

export type WorkshopType = 'tablet' | 'bireysel' | 'arcade';

// Oyun ID'si -> Zeka Türü eşleştirmesi
export const OYUN_ZEKA_ESLESTIRMESI: Record<string, ZekaTuru> = {
    // Tablet Değerlendirme (1. Aşama)
    'parca-butun': ZEKA_TURLERI.GORSEL_UZAMSAL,
    'rotasyon-matrisi': ZEKA_TURLERI.GORSEL_UZAMSAL,
    'sihirli-kupler': ZEKA_TURLERI.GORSEL_UZAMSAL,

    // Bireysel Değerlendirme (2. Aşama)
    'kozmik-hafiza': ZEKA_TURLERI.CALISMA_BELLEGI,
    'n-geri-sifresi': ZEKA_TURLERI.CALISMA_BELLEGI,
    'golge-dedektifi': ZEKA_TURLERI.GORSEL_ALGI,
    'capraz-eslesme': ZEKA_TURLERI.CALISMA_BELLEGI,
    'hedef-sayi': ZEKA_TURLERI.CALISMA_BELLEGI,
    'akiskan-toplam': ZEKA_TURLERI.AKICI_ZEKA,
    'gorunmez-kule': ZEKA_TURLERI.SAYISAL_ZEKA,
    'matris-yankisi': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'yansima-toplami': ZEKA_TURLERI.CALISMA_BELLEGI,
    'deyimler': ZEKA_TURLERI.SOZEL_ZEKA,
    'labirent': ZEKA_TURLERI.MOTOR_KOORDINASYON,
    'stroop-renk': ZEKA_TURLERI.BILISSEL_ESNEKLIK,
    'stroop-yon': ZEKA_TURLERI.UZAMSAL_DIKKAT,
    'stroop-emoji': ZEKA_TURLERI.BILISSEL_ESNEKLIK,
    'stroop-kalem': ZEKA_TURLERI.SECICI_DIKKAT,
    'sekil-hafizasi': ZEKA_TURLERI.GORSEL_HAFIZA,
    'cift-mod-hafiza': ZEKA_TURLERI.CALISMA_BELLEGI,
    'sayisal-dizi': ZEKA_TURLERI.SAYISAL_ZEKA,
    'sozel-analoji': ZEKA_TURLERI.SOZEL_ZEKA,
    'es-anlam': ZEKA_TURLERI.SOZEL_ZEKA,
    'cumle-ici-es-anlam': ZEKA_TURLERI.SOZEL_ZEKA,
    'simge-kodlama': ZEKA_TURLERI.SECICI_DIKKAT,
    'gorsel-tarama': ZEKA_TURLERI.SECICI_DIKKAT,
    'isitsel-hafiza': ZEKA_TURLERI.CALISMA_BELLEGI,
    'sayisal-hafiza': ZEKA_TURLERI.CALISMA_BELLEGI,
    'tepki-suresi': ZEKA_TURLERI.ISLEME_HIZI,
    'yuz-ifadesi': ZEKA_TURLERI.GORSEL_ALGI,
    'puzzle-master': ZEKA_TURLERI.GORSEL_ALGI,
    'bilgi-kartlari-bosluk-doldur': ZEKA_TURLERI.SOZEL_ZEKA,
    'hikaye-quiz': ZEKA_TURLERI.SOZEL_ZEKA,
    'sayisal-sifre': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'gurultu-filtresi': ZEKA_TURLERI.SECICI_DIKKAT,
    'sayi-sihirbazi': ZEKA_TURLERI.CALISMA_BELLEGI,
    'matris-bulmaca': ZEKA_TURLERI.MANTIKSAL_ZEKA,

    // Arcade Oyunları
    'arcade-dark-maze': ZEKA_TURLERI.GORSEL_UZAMSAL,
    'neseli-balonlar': ZEKA_TURLERI.GORSEL_HAFIZA,
    'arcade-labirent-ustasi': ZEKA_TURLERI.GORSEL_UZAMSAL,
    'renkli-balon': ZEKA_TURLERI.SECICI_DIKKAT,
    'kart-dedektifi': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'oruntulu-top': ZEKA_TURLERI.AKICI_ZEKA,
    'arcade-kraft-origami': ZEKA_TURLERI.GORSEL_UZAMSAL,
    'arcade-ayna-ustasi': ZEKA_TURLERI.GORSEL_UZAMSAL,
    'ters-navigator': ZEKA_TURLERI.BILISSEL_ESNEKLIK,
    'chromabreak': ZEKA_TURLERI.GORSEL_HAFIZA,
    'yol-bulmaca': ZEKA_TURLERI.CALISMA_BELLEGI,
    'renkli-lambalar': ZEKA_TURLERI.GORSEL_HAFIZA,
    'arcade-chroma-hafiza': ZEKA_TURLERI.GORSEL_HAFIZA,
    'arcade-sevimli-mantik': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'desen-boyama': ZEKA_TURLERI.GORSEL_UZAMSAL,
    'gorsel-cebir-dengesi': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'patterniq-express': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'konum-bulmaca': ZEKA_TURLERI.GORSEL_UZAMSAL,
    'mindmatch-oruntu': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'mantik-bulmacasi': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'son-harf-ustasi': ZEKA_TURLERI.SOZEL_ZEKA,
    'kosullu-yonerge': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'yaratik-mantigi': ZEKA_TURLERI.MANTIKSAL_ZEKA,
    'sembol-arama': ZEKA_TURLERI.SECICI_DIKKAT,
    'dikkat-ve-kodlama': ZEKA_TURLERI.ISLEME_HIZI,
};

// Oyun ID'si -> Workshop Türü eşleştirmesi
export const OYUN_WORKSHOP_ESLESTIRMESI: Record<string, WorkshopType> = {
    // Tablet Değerlendirme (1. Aşama)
    'parca-butun': 'tablet',
    'rotasyon-matrisi': 'tablet',
    'sihirli-kupler': 'tablet',

    // Bireysel Değerlendirme (2. Aşama)
    'kozmik-hafiza': 'bireysel',
    'n-geri-sifresi': 'bireysel',
    'golge-dedektifi': 'bireysel',
    'capraz-eslesme': 'bireysel',
    'hedef-sayi': 'bireysel',
    'akiskan-toplam': 'bireysel',
    'gorunmez-kule': 'bireysel',
    'matris-yankisi': 'bireysel',
    'yansima-toplami': 'bireysel',
    'deyimler': 'bireysel',
    'labirent': 'bireysel',
    'stroop-renk': 'bireysel',
    'stroop-yon': 'bireysel',
    'stroop-emoji': 'bireysel',
    'stroop-kalem': 'bireysel',
    'sekil-hafizasi': 'bireysel',
    'cift-mod-hafiza': 'bireysel',
    'sayisal-dizi': 'bireysel',
    'sozel-analoji': 'bireysel',
    'es-anlam': 'bireysel',
    'cumle-ici-es-anlam': 'bireysel',
    'simge-kodlama': 'bireysel',
    'gorsel-tarama': 'bireysel',
    'isitsel-hafiza': 'bireysel',
    'sayisal-hafiza': 'bireysel',
    'tepki-suresi': 'bireysel',
    'yuz-ifadesi': 'bireysel',
    'puzzle-master': 'bireysel',
    'bilgi-kartlari-bosluk-doldur': 'bireysel',
    'hikaye-quiz': 'bireysel',
    'sayisal-sifre': 'bireysel',
    'gurultu-filtresi': 'bireysel',
    'desen-boyama': 'bireysel',
    'sayi-sihirbazi': 'bireysel',
    'matris-bulmaca': 'bireysel',
    'gorsel-cebir-dengesi': 'bireysel',
    'patterniq-express': 'bireysel',
    'konum-bulmaca': 'bireysel',
    'mindmatch-oruntu': 'bireysel',
    'mantik-bulmacasi': 'bireysel',
    'son-harf-ustasi': 'bireysel',
    'kosullu-yonerge': 'bireysel',
    'yaratik-mantigi': 'bireysel',
    'sembol-arama': 'bireysel',
    'dikkat-ve-kodlama': 'bireysel',

    // Arcade Oyunları
    'arcade-dark-maze': 'arcade',
    'neseli-balonlar': 'arcade',
    'arcade-labirent-ustasi': 'arcade',
    'renkli-balon': 'arcade',
    'kart-dedektifi': 'arcade',
    'oruntulu-top': 'arcade',
    'arcade-kraft-origami': 'arcade',
    'arcade-ayna-ustasi': 'arcade',
    'ters-navigator': 'arcade',
    'chromabreak': 'arcade',
    'yol-bulmaca': 'arcade',
    'renkli-lambalar': 'arcade',
    'arcade-chroma-hafiza': 'arcade',
    'arcade-sevimli-mantik': 'arcade',
};

// Workshop türü etiketleri
export const WORKSHOP_LABELS: Record<WorkshopType, string> = {
    tablet: 'Tablet Değerlendirme (1. Aşama)',
    bireysel: 'Bireysel Değerlendirme (2. Aşama)',
    arcade: 'BİLSEM Zeka',
};

// Zeka türü renkleri (UI için)
export const ZEKA_RENKLERI: Record<ZekaTuru, string> = {
    [ZEKA_TURLERI.GORSEL_UZAMSAL]: '#8B5CF6', // violet
    [ZEKA_TURLERI.CALISMA_BELLEGI]: '#3B82F6', // blue
    [ZEKA_TURLERI.AKICI_ZEKA]: '#10B981', // emerald
    [ZEKA_TURLERI.SOZEL_ZEKA]: '#EC4899', // pink
    [ZEKA_TURLERI.SAYISAL_ZEKA]: '#F59E0B', // amber
    [ZEKA_TURLERI.MANTIKSAL_ZEKA]: '#6366F1', // indigo
    [ZEKA_TURLERI.SECICI_DIKKAT]: '#EF4444', // red
    [ZEKA_TURLERI.BILISSEL_ESNEKLIK]: '#14B8A6', // teal
    [ZEKA_TURLERI.MOTOR_KOORDINASYON]: '#84CC16', // lime
    [ZEKA_TURLERI.GORSEL_ALGI]: '#A855F7', // purple
    [ZEKA_TURLERI.GORSEL_HAFIZA]: '#0EA5E9', // sky
    [ZEKA_TURLERI.UZAMSAL_DIKKAT]: '#22D3D1', // cyan
    [ZEKA_TURLERI.ISLEME_HIZI]: '#F97316', // orange
};

// Yardımcı fonksiyonlar
export const getZekaTuru = (gameId: string): ZekaTuru | null => {
    return OYUN_ZEKA_ESLESTIRMESI[gameId] || null;
};

export const getWorkshopType = (gameId: string): WorkshopType | null => {
    return OYUN_WORKSHOP_ESLESTIRMESI[gameId] || null;
};
