import { GoogleGenAI } from "@google/genai";
import { ActivityMode } from "./types";

const genAI = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
});

export async function generateActivityPrompt(mode: ActivityMode) {
    const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: mode === ActivityMode.THREE_WORDS
            ? "Çocuklar için birbirinden bağımsız, alışılmadık, somut ve çizilmesi eğlenceli 3 adet rastgele kelime üret. 'Robot, Dinozor, Roket' gibi çok yaygın kelimelerden kaçın. Sadece kelimeleri virgülle ayırarak yaz (Örn: Denizaltı, Dev Mantar, Uçan Kaplumbağa)."
            : "Çocuklar için her seferinde benzersiz, yaratıcı, ucu açık ve görsel olarak devam ettirilebilecek kısa bir hikaye başlangıcı yaz, (Maksimum 3 cümle). Daha önce anlatılmamış özgün senaryolar kurgula. Hikaye heyecanlı bir yerde bitsin.",
    });

    return response.text;
}

export async function generateStillLifeImage() {
    try {
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: "A black and white sketch style drawing of simple objects on a wooden table, like a vase with a flower, an apple, and a chair nearby. Simple lines, kid-friendly composition." }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "4:3"
                }
            }
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }

        throw new Error("Görsel oluşturulamadı.");
    } catch (error) {
        console.error("Image generation failed:", error);
        return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop";
    }
}

export async function analyzeDrawing(mode: ActivityMode, promptData: any, drawingBase64: string) {
    let systemPrompt = "";
    let userPrompt = "";

    if (mode === ActivityMode.THREE_WORDS) {
        systemPrompt = "Sen nazik bir resim öğretmenisin. Verilen 3 kelime ile çizilen resmi karşılaştır.";
        userPrompt = `Bu resim şu 3 kelimeye göre yapıldı: ${promptData.words.join(', ')}. Çocuğun çizimini analiz et, kelimelerin nasıl yansıtıldığını söyle ve motive edici geri bildirim ver.`;
    } else if (mode === ActivityMode.STORY_CONTINUATION) {
        systemPrompt = "Sen yaratıcı bir hikaye anlatıcısı ve sanat eleştirmenisin.";
        userPrompt = `Bu resim şu hikayenin devamı olarak çizildi: "${promptData.story}". Çocuğun hikayeyi nasıl görselleştirdiğini analiz et ve hayal gücünü öv.`;
    } else {
        systemPrompt = "Sen bir teknik resim öğretmenisin.";
        userPrompt = `Bu resim, sana gönderilen referans siyah beyaz masa düzeni resmine bakılarak çizildi. Benzerlikleri ve çocuğun kendi yorumunu nazikçe değerlendir.`;
    }

    const response = await genAI.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { inlineData: { data: drawingBase64.split(',')[1], mimeType: 'image/png' } },
                { text: userPrompt }
            ]
        },
        config: {
            systemInstruction: systemPrompt + " Geri bildirimlerin her zaman pozitif ve geliştirici olmalı. Türkçe konuş."
        }
    });

    return response.text;
}
