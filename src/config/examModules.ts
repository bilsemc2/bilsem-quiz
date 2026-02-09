// Sınav Simülasyonu Modül Listesi
import { ExamModule } from '../types/examTypes';

export const EXAM_MODULES: ExamModule[] = [
    // BELLEK
    {
        id: 'cosmic-memory',
        title: 'Kozmik Hafıza',
        link: '/games/kozmik-hafiza',
        tuzo: '5.4.2 Görsel Kısa Süreli Bellek',
        category: 'memory',
        timeLimit: 120,
        active: true
    },
    {
        id: 'n-back',
        title: 'N-Geri Şifresi',
        link: '/games/n-geri-sifresi',
        tuzo: '5.9.2 Çalışma Belleği',
        category: 'memory',
        timeLimit: 150,
        active: true
    },
    {
        id: 'cross-match',
        title: 'Çapraz Eşleşme',
        link: '/games/capraz-eslesme',
        tuzo: '5.9.1 Çalışma Belleği',
        category: 'memory',
        timeLimit: 120,
        active: true
    },
    {
        id: 'symbol-match',
        title: 'Şekil Hafızası',
        link: '/games/sekil-hafizasi',
        tuzo: '5.4.2 Görsel Kısa Süreli Bellek',
        category: 'memory',
        timeLimit: 90,
        active: true
    },
    {
        id: 'auditory-memory',
        title: 'İşitsel Hafıza',
        link: '/games/isitsel-hafiza',
        tuzo: '5.4.1 Sayısal Kısa Süreli Bellek',
        category: 'memory',
        timeLimit: 120,
        active: true
    },
    {
        id: 'sayi-sihirbazi',
        title: 'Sayı Sihirbazı',
        link: '/games/sayi-sihirbazi',
        tuzo: '5.9.1 Çalışma Belleği (Güncelleme)',
        category: 'memory',
        timeLimit: 120,
        active: true
    },
    {
        id: 'target-grid',
        title: 'Hedef Sayı',
        link: '/games/hedef-sayi',
        tuzo: '5.2.2 Matematiksel Problem Çözme',
        category: 'memory',
        timeLimit: 90,
        active: true
    },
    {
        id: 'reflection-sum',
        title: 'Yansıma Toplamı',
        link: '/games/yansima-toplami',
        tuzo: '5.9.2 Çalışma Belleği (Ters Sıralı)',
        category: 'memory',
        timeLimit: 120,
        active: true
    },
    {
        id: 'dual-bind',
        title: 'Çift Mod Hafıza',
        link: '/games/cift-mod-hafiza',
        tuzo: '5.9.1 Çalışma Belleği (Bağlama)',
        category: 'memory',
        timeLimit: 120,
        active: true
    },

    // MANTIK
    {
        id: 'number-sequence',
        title: 'Sayısal Dizi',
        link: '/games/sayisal-dizi',
        tuzo: '5.2.1 Sayısal Dizi Tamamlama',
        category: 'logic',
        timeLimit: 90,
        active: true
    },
    {
        id: 'matrix-echo',
        title: 'Matris Yankısı',
        link: '/games/matris-yankisi',
        tuzo: '5.3.2 Desen Analizi',
        category: 'logic',
        timeLimit: 120,
        active: true
    },
    {
        id: 'puzzle-master',
        title: 'Puzzle Master',
        link: '/games/puzzle-master',
        tuzo: '5.3.2 Desen Analizi',
        category: 'logic',
        timeLimit: 120,
        active: true
    },
    {
        id: 'number-cipher',
        title: 'Sayısal Şifre',
        link: '/games/sayisal-sifre',
        tuzo: '5.2.3 Soyut Sayısal Mantık',
        category: 'logic',
        timeLimit: 150,
        active: true
    },
    {
        id: 'gorsel-cebir-dengesi',
        title: 'Görsel Cebir Dengesi',
        link: '/games/gorsel-cebir-dengesi',
        tuzo: '5.5.2 Kural Çıkarsama',
        category: 'logic',
        timeLimit: 120,
        active: true
    },
    {
        id: 'patterniq-express',
        title: 'PatternIQ Express',
        link: '/games/patterniq-express',
        tuzo: '5.5.1 Örüntü Analizi',
        category: 'logic',
        timeLimit: 120,
        active: true
    },

    // DİKKAT
    {
        id: 'stroop',
        title: 'Stroop Etkisi',
        link: '/games/stroop',
        tuzo: '5.8.1 Bilişsel Esneklik',
        category: 'attention',
        timeLimit: 90,
        active: true
    },
    {
        id: 'visual-scanning',
        title: 'Görsel Tarama',
        link: '/games/gorsel-tarama',
        tuzo: '5.7.1 Seçici Dikkat',
        category: 'attention',
        timeLimit: 90,
        active: true
    },
    {
        id: 'noise-filter',
        title: 'Gürültü Filtresi',
        link: '/games/gurultu-filtresi',
        tuzo: '5.7.1 Seçici Dikkat',
        category: 'attention',
        timeLimit: 120,
        active: true
    },

    // SÖZEL
    {
        id: 'verbal-analogy',
        title: 'Sözel Analoji',
        link: '/games/sozel-analoji',
        tuzo: '5.1.2 Sözel Analoji',
        category: 'verbal',
        timeLimit: 90,
        active: true
    },
    {
        id: 'synonym',
        title: 'Eş Anlam',
        link: '/games/es-anlam',
        tuzo: '5.1.1 Kelime Bilgisi',
        category: 'verbal',
        timeLimit: 90,
        active: true
    },
    {
        id: 'sentence-synonym',
        title: 'Cümle İçi Eş Anlam',
        link: '/games/cumle-ici-es-anlam',
        tuzo: '5.1.3 Sözlü Anlama',
        category: 'verbal',
        timeLimit: 90,
        active: true
    },
    {
        id: 'knowledge-card',
        title: 'Bilgi Kartları',
        link: '/games/bilgi-kartlari',
        tuzo: '5.1.4 Bilgi (Genel Kültür)',
        category: 'verbal',
        timeLimit: 120,
        active: true
    },

    // HIZ
    {
        id: 'digit-symbol',
        title: 'Simge Kodlama',
        link: '/games/simge-kodlama',
        tuzo: '5.6.1 İşlem Hızı',
        category: 'speed',
        timeLimit: 90,
        active: true
    },
    {
        id: 'reaction-time',
        title: 'Tepki Süresi',
        link: '/games/tepki-suresi',
        tuzo: '5.6.1 İşlem Hızı',
        category: 'speed',
        timeLimit: 60,
        active: true
    },

    // ALGI
    {
        id: 'pattern-painter',
        title: 'Desen Boyama',
        link: '/games/desen-boyama',
        tuzo: '5.3.2 Desen Analizi',
        category: 'perception',
        timeLimit: 120,
        active: true
    },
    {
        id: 'shadow-detective',
        title: 'Gölge Dedektifi',
        link: '/games/golge-dedektifi',
        tuzo: '5.3.1 Şekil Eşleştirme',
        category: 'perception',
        timeLimit: 90,
        active: true
    },

    // SOSYAL
    {
        id: 'face-expression',
        title: 'Yüz İfadesi',
        link: '/games/yuz-ifadesi',
        tuzo: '5.10.1 Sosyal Zeka',
        category: 'social',
        timeLimit: 90,
        active: true
    },
];

// Aktif modülleri getir
export const getActiveModules = (): ExamModule[] => {
    return EXAM_MODULES.filter(m => m.active);
};

// Kategoriye göre modül sayısı
export const getModuleCountByCategory = () => {
    const counts: Record<string, number> = {};
    EXAM_MODULES.forEach(m => {
        if (m.active) {
            counts[m.category] = (counts[m.category] || 0) + 1;
        }
    });
    return counts;
};

// Rastgele modül seç (kategori dengeli)
export const selectRandomModules = (count: number): ExamModule[] => {
    const active = getActiveModules();

    // Fisher-Yates shuffle
    const shuffled = [...active];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(count, shuffled.length));
};
