import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    defaultHeaders: {
        'OpenAI-Organization': 'org-obCYAhI7DTQ9Ka33IiMPBLUt'
    },
    dangerouslyAllowBrowser: true
});

interface ImageAnalysisResult {
    feedback: string;
    scores: {
        composition: number;
        lines: number;
        perspective: number;
        proportions: number;
        creativity: number;
        totalScore: number;
    };
}

export async function analyzeImage(imageUrl: string, words: string[]): Promise<ImageAnalysisResult> {
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

1. Verilen Kelimelerin Kullanımı:
- Kelimelerin resimde nasıl yorumlandığı
- Kelimeler arası bağlantılar ve uyum
- Kavramların görsel ifadesi

2. Kompozisyon ve Yaratıcılık:
- Kompozisyon düzeni ve denge
- Yaratıcı yaklaşımlar ve özgünlük
- Renk ve form kullanımı
- Hikaye anlatımı

3. Görsel Anlatım:
- Teknik beceri ve uygulama
- Detaylar ve özen
- Genel etki ve sunum
- Görsel bütünlük

Ayrıca, aşağıdaki kriterlere göre 100 üzerinden puanlama yap:
1. Kompozisyon (20 puan)
2. Çizgi (20 puan)
3. Perspektif (10 puan)
4. Oran-Orantı (20 puan)
5. Yaratıcılık (30 puan)

Her bölüm için detaylı ve yapıcı geri bildirim ver.
Öğrenciyi motive edici ve cesaretlendirici bir dil kullan.
Olumlu yönleri vurgula ve geliştirilebilecek alanlar için nazik öneriler sun.
Her bölümü ayrı paragraflar halinde yaz.
Puanları ayrı bir bölümde listele.
Cevabını Türkçe olarak ver.

Yanıtını şu formatta ver:
[FEEDBACK]
(Detaylı geri bildirim metni buraya)
[/FEEDBACK]

[SCORES]
Kompozisyon: (puan)
Çizgi: (puan)
Perspektif: (puan)
Oran-Orantı: (puan)
Yaratıcılık: (puan)
[/SCORES]`
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
            max_tokens: 1000
        });

        const content = response.choices[0]?.message?.content || '';
        
        // Parse feedback and scores from the response
        const feedbackMatch = content.match(/\[FEEDBACK\]([\s\S]*?)\[\/FEEDBACK\]/);
        const scoresMatch = content.match(/\[SCORES\]([\s\S]*?)\[\/SCORES\]/);
        
        const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Geri bildirim alınamadı.';
        const scoresText = scoresMatch ? scoresMatch[1].trim() : '';
        
        // Parse individual scores
        const scores = {
            composition: 0,
            lines: 0,
            perspective: 0,
            proportions: 0,
            creativity: 0,
            totalScore: 0
        };

        if (scoresText) {
            const scoreLines = scoresText.split('\n');
            scoreLines.forEach(line => {
                const [criterion, scoreStr] = line.split(':').map(s => s.trim());
                const score = parseInt(scoreStr) || 0;
                
                switch(criterion.toLowerCase()) {
                    case 'kompozisyon':
                        scores.composition = score;
                        break;
                    case 'çizgi':
                        scores.lines = score;
                        break;
                    case 'perspektif':
                        scores.perspective = score;
                        break;
                    case 'oran-orantı':
                        scores.proportions = score;
                        break;
                    case 'yaratıcılık':
                        scores.creativity = score;
                        break;
                }
            });
        }

        // Calculate total score
        scores.totalScore = (scores.composition + scores.lines + scores.perspective + 
                           scores.proportions + scores.creativity);

        return {
            feedback,
            scores
        };
    } catch (error) {
        console.error('Error analyzing image:', error);
        return {
            feedback: 'Resim analizi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            scores: {
                composition: 0,
                lines: 0,
                perspective: 0,
                proportions: 0,
                creativity: 0,
                totalScore: 0
            }
        };
    }
}
