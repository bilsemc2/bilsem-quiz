import type { AdaptiveQuestion, DifficultyLevel } from '../../model/types';

interface FallbackTemplate {
    stem: (difficulty: DifficultyLevel) => string;
    options: (difficulty: DifficultyLevel) => string[];
    correctIndex: (difficulty: DifficultyLevel) => number;
    explanation: (difficulty: DifficultyLevel) => string;
}

const LOGIC_TEMPLATE: FallbackTemplate = {
    stem: (difficulty) =>
        difficulty <= 2
            ? 'Diziyi tamamla: 2, 4, 6, ?'
            : difficulty <= 4
                ? 'Diziyi tamamla: 3, 6, 12, 24, ?'
                : 'Diziyi tamamla: 5, 9, 17, 33, ?',
    options: (difficulty) => {
        if (difficulty <= 2) return ['7', '8', '9', '10'];
        if (difficulty <= 4) return ['30', '36', '48', '54'];
        return ['49', '57', '65', '71'];
    },
    correctIndex: (difficulty) => {
        if (difficulty <= 2) return 1;
        if (difficulty <= 4) return 2;
        return 1;
    },
    explanation: (difficulty) =>
        difficulty <= 2
            ? 'Dizi 2 artarak devam eder, doğru cevap 8.'
            : difficulty <= 4
                ? 'Her adımda 2 ile çarpılıyor, 24 x 2 = 48.'
                : 'Her adımda +4, +8, +16 artış var, sıradaki +32 olur.'
};

const MEMORY_TEMPLATE: FallbackTemplate = {
    stem: (difficulty) =>
        difficulty <= 2
            ? 'Aşağıdaki kelimelerden hangisi diğerlerinden farklıdır? Elma, Armut, Muz, Masa'
            : difficulty <= 4
                ? 'Hangisi kısa süreli belleği en çok zorlar?'
                : 'Aşağıdakilerden hangisi çalışma belleği stratejisidir?',
    options: (difficulty) => {
        if (difficulty <= 2) return ['Elma', 'Armut', 'Muz', 'Masa'];
        if (difficulty <= 4) return ['4 haneli sayı', '8 haneli sayı', '2 renk', '1 şekil'];
        return ['Gruplama (chunking)', 'Tekrar etmeden geçmek', 'Rastgele tahmin', 'İpucu görmezden gelmek'];
    },
    correctIndex: (difficulty) => {
        if (difficulty <= 4) return 1;
        return 0;
    },
    explanation: (difficulty) =>
        difficulty <= 2
            ? 'Masa bir meyve değildir.'
            : difficulty <= 4
                ? 'Daha uzun bilgi dizileri belleği daha çok zorlar.'
                : 'Chunking çalışma belleğini destekleyen temel yöntemdir.'
};

const VERBAL_TEMPLATE: FallbackTemplate = {
    stem: (difficulty) =>
        difficulty <= 2
            ? 'Eş anlamlıyı bul: "mutlu"'
            : difficulty <= 4
                ? 'Anlamca en yakın kelimeyi seç: "geliştirmek"'
                : 'Cümlede boşluğu en uygun kelime ile tamamla: "Planı __ şekilde uyguladı."',
    options: (difficulty) => {
        if (difficulty <= 2) return ['üzgün', 'neşeli', 'kızgın', 'yorgun'];
        if (difficulty <= 4) return ['bozmak', 'ilerletmek', 'durdurmak', 'azaltmak'];
        return ['rastgele', 'sistematik', 'gelişigüzel', 'eksik'];
    },
    correctIndex: () => 1,
    explanation: () => 'Doğru seçenek anlam bakımından en yakın eşleşmedir.'
};

const DEFAULT_TEMPLATE = LOGIC_TEMPLATE;

const getTemplateByTopic = (topic: string): FallbackTemplate => {
    const normalized = topic.toLocaleLowerCase('tr-TR');
    if (normalized.includes('hafıza') || normalized.includes('memory')) return MEMORY_TEMPLATE;
    if (normalized.includes('sözel') || normalized.includes('verbal')) return VERBAL_TEMPLATE;
    return LOGIC_TEMPLATE;
};

export const createFallbackQuestion = (input: {
    topic: string;
    difficultyLevel: DifficultyLevel;
    locale: 'tr' | 'en';
}): AdaptiveQuestion => {
    const template = getTemplateByTopic(input.topic) || DEFAULT_TEMPLATE;
    const difficulty = input.difficultyLevel;
    const sourceTopic = input.locale === 'en' ? `${input.topic} (fallback)` : input.topic;

    return {
        id: `fallback-${input.topic}-${difficulty}-${Date.now()}`,
        topic: sourceTopic,
        stem: template.stem(difficulty),
        options: template.options(difficulty),
        correctIndex: template.correctIndex(difficulty),
        explanation: template.explanation(difficulty),
        difficultyLevel: difficulty,
        source: 'fallback'
    };
};
