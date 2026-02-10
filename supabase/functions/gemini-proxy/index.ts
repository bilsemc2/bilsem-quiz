// Supabase Edge Function for Gemini API Proxy
// This keeps the API key secure on the server side

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const { action, mode, promptData, drawingBase64, theme, story, testType, target, detected } = await req.json();

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
            case 'analyzeMusicPerformance':
                result = await analyzeMusicPerformance(GEMINI_API_KEY, testType, target, detected);
                break;
            case 'generateStillLifeImage':
                result = await generateStillLifeImage(GEMINI_API_KEY);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
    const cat1 = randomCategories[Math.floor(Math.random() * randomCategories.length)];
    const cat2 = randomCategories[Math.floor(Math.random() * randomCategories.length)];
    const randomSeed = Math.floor(Math.random() * 99999);

    const prompt = mode === 'THREE_WORDS'
        ? `Çocuklar için birbirinden bağımsız, alışılmadık, somut ve çizilmesi eğlenceli 3 adet rastgele kelime üret. Her seferinde TAMAMEN FARKLI ve SÜRPRİZ kelimeler seç. Şu kategorilerden ilham al: "${cat1}" ve "${cat2}". Şemsiye, ağaç, güneş, bulut, ev, çiçek gibi çok basit ve sık tekrarlanan kelimeleri ASLA kullanma. Sadece kelimeleri virgülle ayırarak yaz. (Rastgele tohum: ${randomSeed})`
        : "Sadece TEK BİR kısa hikaye başlangıcı yaz. Liste yapma, numara koyma, birden fazla hikaye yazma. Maksimum 3 cümle olsun. Çocuklar için benzersiz, yaratıcı, ucu açık ve görsel olarak devam ettirilebilecek bir senaryo kurgula. Hikaye heyecanlı bir yerde bitsin.";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    const prompt = `
7-12 yaş arası çocuklar için ${themeSpecificContent[theme] || 'eğlenceli bir konu'} bir hikaye yaz (100-200 kelime).
Hikaye şu özelliklere sahip olmalı:

- Açık ve net bir başlangıç, gelişme ve sonuç bölümü olmalı
- Olumlu mesajlar ve öğretici unsurlar içermeli
- Çocuk dostu bir dil kullanılmalı
- İlgi çekici ve betimleyici olmalı
- Türkçe karakterler doğru kullanılmalı (ç, ş, ı, ğ, ü, ö, İ)
- Hikaye için ÖZELLİKLE çarpıcı, ilgi çekici ve hikayeyi yansıtan bir başlık oluştur
- Başlık kısa, akılda kalıcı ve hikayeye uygun olmalı
- Başlık 2-6 kelime arasında olmalı
- Karakterlerin isimleri ve özellikleri net olmalı
- Hayvan karakterler varsa özellikleri ve rolleri açıkça belirtilmeli

Ayrıca hikaye için 5 adet çoktan seçmeli soru oluştur:
- Hikayeyi anlamaya ve kelime anlamlarına yönelik olmalı
- Karakterlerin özelliklerini ve rollerini sorgulayan sorular içermeli
- Hikayedeki olayların sırasını kontrol eden sorular olmalı
- Her soru için 4 seçenek olmalı
- Doğru cevap için olumlu, yanlış cevap için yapıcı geri bildirim içermeli

Yanıtı aşağıdaki JSON yapısında formatla (sadece JSON döndür, başka metin ekleme):
{
  "title": "Hikaye Başlığı",
  "content": "Hikaye içeriği...",
  "summary": "Resim oluşturma için detaylı sahne özeti (karakterler, ortam ve eylemler)",
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: 'Sen yetenekli bir çocuk hikayesi yazarısın. Eğlenceli, eğitici ve çarpıcı başlıkları olan yaşa uygun hikayeler yarat. Başlıklar kısa, akılda kalıcı ve hikayenin özünü yansıtan nitelikte olmalı. Yanıtını sadece JSON formatında ver.' }]
                },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2000,
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

Sorular şu özelliklere sahip olmalı:
- Hikayeyi anlamaya ve kelime anlamlarına yönelik olmalı
- Karakterlerin özelliklerini ve rollerini sorgulayan sorular içermeli
- Hikayedeki olayların sırasını kontrol eden sorular olmalı
- Hikayedeki karakterin özelliklerini ve eylemlerini sorgulayan sorular eklenmeli
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    return JSON.parse(textContent);
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
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
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
