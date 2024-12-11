import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    defaultHeaders: {
        'OpenAI-Organization': 'org-obCYAhI7DTQ9Ka33IiMPBLUt'
    },
    dangerouslyAllowBrowser: true
});

export async function analyzeImage(imageUrl: string, words: string[]): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            text: `Bu resim bir öğrenci tarafından şu kelimeler kullanılarak oluşturuldu: ${words.join(', ')}. 
                            Lütfen resmi analiz et ve şu kriterlere göre değerlendir:
                            1. Verilen kelimelerin resimde nasıl kullanıldığı
                            2. Kompozisyon ve yaratıcılık
                            3. Görsel anlatım gücü
                            
                            Değerlendirmeyi öğrenciyi motive edici ve yapıcı bir dille yap. 
                            Cevabını Türkçe olarak ver.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                                detail: "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500
        });

        return response.choices[0]?.message?.content || 'Resim analizi yapılamadı.';
    } catch (error) {
        console.error('Error analyzing image:', error);
        return 'Resim analizi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
    }
}
