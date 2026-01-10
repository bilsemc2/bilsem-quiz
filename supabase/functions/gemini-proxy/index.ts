// Supabase Edge Function for Gemini API Proxy
// This keeps the API key secure on the server side

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

        const { action, mode, promptData, drawingBase64 } = await req.json();

        let result: string;

        switch (action) {
            case 'generatePrompt':
                result = await generatePrompt(GEMINI_API_KEY, mode);
                break;
            case 'analyzeDrawing':
                result = await analyzeDrawing(GEMINI_API_KEY, mode, promptData, drawingBase64);
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
    const prompt = mode === 'THREE_WORDS'
        ? "Çocuklar için birbirinden bağımsız, alışılmadık, somut ve çizilmesi eğlenceli 3 adet rastgele kelime üret. 'Robot, Dinozor, Roket' gibi çok yaygın kelimelerden kaçın. Sadece kelimeleri virgülle ayırarak yaz (Örn: Denizaltı, Dev Mantar, Uçan Kaplumbağa)."
        : "Çocuklar için her seferinde benzersiz, yaratıcı, ucu açık ve görsel olarak devam ettirilebilecek kısa bir hikaye başlangıcı yaz, (Maksimum 3 cümle). Daha önce anlatılmamış özgün senaryolar kurgula. Hikaye heyecanlı bir yerde bitsin.";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
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
        systemPrompt = 'Sen nazik bir resim öğretmenisin. Verilen 3 kelime ile çizilen resmi karşılaştır.';
        userPrompt = `Bu resim şu 3 kelimeye göre yapıldı: ${promptData.words?.join(', ')}. Çocuğun çizimini analiz et, kelimelerin nasıl yansıtıldığını söyle ve motive edici geri bildirim ver.`;
    } else if (mode === 'STORY_CONTINUATION') {
        systemPrompt = 'Sen yaratıcı bir hikaye anlatıcısı ve sanat eleştirmenisin.';
        userPrompt = `Bu resim şu hikayenin devamı olarak çizildi: "${promptData.story}". Çocuğun hikayeyi nasıl görselleştirdiğini analiz et ve hayal gücünü öv.`;
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
