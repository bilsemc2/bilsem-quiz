// Supabase Edge Function for Gemini API Proxy
// This keeps the API key secure on the server side

const ALLOWED_ORIGINS = [
    'https://bilsemc2.com',
    'https://www.bilsemc2.com',
    'https://beyninikullan.com',
    'https://www.beyninikullan.com',
    'http://localhost:5173',
    'http://localhost:3000',
];

const getCorsHeaders = (req: Request) => {
    const origin = req.headers.get('origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
    };
};

type AdaptiveQuestionLocale = 'tr' | 'en';

interface AdaptiveQuestionPromptTemplatePayload {
    version?: string;
    systemPrompt?: string;
    userPrompt?: string;
}

interface AdaptiveQuestionProviderInput {
    topic: string;
    locale: AdaptiveQuestionLocale;
    difficultyLevel: number;
    abilitySnapshot: {
        overallScore: number;
        dimensions: {
            memory: number;
            logic: number;
            attention: number;
            verbal: number;
            spatial: number;
            processing_speed: number;
        };
    };
    sessionPerformance: {
        recentAccuracy: number;
        averageResponseMs: number;
        targetResponseMs: number;
        streakCorrect: number;
        consecutiveWrong: number;
    };
    previousQuestionIds: string[];
}

interface AdaptiveQuestionResult {
    id: string;
    topic: string;
    stem: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficultyLevel: number;
    source: 'ai';
}

const clampDifficulty = (value: number): number => {
    if (!Number.isFinite(value)) return 3;
    const rounded = Math.round(value);
    if (rounded <= 1) return 1;
    if (rounded >= 5) return 5;
    return rounded;
};

const asNumber = (value: unknown, fallback: number): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const asNonEmptyString = (value: unknown, fallback = ''): string => {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
};

const normalizeAdaptiveInput = (value: unknown): AdaptiveQuestionProviderInput => {
    if (!value || typeof value !== 'object') {
        throw new Error('generateAdaptiveQuestion requires a valid input object');
    }

    const candidate = value as Partial<AdaptiveQuestionProviderInput> & {
        abilitySnapshot?: { overallScore?: unknown; dimensions?: Record<string, unknown> };
        sessionPerformance?: Record<string, unknown>;
    };

    const dimensions = candidate.abilitySnapshot?.dimensions ?? {};
    const sessionPerformance = candidate.sessionPerformance ?? {};

    return {
        topic: asNonEmptyString(candidate.topic, 'mantık'),
        locale: candidate.locale === 'en' ? 'en' : 'tr',
        difficultyLevel: clampDifficulty(asNumber(candidate.difficultyLevel, 3)),
        abilitySnapshot: {
            overallScore: asNumber(candidate.abilitySnapshot?.overallScore, 50),
            dimensions: {
                memory: asNumber(dimensions.memory, 50),
                logic: asNumber(dimensions.logic, 50),
                attention: asNumber(dimensions.attention, 50),
                verbal: asNumber(dimensions.verbal, 50),
                spatial: asNumber(dimensions.spatial, 50),
                processing_speed: asNumber(dimensions.processing_speed, 50)
            }
        },
        sessionPerformance: {
            recentAccuracy: asNumber(sessionPerformance.recentAccuracy, 0.65),
            averageResponseMs: asNumber(sessionPerformance.averageResponseMs, 4500),
            targetResponseMs: asNumber(sessionPerformance.targetResponseMs, 4500),
            streakCorrect: asNumber(sessionPerformance.streakCorrect, 0),
            consecutiveWrong: asNumber(sessionPerformance.consecutiveWrong, 0)
        },
        previousQuestionIds: Array.isArray(candidate.previousQuestionIds)
            ? candidate.previousQuestionIds
                .filter((id): id is string => typeof id === 'string')
                .map((id) => id.trim())
                .filter((id) => id.length > 0)
            : []
    };
};

const buildAdaptivePromptFromInput = (input: AdaptiveQuestionProviderInput): {
    systemPrompt: string;
    userPrompt: string;
} => {
    const localeInstruction = input.locale === 'tr'
        ? 'Cevabı Türkçe ver. Türkçe karakterleri doğru kullan.'
        : 'Respond in English with clear, child-friendly language.';

    const excludedIds = input.previousQuestionIds.join(', ') || '(none)';
    const systemPrompt = [
        'You are an educational assessment assistant for children (ages 7-12).',
        'Generate exactly one multiple-choice question.',
        'Return only JSON object, no markdown.',
        'The question must be safe, age-appropriate, and non-violent.',
        'Options must be distinct and exactly 4 items.',
        localeInstruction
    ].join(' ');

    const userPrompt = `
Create one adaptive question using the profile below:
- Topic: ${input.topic}
- Target difficulty level: ${input.difficultyLevel} (1 easiest - 5 hardest)
- Ability overall score: ${input.abilitySnapshot.overallScore}
- Ability dimensions:
  - memory: ${input.abilitySnapshot.dimensions.memory}
  - logic: ${input.abilitySnapshot.dimensions.logic}
  - attention: ${input.abilitySnapshot.dimensions.attention}
  - verbal: ${input.abilitySnapshot.dimensions.verbal}
  - spatial: ${input.abilitySnapshot.dimensions.spatial}
  - processing_speed: ${input.abilitySnapshot.dimensions.processing_speed}
- Session performance:
  - recentAccuracy: ${input.sessionPerformance.recentAccuracy}
  - averageResponseMs: ${input.sessionPerformance.averageResponseMs}
  - targetResponseMs: ${input.sessionPerformance.targetResponseMs}
  - streakCorrect: ${input.sessionPerformance.streakCorrect}
  - consecutiveWrong: ${input.sessionPerformance.consecutiveWrong}
- Do not repeat these question ids: ${excludedIds}

Required output JSON shape:
{
  "id": "string",
  "topic": "string",
  "stem": "string",
  "options": ["string", "string", "string", "string"],
  "correctIndex": 0,
  "explanation": "string",
  "difficultyLevel": ${input.difficultyLevel},
  "source": "ai"
}
`.trim();

    return { systemPrompt, userPrompt };
};

const resolveAdaptivePrompts = (
    input: AdaptiveQuestionProviderInput,
    template?: AdaptiveQuestionPromptTemplatePayload
): { systemPrompt: string; userPrompt: string } => {
    const systemPrompt = asNonEmptyString(template?.systemPrompt);
    const userPrompt = asNonEmptyString(template?.userPrompt);
    if (systemPrompt && userPrompt) {
        return { systemPrompt, userPrompt };
    }

    return buildAdaptivePromptFromInput(input);
};

const normalizeAdaptiveQuestionResult = (
    value: unknown,
    input: AdaptiveQuestionProviderInput
): AdaptiveQuestionResult => {
    if (!value || typeof value !== 'object') {
        throw new Error('Adaptive question response must be an object');
    }

    const parsed = value as Partial<AdaptiveQuestionResult> & { options?: unknown };
    const stem = asNonEmptyString(parsed.stem);
    const explanation = asNonEmptyString(parsed.explanation);
    const options = Array.isArray(parsed.options)
        ? parsed.options
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
        : [];
    const correctIndex = Number(parsed.correctIndex);

    if (stem.length < 5) {
        throw new Error('Adaptive question stem is invalid');
    }
    if (explanation.length < 5) {
        throw new Error('Adaptive question explanation is invalid');
    }
    if (options.length !== 4 || options.some((option) => option.length === 0)) {
        throw new Error('Adaptive question options are invalid');
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        throw new Error('Adaptive question correctIndex is invalid');
    }

    return {
        id: asNonEmptyString(parsed.id, `aq-${crypto.randomUUID()}`),
        topic: asNonEmptyString(parsed.topic, input.topic),
        stem,
        options,
        correctIndex,
        explanation,
        difficultyLevel: clampDifficulty(asNumber(parsed.difficultyLevel, input.difficultyLevel)),
        source: 'ai'
    };
};

// ── Rate Limiter ──
// In-memory rate limiting per user for AI-heavy actions
// Limits: 15 calls/hour, 50 calls/day per user
const RATE_LIMITS = {
    hourly: 15,
    daily: 50,
} as const;

const RATE_LIMITED_ACTIONS = new Set([
    'analyzeMusicPerformance',
    'analyzeDrawing',
    'generateMusicOverallReport',
    'generateMusicExamContent',
    'analyzeMusicExamPerformance',
    'generateMusicExamReport',
]);

interface RateBucket {
    hourlyCount: number;
    dailyCount: number;
    hourlyResetAt: number;
    dailyResetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();
let cleanupCounter = 0;

function checkRateLimit(userId: string): { allowed: boolean; retryAfterSec?: number } {
    const now = Date.now();
    let bucket = rateBuckets.get(userId);

    if (!bucket) {
        bucket = {
            hourlyCount: 0,
            dailyCount: 0,
            hourlyResetAt: now + 3600_000,
            dailyResetAt: now + 86400_000,
        };
        rateBuckets.set(userId, bucket);
    }

    // Reset expired windows
    if (now >= bucket.hourlyResetAt) {
        bucket.hourlyCount = 0;
        bucket.hourlyResetAt = now + 3600_000;
    }
    if (now >= bucket.dailyResetAt) {
        bucket.dailyCount = 0;
        bucket.dailyResetAt = now + 86400_000;
    }

    // Check limits
    if (bucket.hourlyCount >= RATE_LIMITS.hourly) {
        const retryAfterSec = Math.ceil((bucket.hourlyResetAt - now) / 1000);
        return { allowed: false, retryAfterSec };
    }
    if (bucket.dailyCount >= RATE_LIMITS.daily) {
        const retryAfterSec = Math.ceil((bucket.dailyResetAt - now) / 1000);
        return { allowed: false, retryAfterSec };
    }

    // Increment
    bucket.hourlyCount++;
    bucket.dailyCount++;

    // Periodic cleanup of stale entries (every 100 requests)
    if (++cleanupCounter % 100 === 0) {
        for (const [key, b] of rateBuckets) {
            if (now >= b.dailyResetAt) rateBuckets.delete(key);
        }
    }

    return { allowed: true };
}

function extractUserIdFromRequest(req: Request): string {
    // Try to extract user ID from Supabase JWT
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub) return payload.sub;
        } catch {
            // JWT decode failed, fall through to IP
        }
    }
    // Fallback to IP-based identification
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return `ip:${forwarded.split(',')[0].trim()}`;
    return `ip:unknown-${Date.now()}`;
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: getCorsHeaders(req) });
    }

    try {
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const {
            action,
            mode,
            promptData,
            drawingBase64,
            theme,
            story,
            testType,
            target,
            detected,
            input,
            promptTemplate,
            testResults,
            // Music Exam AI fields
            module: musicModule,
            questionIndex,
            totalQuestions,
            difficulty,
            previousNotes,
            moduleScores,
            // Audio recording for multimodal analysis
            audioBase64,
            audioMimeType,
        } = await req.json();

        // ── Rate limit check for AI-heavy actions ──
        if (RATE_LIMITED_ACTIONS.has(action)) {
            const userId = extractUserIdFromRequest(req);
            const rateCheck = checkRateLimit(userId);
            if (!rateCheck.allowed) {
                return new Response(
                    JSON.stringify({
                        error: 'Çok fazla AI analizi isteği gönderildi. Lütfen daha sonra tekrar deneyin.',
                        retryAfterSec: rateCheck.retryAfterSec
                    }),
                    {
                        status: 429,
                        headers: {
                            ...getCorsHeaders(req),
                            'Content-Type': 'application/json',
                            'Retry-After': String(rateCheck.retryAfterSec || 60),
                        },
                    }
                );
            }
        }

        let result: string | object;

        switch (action) {
            case 'generatePrompt':
                result = await generatePrompt(GEMINI_API_KEY, mode);
                break;
            case 'analyzeDrawing':
                result = await analyzeDrawing(GEMINI_API_KEY, mode, promptData, drawingBase64);
                break;
            case 'generateStory':
                result = await generateStory(GEMINI_API_KEY, theme);
                break;
            case 'generateQuestions':
                result = await generateQuestions(GEMINI_API_KEY, story);
                break;
            case 'generateAdaptiveQuestion':
                result = await generateAdaptiveQuestion(GEMINI_API_KEY, input, promptTemplate);
                break;
            case 'analyzeMusicPerformance':
                result = await analyzeMusicPerformance(GEMINI_API_KEY, testType, target, detected);
                break;
            case 'generateStillLifeImage':
                result = await generateStillLifeImage(GEMINI_API_KEY);
                break;
            case 'generateMusicOverallReport':
                result = await generateMusicOverallReport(GEMINI_API_KEY, testResults);
                break;
            case 'generateMusicExamContent':
                result = await generateMusicExamContent(GEMINI_API_KEY, musicModule, questionIndex, totalQuestions, difficulty, previousNotes);
                break;
            case 'analyzeMusicExamPerformance':
                result = await analyzeMusicExamPerformance(GEMINI_API_KEY, musicModule, target, detected, questionIndex, difficulty, audioBase64, audioMimeType);
                break;
            case 'generateMusicExamReport':
                result = await generateMusicExamReport(GEMINI_API_KEY, moduleScores);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ result }), {
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });
    }
});

async function generatePrompt(apiKey: string, mode: string): Promise<string> {
    // Her istekte farklı kelimeler üretmek için rastgele bir seed oluştur
    const randomCategories = [
        'doğa ve bitkiler', 'uzay ve gezegenler', 'deniz canlıları', 'mutfak eşyaları',
        'müzik aletleri', 'spor malzemeleri', 'gizemli yerler', 'eski uygarlıklar',
        'hava durumu', 'mevsimler', 'ulaşım araçları', 'meslekler',
        'duygular', 'geometrik şekiller', 'masal karakterleri', 'yiyecekler',
        'hayvanlar', 'kıyafetler', 'oyuncaklar', 'binalar ve yapılar'
    ];
    const storyThemes = [
        'bir orman macerasında', 'denizaltında', 'uzayda bir gezegende', 'gizemli bir mağarada',
        'eski bir şatoda', 'büyülü bir bahçede', 'bir çöl yolculuğunda', 'dağ başında bir kulübede',
        'kayıp bir şehirde', 'bir ada kıyısında', 'karlar altında', 'bir sirkte',
        'bir baloncunun dükkânında', 'bir tren yolculuğunda', 'bulutların üstünde',
        'bir müzede gece', 'küçük bir köyde', 'devasa bir ağacın tepesinde'
    ];
    const cat1 = randomCategories[Math.floor(Math.random() * randomCategories.length)];
    const cat2 = randomCategories[Math.floor(Math.random() * randomCategories.length)];
    const storyTheme = storyThemes[Math.floor(Math.random() * storyThemes.length)];
    const randomSeed = Math.floor(Math.random() * 99999);

    const prompt = mode === 'THREE_WORDS'
        ? `Çocuklar için birbirinden bağımsız, somut ve çizilmesi eğlenceli 3 adet rastgele kelime üret. Her seferinde TAMAMEN FARKLI ve SÜRPRİZ kelimeler seç. Şu kategorilerden ilham al: "${cat1}" ve "${cat2}". Şemsiye, ağaç, güneş, bulut, ev, çiçek gibi çok basit ve sık tekrarlanan kelimeleri ASLA kullanma. Sadece kelimeleri virgülle ayırarak yaz. (Rastgele tohum: ${randomSeed})`
        : `Sadece TEK BİR kısa hikaye başlangıcı yaz. Liste yapma, numara koyma, birden fazla hikaye yazma. Maksimum 3 cümle olsun. Hikaye ${storyTheme} geçsin ve "${cat1}" temasından ilham alsın. Çocuklar için benzersiz, yaratıcı, ucu açık ve görsel olarak devam ettirilebilecek bir senaryo kurgula. Hikaye heyecanlı bir yerde bitsin. (Rastgele tohum: ${randomSeed})`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 1.5,
                    topP: 0.95,
                    topK: 64,
                },
            }),
        }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function analyzeDrawing(
    apiKey: string,
    mode: string,
    promptData: { words?: string[]; story?: string },
    drawingBase64: string
): Promise<string> {
    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'THREE_WORDS') {
        systemPrompt = 'Sen nazik bir resim öğretmenisin. Verilen 3 kelime ile çizilen kara kalem resmi; Oran Orantı 20 puan, Çizgi Yeteneği 20, Perspektif 10, Yaratıcılık 30, Kompozisyon 20 puan üzerinden değerlendirerek puan ver ve çocuğun kendi yorumunu nazikçe değerlendir.';
        userPrompt = `Bu resim şu 3 kelimeye göre yapıldı: ${promptData.words?.join(', ')}. Çocuğun çizimini analiz et, kelimelerin nasıl yansıtıldığını söyle ve motive edici geri bildirim ver.`;
    } else if (mode === 'STORY_CONTINUATION') {
        systemPrompt = 'Sen yaratıcı bir hikaye anlatıcısı ve sanat eleştirmenisin.';
        userPrompt = `Bu resim şu hikayenin devamı olarak kara kalemle çizildi: "${promptData.story}". Çocuğun hikayeyi nasıl görselleştirdiğini analiz et ve hayal gücünü öv.`;
    } else {
        systemPrompt = 'Sen bir teknik resim öğretmenisin.';
        userPrompt = 'Bu resim, sana gönderilen referans siyah beyaz masa düzeni resmine bakılarak çizildi. Benzerlikleri ve çocuğun kendi yorumunu nazikçe değerlendir.';
    }

    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Data = drawingBase64.includes(',')
        ? drawingBase64.split(',')[1]
        : drawingBase64;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt + ' Geri bildirimlerin her zaman pozitif ve geliştirici olmalı. Türkçe konuş.' }]
                },
                contents: [{
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: base64Data } },
                        { text: userPrompt }
                    ]
                }],
            }),
        }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analiz yapılamadı.';
}

// Story generation types
type StoryTheme = 'animals' | 'adventure' | 'fantasy' | 'science' | 'friendship' | 'life-lessons';

interface StoryData {
    title: string;
    content: string;
    summary: string;
    questions: Array<{
        text: string;
        options: string[];
        correctAnswer: number;
        feedback: {
            correct: string;
            incorrect: string;
        };
    }>;
}

async function generateStory(apiKey: string, theme: StoryTheme): Promise<StoryData> {
    const themeSpecificContent: Record<StoryTheme, string> = {
        animals: 'Hayvanın özellikleri ve arkadaşlıkları hakkında',
        adventure: 'Macera dolu bir keşif yolculuğu hakkında',
        fantasy: 'Sihirli yaratıklar ve büyülü dünyalar hakkında',
        science: 'Bilimsel keşifler ve merak uyandıran deneyler hakkında',
        friendship: 'Arkadaşlığın önemi ve birlikte çalışmak hakkında',
        'life-lessons': 'Günlük hayattan öğrenilen dersler hakkında'
    };
    // Rastgelelik: Her çağrıda farklı hikaye üretmek için
    const locations = ['bir orman kenarında', 'deniz kıyısında', 'dağın tepesinde', 'küçük bir köyde', 'büyük bir şehirde', 'bir çiftlikte', 'nehir kenarında', 'bir adada', 'eski bir kalede', 'bulutların üstünde', 'bir bahçede', 'okul bahçesinde', 'bir pazarda', 'tren istasyonunda', 'bir gemide'];
    const childNames = ['Ersan', 'Ali', 'Zeynep', 'Mert', 'Defne', 'Ege', 'Deniz', 'Yağmur', 'Can', 'Cemre', 'Berk', 'İrem', 'Kerem', 'Sude', 'Arda'];
    const animals = ['kedi', 'köpek', 'tavşan', 'kuş', 'kaplumbağa', 'sincap', 'ayı', 'tilki', 'baykuş', 'karınca', 'arı', 'kelebek', 'balık', 'fare', 'papağan'];
    const colorPatterns = ['kırmızı-mavi-yeşil', 'sarı-turuncu-mor', 'beyaz-siyah-gri', 'pembe-turkuaz-lila', 'altın-gümüş-bronz'];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomChild = childNames[Math.floor(Math.random() * childNames.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomColors = colorPatterns[Math.floor(Math.random() * colorPatterns.length)];
    const randomNumber = Math.floor(Math.random() * 7) + 3; // 3-9 arası
    const randomSeed = Math.floor(Math.random() * 99999);

    const prompt = `
7-12 yaş arası çocuklar için ${themeSpecificContent[theme] || 'eğlenceli bir konu'} bir hikaye yaz (100-200 kelime).
Hikaye ${randomLocation} geçmeli, ana karakter "${randomChild}" adında bir çocuk olmalı ve yanında "${randomAnimal}" adında/türünde bir hayvan arkadaşı olmalı.
Hikayede ${randomNumber} adet sayılabilir nesne ve ${randomColors} renk sırası/örüntüsü kullan.
(Rastgele tohum: ${randomSeed} — her seferinde TAMAMEN FARKLI bir hikaye yaz)
Hikaye şu özelliklere sahip olmalı:

	Hikaye başlangıç, gelişme ve sonuç bölümlerinden oluşmalıdır.
	•	Hikaye olumlu mesajlar ve öğretici unsurlar içermelidir.
	•	Çocuk dostu bir dil kullanılmalıdır.
	•	Hikaye ilgi çekici ve betimleyici olmalıdır.
	•	Türkçe karakterler doğru kullanılmalıdır (ç, ş, ı, ğ, ü, ö, İ).
	•	Hikaye için çarpıcı ve ilgi çekici bir başlık oluşturulmalıdır.
    Başlık Kuralları
	•	Başlık 2-6 kelime arasında olmalıdır.
	•	Kısa, akılda kalıcı ve hikâyeyi yansıtmalıdır.

Karakter Kuralları
	•	Karakterlerin isimleri ve özellikleri net olmalıdır.
	•	Eğer hayvan karakterler varsa özellikleri ve rolleri açıkça belirtilmelidir.

Hikaye İçeriği Kuralları

Hikayede mutlaka aşağıdaki unsurlar bulunmalıdır:
	•	En az 2 karakter
	•	En az 1 hayvan karakter
	•	En az bir yön veya konum bilgisi (sağ, sol, ön, arka, yukarı vb.)
	•	En az bir sayı veya sayılabilir nesne
	•	En az bir tekrar eden örüntü veya sıra (renk, nesne veya olay sırası)

Bu unsurlar sonradan sorulacak soruların temelini oluşturacaktır.

SORU OLUŞTURMA KURALLARI

Hikayeden sonra tam 5 adet çoktan seçmeli soru oluştur. Her soru FARKLI bir türde olmalıdır.

Çok önemli kurallar:
	•	Soruların cevabı mutlaka hikâyede bulunmalıdır.
	•	Sorular hikâyede geçen olay, sayı, yön, karakter veya nesnelerden oluşturulmalıdır.
	•	Hikâyede olmayan hiçbir bilgi sorulamaz.
	•	Her soruda 4 seçenek olmalıdır.
	•	Her sorunun türü (questionType) mutlaka belirtilmelidir.

SORU TÜRLERİ (Bu sırada olmalı, her biri FARKLI bir tür):

1. questionType: "Okuduğunu Anlama" → Hikâyenin ana fikri veya önemli bir detayını sor. Örnek: "Hikâyede Elif neden ormana gitti?"
2. questionType: "Sözel Mantık" → Karakterlerin davranışları veya ilişkileri üzerinden mantık çıkarımı yap. Örnek: "Ali kediye yardım ettiyse, Ali nasıl biridir?"
3. questionType: "Matematiksel Akıl Yürütme" → Hikâyede geçen sayıları kullanarak toplama, çıkarma veya sayma sorusu sor. Örnek: "Bahçede 3 elma ve 4 armut varsa toplam kaç meyve vardır?"
4. questionType: "Görsel Uzamsal Algı" → Hikâyede geçen yön, konum veya mekân ilişkisi sor. Örnek: "Kedi ağacın sağında, köpek solundaysa, kediye göre köpek nerededir?"
5. questionType: "Örüntü Tanıma" → Hikâyede geçen tekrar eden renk, nesne veya olay dizisinden kural bul. Örnek: "Kırmızı, mavi, kırmızı, mavi... sıradaki ne olur?"

ÖNEMLİ: 5 sorunun 5'i de FARKLI türde olmalıdır. Aynı türden birden fazla soru YASAKTIR.

Yanıtı aşağıdaki JSON yapısında formatla (sadece JSON döndür, başka metin ekleme):
{
  "title": "Hikaye Başlığı",
  "content": "Hikaye içeriği...",
  "summary": "Resim oluşturma için detaylı sahne özeti (karakterler, ortam ve eylemler)",
  "questions": [
    {
      "questionType": "Okuduğunu Anlama",
      "text": "Soru metni",
      "options": ["Seçenek 1", "Seçenek 2", "Seçenek 3", "Seçenek 4"],
      "correctAnswer": 0,
      "feedback": {
        "correct": "Doğru cevap için açıklama",
        "incorrect": "Yanlış cevap için açıklama"
      }
    },
    {
      "questionType": "Sözel Mantık",
      "text": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": 0,
      "feedback": { "correct": "...", "incorrect": "..." }
    },
    {
      "questionType": "Matematiksel Akıl Yürütme",
      "text": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": 0,
      "feedback": { "correct": "...", "incorrect": "..." }
    },
    {
      "questionType": "Görsel Uzamsal Algı",
      "text": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": 0,
      "feedback": { "correct": "...", "incorrect": "..." }
    },
    {
      "questionType": "Örüntü Tanıma",
      "text": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": 0,
      "feedback": { "correct": "...", "incorrect": "..." }
    }
  ]
}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'Sen yetenekli bir çocuk hikayesi yazarısın. Eğlenceli, eğitici ve çarpıcı başlıkları olan çocuklara uygun hikayeler yarat. Hikayeden sonra 5 FARKLI türde soru üret: Okuduğunu Anlama, Sözel Mantık, Matematiksel Akıl Yürütme, Görsel Uzamsal Algı ve Örüntü Tanıma. ÇOK ÖNEMLİ: Her sorunun cevabı MUTLAKA hikaye metninde açıkça geçmeli. Hikayede geçmeyen sayı, isim, yön veya bilgi ASLA sorulmamalı. Önce hikayeyi yaz, sonra hikayeyi tekrar oku ve sadece hikayedeki bilgilere dayanan sorular oluştur. Yanıtını sadece JSON formatında ver.' }]
                },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 4000,
                    responseMimeType: 'application/json'
                }
            }),
        }
    );

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
        throw new Error('Gemini API geçersiz yanıt döndürdü');
    }

    // Parse JSON response
    const storyData = JSON.parse(textContent);

    // Validate required fields
    if (!storyData.title || !storyData.content || !storyData.summary) {
        throw new Error('Hikaye verilerinde gerekli alanlar eksik');
    }

    return storyData;
}

async function generateQuestions(
    apiKey: string,
    story: { title: string; content: string }
): Promise<Array<{
    text: string;
    options: string[];
    correctAnswer: number;
    feedback: { correct: string; incorrect: string };
}>> {
    const prompt = `
Bu hikaye için 5 adet çoktan seçmeli soru oluştur:

Başlık: ${story.title}
Hikaye: ${story.content}

Soruların dağılımı BİLSEM yetenek sınavı mantığına uygun olarak BİREBİR şu şekilde olmalı ve mutlaka hikaye ile ilişkili olmalıdır.:
1. Okuduğunu anlama (Hikayenin ana fikri veya bir detayı)
2. Sözel Mantık (Karakterlerin kimlikleri veya eylemleri üzerinden bir mantık çıkarımı)
3. Matematiksel Akıl Yürütme (Hikayeye gizlenmiş basit dört işlem veya sayma sorusu)
4. Görsel/Uzamsal Algı (Hikayedeki yönler, şekiller veya konumlar üzerinden zihinsel canlandırma sorusu)
5. Örüntü Tanıma (Hikayedeki olayların, renklerin veya nesnelerin dizilimi ile ilgili bir kural bulma sorusu)

Soruların zorluk seviyesi 7-12 yaş için düşündürücü ama çözülebilir olmalıdır.
- Her soru için 4 seçenek olmalı
- Doğru cevap için olumlu, yanlış cevap için yapıcı geri bildirim içermeli

Yanıtı aşağıdaki JSON yapısında formatla (sadece JSON döndür):
{
  "questions": [
    {
      "text": "Soru metni",
      "options": ["Seçenek 1", "Seçenek 2", "Seçenek 3", "Seçenek 4"],
      "correctAnswer": 0,
      "feedback": {
        "correct": "Doğru cevap için açıklama",
        "incorrect": "Yanlış cevap için açıklama"
      }
    }
  ]
}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'Sen bir eğitim uzmanısın. Çocuklar için uygun, eğitici ve eğlenceli sorular hazırla. Yanıtını sadece JSON formatında ver.' }]
                },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                    responseMimeType: 'application/json'
                }
            }),
        }
    );

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
        throw new Error('Sorular için Gemini API geçersiz yanıt döndürdü');
    }

    const questionsData = JSON.parse(textContent);

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
        throw new Error('Sorular için geçersiz format');
    }

    return questionsData.questions;
}

async function generateAdaptiveQuestion(
    apiKey: string,
    rawInput: unknown,
    promptTemplate?: AdaptiveQuestionPromptTemplatePayload
): Promise<AdaptiveQuestionResult> {
    const input = normalizeAdaptiveInput(rawInput);
    const { systemPrompt, userPrompt } = resolveAdaptivePrompts(input, promptTemplate);

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 800,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            topic: { type: 'string' },
                            stem: { type: 'string' },
                            options: {
                                type: 'array',
                                items: { type: 'string' },
                                minItems: 4,
                                maxItems: 4
                            },
                            correctIndex: { type: 'integer' },
                            explanation: { type: 'string' },
                            difficultyLevel: { type: 'number' },
                            source: { type: 'string' }
                        },
                        required: ['id', 'topic', 'stem', 'options', 'correctIndex', 'explanation', 'difficultyLevel', 'source']
                    }
                }
            }),
        }
    );

    const data = await response.json();
    if (!response.ok) {
        const errorMessage =
            data?.error?.message ||
            data?.error ||
            'Gemini adaptive question generation failed';
        throw new Error(errorMessage);
    }

    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent || typeof textContent !== 'string') {
        throw new Error('Gemini adaptive question response is empty');
    }

    const parsed = JSON.parse(textContent) as unknown;
    return normalizeAdaptiveQuestionResult(parsed, input);
}

// Music Performance Analysis
interface MusicAnalysisResult {
    score: number;
    accuracy: number;
    feedback: {
        strengths: string[];
        improvements: string[];
        tips: string[];
    };
    encouragement: string;
    detailedAnalysis: string;
}

async function analyzeMusicPerformance(
    apiKey: string,
    testType: string,
    target: unknown,
    detected: unknown
): Promise<MusicAnalysisResult> {
    const prompt = `
Sen uzman bir müzik öğretmenisin. Bir öğrencinin BİLSEM müzik yetenek testindeki performansını analiz et.
Öğrenci yaşı: 7-12. Dil: Türkçe. Üslup: Teşvik edici, yapıcı ve profesyonel.

Test Türü: ${testType}
Beklenen (Hedef): ${JSON.stringify(target)}
Algılanan (Öğrenci): ${JSON.stringify(detected)}

Analiz kriterleri:
- Pitch (frekans) doğruluğu
- Ritim ve zamanlama tutarlılığı
- Müzikal duyum kalitesi

Lütfen SADECE belirlenen JSON formatında yanıt ver.
`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'Sen müzik eğitimi uzmanı bir AI asistanısın. Türkçe yanıt ver. Yapıcı ve teşvik edici ol.' }]
                },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'object',
                        properties: {
                            score: { type: 'number' },
                            accuracy: { type: 'number' },
                            feedback: {
                                type: 'object',
                                properties: {
                                    strengths: { type: 'array', items: { type: 'string' } },
                                    improvements: { type: 'array', items: { type: 'string' } },
                                    tips: { type: 'array', items: { type: 'string' } }
                                },
                                required: ['strengths', 'improvements', 'tips']
                            },
                            encouragement: { type: 'string' },
                            detailedAnalysis: { type: 'string' }
                        },
                        required: ['score', 'accuracy', 'feedback', 'encouragement', 'detailedAnalysis']
                    }
                }
            }),
        }
    );

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
        return {
            score: 0,
            accuracy: 0,
            feedback: { strengths: [], improvements: ['Analiz yapılamadı'], tips: [] },
            encouragement: 'Bağlantını kontrol edip tekrar dene.',
            detailedAnalysis: 'Sistem analizi şu an gerçekleştiremiyor.'
        };
    }

    try {
        return JSON.parse(textContent);
    } catch {
        // Gemini bazen kesik JSON döndürebiliyor — graceful fallback
        return {
            score: 50,
            accuracy: 50,
            feedback: {
                strengths: ['Denemeye devam et!'],
                improvements: ['AI analiz sonucu tam oluşturulamadı'],
                tips: ['Tekrar deneyerek daha iyi sonuçlar alabilirsin']
            },
            encouragement: 'Harika gidiyorsun, tekrar dene! 🎵',
            detailedAnalysis: 'Analiz kısmen oluşturuldu. Lütfen tekrar deneyin.'
        };
    }
}

// Still Life Image Generation using Gemini Imagen
async function generateStillLifeImage(apiKey: string): Promise<string> {
    // Rastgele natürmort nesne kombinasyonları
    const objectSets = [
        'bir elma, bir armut ve bir üzüm salkımı',
        'bir çaydanlık, iki fincan ve bir şekerlik',
        'bir kitap, bir gözlük ve bir kalem',
        'bir vazo içinde çiçekler ve yanında bir elma',
        'bir mum, bir eski saat ve bir kitap',
        'bir keman ve nota kağıtları',
        'bir sepet içinde ekmek ve peynir',
        'bir şapka, bir eşarp ve eldiven',
        'bir fener, bir pusula ve harita',
        'üç farklı boyutta seramik vazo',
        'bir kahve fincanı, kahve çekirdekleri ve bir kaşık',
        'bir satranç tahtası ve birkaç taş',
        'antik bir telefon ve bir defter',
        'bir gitar ve yanında bir şapka',
        'meyveli bir tabak ve bir bıçak'
    ];

    const randomObjects = objectSets[Math.floor(Math.random() * objectSets.length)];

    const prompt = `Siyah beyaz, kara kalem tarzında, profesyonel bir natürmort çizimi. 
Basit bir masa üzerinde ${randomObjects} düzenlenmiş. 
Yumuşak gölgelendirme, temiz çizgiler, sanatsal perspektif. 
Arka plan sade ve boş olmalı. Resim çizim eğitimi için referans olarak kullanılacak.
Gerçekçi gölgeler ve ışık-gölge kontrastı önemli. Kesinlikle renkli olmamalı, sadece siyah-beyaz tonlar.`;

    try {
        // Gemini 2.5 Flash Image ile görsel üretimi (Google AI Studio formatı)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        responseModalities: ['IMAGE', 'TEXT']
                    }
                }),
            }
        );

        const data = await response.json();

        // Debug: API yanıtını logla
        console.log('Gemini 2.5 Flash Image Response status:', response.status);
        console.log('Gemini 2.5 Flash Image Response:', JSON.stringify(data).substring(0, 800));

        if (data.error) {
            console.error('Gemini API Error:', JSON.stringify(data.error));
            return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop';
        }

        // Görsel verisini çıkar
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                console.log('Görsel başarıyla üretildi!');
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }

        // Fallback: Görsel üretilemezse statik URL
        console.error('Görsel üretilemedi');
        return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop';
    } catch (error) {
        console.error('Görsel üretim hatası:', error);
        return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop';
    }
}

// ── Music Overall Report Generator ──
async function generateMusicOverallReport(apiKey: string, testResults: Array<{ test_type: string; score: number; accuracy: number; feedback: unknown }>) {
    const resultsText = testResults.map(r => `${r.test_type}: skor=${r.score}, doğruluk=${r.accuracy}`).join('\n');

    const prompt = `Sen BİLSEM müzik yetenek değerlendirme uzmanısın. Aşağıda bir öğrencinin 8 farklı müzik testinden aldığı sonuçlar var:

${resultsText}

BİLSEM Müzik Sınavı rubriğine göre aşağıdaki 4 beceri alanını değerlendir:
1. Perde Duyma (maks 60 puan): single-note, double-note, triple-note testlerinden
2. Ritim Algısı (maks 24 puan): rhythm, rhythm-diff testlerinden
3. Melodik Hafıza (maks 20 puan): melody, melody-diff testlerinden
4. Müzikal İfade (maks 25 puan): song testinden

Her alanın puanını ilgili testlerin ortalamasından hesapla ve o alanın maksimum puanına ölçekle.
Genel puanı 100 üzerinden ver.
Seviyeyi belirle: Başlangıç (0-40), Gelişen (41-60), Orta (61-75), İleri (76-90), Üstün (91-100).
Türkçe, çocuk dostu ve teşvik edici ol.`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'Sen BİLSEM müzik yetenek uzmanısın. Türkçe yanıt ver. Yapıcı, teşvik edici ve çocuk dostu ol.' }]
                },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'object',
                        properties: {
                            overallScore: { type: 'number' },
                            pitchScore: { type: 'number' },
                            rhythmScore: { type: 'number' },
                            melodyScore: { type: 'number' },
                            expressionScore: { type: 'number' },
                            level: { type: 'string' },
                            strengths: { type: 'array', items: { type: 'string' } },
                            improvements: { type: 'array', items: { type: 'string' } },
                            recommendations: { type: 'array', items: { type: 'string' } },
                            detailedAnalysis: { type: 'string' }
                        },
                        required: ['overallScore', 'pitchScore', 'rhythmScore', 'melodyScore', 'expressionScore', 'level', 'strengths', 'improvements', 'recommendations', 'detailedAnalysis']
                    }
                }
            })
        }
    );

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
        return {
            overallScore: 0, pitchScore: 0, rhythmScore: 0, melodyScore: 0, expressionScore: 0,
            level: 'Hesaplanamadı', strengths: [], improvements: ['Rapor oluşturulamadı'],
            recommendations: [], detailedAnalysis: 'Sistem raporu şu an oluşturamıyor.'
        };
    }

    try {
        return JSON.parse(textContent);
    } catch {
        return {
            overallScore: 0, pitchScore: 0, rhythmScore: 0, melodyScore: 0, expressionScore: 0,
            level: 'Hesaplanamadı', strengths: [], improvements: ['Rapor kısmen oluşturuldu'],
            recommendations: ['Tekrar deneyin'], detailedAnalysis: 'Rapor tam oluşturulamadı.'
        };
    }
}

// ── BİLSEM Music Exam AI Engine ──

const MODULE_DESCRIPTIONS: Record<string, string> = {
    'tek-ses': 'Tek Ses Tekrarı — Öğrenci piyanodan çalınan tek bir notayı duyar ve sesiyle tekrar eder. Pitch (frekans) doğruluğu ölçülür.',
    'cift-ses': 'Çift Ses Tekrarı — İki nota aynı anda çalınır (aralık/akor). Öğrenci iki sesi ayrı ayrı duyar ve tekrar eder.',
    'ezgi': 'Ezgi Tekrarı — Kısa bir melodi çalınır (3-8 nota). Öğrenci melodiyi hafızasından tekrar eder.',
    'ritim': 'Ritim Tekrarı — Bir ritim kalıbı çalınır. Öğrenci aynı ritmi vurarak tekrar eder.',
    'sarki': 'Şarkı Söyleme — Bilinen bir Türk çocuk şarkısı seçilir. Öğrenci şarkıyı söyler, ses rengi ve entonasyon değerlendirilir.',
    'uretkenlik': 'Müzikal Üretkenlik — Öğrenciye bir tema verilir, serbest müzikal ifade (şarkı, ritim, melodi) yapması beklenir.',
};

async function generateMusicExamContent(
    apiKey: string,
    module: string,
    questionIndex: number,
    totalQuestions: number,
    difficulty: number,
    previousNotes: string[]
): Promise<unknown> {
    const moduleDesc = MODULE_DESCRIPTIONS[module] || module;
    const diffLabel = ['Çok Kolay', 'Kolay', 'Orta', 'Zor', 'Çok Zor'][Math.min(difficulty - 1, 4)];

    const prompt = `
Sen BİLSEM müzik yetenek sınavının AI yöneticisisin. Aşağıdaki modül için sınav içeriği üret.

Modül: ${moduleDesc}
Soru: ${questionIndex + 1}/${totalQuestions}
Zorluk: ${difficulty}/5 (${diffLabel})
Daha önce kullanılan notalar (tekrar etme): ${previousNotes.join(', ') || 'yok'}

Kurallar:
- Notalar bilimsel notasyon kullanır: C4, D#3, A5 gibi
- Zorluk arttıkça: daha geniş aralıklar, daha uzun diziler, daha karmaşık ritimler
- Çocuklara uygun (7-12 yaş), motive edici

${module === 'tek-ses' ? `
Üret: Tek bir hedef nota (oktav 3-5 arası).
JSON: { "notes": ["C4"], "hint": "İpucu metni", "difficulty": ${difficulty} }
` : ''}
${module === 'cift-ses' ? `
Üret: İki nota (aralık: 3lü, 5li, 8li vb).
JSON: { "notes": ["C4", "E4"], "hint": "İpucu", "difficulty": ${difficulty} }
` : ''}
${module === 'ezgi' ? `
Üret: Melodi dizisi (${3 + difficulty} nota, süreleri saniye).
JSON: { "melody": { "notes": ["C4","D4","E4"], "durations": [0.5,0.5,0.5], "name": "Melodi adı" }, "hint": "İpucu", "difficulty": ${difficulty} }
` : ''}
${module === 'ritim' ? `
Üret: Ritim kalıbı (beat timestamps ms, tempo BPM).
JSON: { "rhythm": { "beats": [0, 500, 1000, 1500], "tempo": ${90 + difficulty * 10}, "name": "Ritim adı", "timeSignature": "4/4" }, "hint": "İpucu", "difficulty": ${difficulty} }
` : ''}
${module === 'sarki' ? `
Üret: Bilinen bir Türk çocuk şarkısı (Küçük Kurbağa, Kırmızı Balık, Ali Baba, vs).
JSON: { "song": { "name": "Şarkı adı", "lyrics": "Sözler", "melody": ["C4","D4"], "durations": [0.4, 0.4] }, "hint": "İpucu", "difficulty": ${difficulty} }
` : ''}
${module === 'uretkenlik' ? `
Üret: Yaratıcılık teması (doğa, duygular, hayvanlar vb).
JSON: { "creativity": { "theme": "Tema", "constraints": ["Kısıt 1"], "inspiration": "İlham", "hints": ["İpucu 1"] }, "hint": "İpucu", "difficulty": ${difficulty} }
` : ''}

SADECE JSON döndür, başka metin ekleme.
`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'Sen BİLSEM müzik yetenek sınavını yöneten bir AI\'sın. Verilen modül ve zorluk seviyesine göre sınav içeriği üretirsin. SADECE geçerli JSON döndür, açıklama ekleme. Notalar bilimsel notasyon (C4, D#3) kullanır.' }]
                },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                    responseMimeType: 'application/json',
                },
            }),
        }
    );

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) throw new Error('Gemini müzik içeriği üretemedi');

    return JSON.parse(textContent);
}

async function analyzeMusicExamPerformance(
    apiKey: string,
    module: string,
    target: unknown,
    detected: unknown,
    questionIndex: number,
    difficulty: number,
    audioBase64?: string,
    audioMimeType?: string
): Promise<unknown> {
    const moduleDesc = MODULE_DESCRIPTIONS[module] || module;
    const hasAudio = !!audioBase64;

    const prompt = `
Sen BİLSEM müzik yetenek sınavı jürisisin. Öğrencinin performansını analiz et.

Modül: ${moduleDesc}
Soru: ${questionIndex + 1}
Zorluk: ${difficulty}/5
Beklenen (Hedef): ${JSON.stringify(target)}
Algılanan (Pitch Detection): ${JSON.stringify(detected)}
${hasAudio ? '\n🎤 ÖNEMLİ: Öğrencinin ses kaydı ekte verilmiştir. Ses kaydını dinleyerek şunları değerlendir:\n- Ses kalitesi ve tını\n- Entonasyon ve pitch doğruluğu\n- Ritim ve zamanlama\n- Vibrato ve müzikal ifade\n- Genel müzikal potansiyel\nSes kaydı, pitch detection verisinden çok daha güvenilir bir kaynaktır.' : ''}

Değerlendir:
${module === 'tek-ses' || module === 'cift-ses' ? '- Pitch doğruluğu (cent cinsinden sapma)\n- Nota kararlılığı\n- Ses tınısı ve kalitesi' : ''}
${module === 'ezgi' ? '- Nota sırası doğruluğu\n- Melodinin genel akışı\n- Hafıza performansı\n- Müzikal ifade' : ''}
${module === 'ritim' ? '- Zamanlama doğruluğu (ms sapma)\n- Tempo kararlılığı\n- Ritim kalıbı tutarlılığı' : ''}
${module === 'sarki' ? '- Ses rengi kalitesi\n- Entonasyon doğruluğu\n- Müzikal ifade ve yorum\n- Vibrato kontrolü' : ''}
${module === 'uretkenlik' ? '- Orijinallik\n- Müzikal yapı\n- Cesaret ve ifade\n- Yaratıcı risk alma' : ''}

Öğrenci yaşı: 7-12. Üslup: Teşvik edici. Dil: Türkçe.

JSON formatı:
{
    "score": (0-100 arası skor),
    "maxScore": 100,
    "accuracy": (0-100 doğruluk yüzdesi),
    "feedback": {
        "strengths": ["güçlü yön 1", "güçlü yön 2"],
        "improvements": ["gelişim alanı 1"],
        "tips": ["pratik ipucu 1"]
    },
    "encouragement": "Motive edici mesaj",
    "detailedAnalysis": "Detaylı analiz paragrafı${hasAudio ? ' (ses kaydı analizi dahil)' : ''}",
    "voiceAnalysis": ${hasAudio ? '{\n        "toneQuality": "Ses tınısı değerlendirmesi",\n        "pitchAccuracy": "Entonasyon değerlendirmesi",\n        "rhythm": "Ritim ve zamanlama değerlendirmesi",\n        "musicalExpression": "Müzikal ifade değerlendirmesi",\n        "overallPotential": "Genel müzikal potansiyel değerlendirmesi"\n    }' : 'null'}
}

SADECE JSON döndür.
`;

    // Build content parts — text + optional audio
    const contentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        { text: prompt },
    ];

    // If audio is provided, add it as inlineData for multimodal analysis
    if (hasAudio && audioBase64) {
        contentParts.push({
            inlineData: {
                mimeType: audioMimeType || 'audio/webm',
                data: audioBase64,
            },
        });
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'Sen bir müzik değerlendirme AI\'sın. Çocukların müzik performansını adil, yapıcı ve teşvik edici şekilde değerlendirirsin. Ses kaydı verildiğinde gerçek ses analizi yap. SADECE geçerli JSON döndür.' }]
                },
                contents: [{ parts: contentParts }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 800,
                    responseMimeType: 'application/json',
                },
            }),
        }
    );

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) throw new Error('Gemini performans analizi yapamadı');

    return JSON.parse(textContent);
}

async function generateMusicExamReport(
    apiKey: string,
    moduleScores: Array<{ module: string; earnedPoints: number; maxPoints: number; details: string }>
): Promise<unknown> {
    const prompt = `
Sen BİLSEM müzik yetenek sınavının baş değerlendiricisisin. Öğrencinin tüm modüllerdeki performansını analiz ederek kapsamlı bir rapor oluştur.

Modül Sonuçları:
${moduleScores.map((m) => `- ${m.module}: ${m.earnedPoints}/${m.maxPoints} puan | ${m.details || 'Detay yok'}`).join('\n')}

Toplam: ${moduleScores.reduce((s, m) => s + m.earnedPoints, 0)}/${moduleScores.reduce((s, m) => s + m.maxPoints, 0)}

Rapor içeriği:
1. Genel değerlendirme (seviye belirleme)
2. Her modül için kısa yorum
3. Güçlü yönler (en az 3)
4. Gelişim alanları (en az 2)
5. Somut çalışma önerileri
6. Motive edici final mesajı

Öğrenci yaşı: 7-12. Dil: Türkçe. Üslup: Profesyonel ama sıcak.

JSON:
{
    "overallScore": (0-100),
    "moduleBreakdown": [{ "module": "tek-ses", "score": 8, "maxScore": 10, "grade": "A", "comment": "Yorum" }],
    "strengths": ["Güçlü yön"],
    "improvements": ["Gelişim alanı"],
    "recommendations": ["Çalışma önerisi"],
    "detailedAnalysis": "Uzun analiz paragrafı",
    "level": "İleri/Orta/Başlangıç",
    "encouragement": "Final mesajı"
}

SADECE JSON döndür.
`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'Sen BİLSEM müzik yetenek sınavı raporu yazan bir AI\'sın. Kapsamlı, adil ve teşvik edici raporlar hazırlarsın. SADECE geçerli JSON döndür.' }]
                },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 1200,
                    responseMimeType: 'application/json',
                },
            }),
        }
    );

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) throw new Error('Gemini sınav raporu oluşturamadı');

    return JSON.parse(textContent);
}
