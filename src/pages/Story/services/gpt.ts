import { StoryTheme } from '../components/types';

const STORY_PROMPT = (theme: StoryTheme): string => {
  // Temaya göre özelleştirilebilir içerikler burada hazırlanabilir
  const themeSpecificContent = {
    animals: 'Hayvanların özellikleri ve arkadaşlıkları hakkında',
    adventure: 'Macera dolu bir keşif yolculuğu hakkında',
    fantasy: 'Sihirli yaratıklar ve büyülü dünyalar hakkında',
    science: 'Bilimsel keşifler ve merak uyandıran deneyler hakkında',
    friendship: 'Arkadaşlığın önemi ve birlikte çalışmak hakkında',
    'life-lessons': 'Günlük hayattan öğrenilen dersler hakkında'
  };

  const promptText = `
7-12 yaş arası çocuklar için ${themeSpecificContent[theme]} bir hikaye yaz (100-200 kelime).
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

Yanıtı aşağıdaki JSON yapısında formatla:
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
}
`;
  return promptText;
};

const QUESTIONS_PROMPT = (story: { title: string; content: string }): string => {
  const promptText = `
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

Yanıtı aşağıdaki JSON yapısında formatla:
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
}
`;
  return promptText;
};

const IMAGE_PROMPT = (summary: string): string => {
  const promptText = `
Bu hikaye için bir resim oluştur:
${summary}

Resim şu özelliklere sahip olmalı:
- Çocuk dostu ve renkli
- Tüm karakterleri ve özelliklerini net gösteren
- Sahneyi ve ortamı detaylı yansıtan
- Hikayeyi yansıtan
- Dijital çizim tarzında
- Karakterlerin duygu ve hareketlerini belirgin gösteren
- Yazı içermeyen
`;
  return promptText;
};

async function generateImage(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GPT_API_KEY}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid"
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Resim oluşturma hatası: ${data.error?.message || 'Bilinmeyen hata'}`);
  }

  return data.data[0].url;
}

export async function generateStory(theme: StoryTheme) {
  const apiKey = import.meta.env.VITE_GPT_API_KEY;
  const apiEndpoint = import.meta.env.VITE_GPT_API_ENDPOINT;
  
  if (!apiKey || !apiEndpoint) {
    throw new Error('GPT API kimlik bilgileri eksik. Lütfen .env dosyasını kontrol edin.');
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'Sen yetenekli bir çocuk hikayesi yazarısın. Eğlenceli, eğitici ve çarpıcı başlıkları olan yaşa uygun hikayeler yarat. Başlıklar kısa, akılda kalıcı ve hikayenin özünü yansıtan nitelikte olmalı.'
          },
          {
            role: 'user',
            content: STORY_PROMPT(theme)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`GPT API Hatası: ${responseData.error?.message || 'Bilinmeyen hata'}`);
    }

    if (!responseData.choices?.[0]?.message?.content) {
      throw new Error('GPT API geçersiz yanıt döndürdü');
    }

    const storyData = JSON.parse(responseData.choices[0].message.content);
    
    // Veri doğrulama
    if (!storyData || typeof storyData !== 'object') {
      throw new Error('GPT yanıtı geçerli bir JSON nesnesi değil');
    }

    if (!storyData.title || !storyData.content || !storyData.summary) {
      throw new Error('GPT yanıtında gerekli alanlar eksik');
    }
    
    // Resim oluştur
    const imageUrl = await generateImage(IMAGE_PROMPT(storyData.summary));
    
    // Soruları oluştur
    const questionsResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'Sen bir eğitim uzmanısın. Çocuklar için uygun, eğitici ve eğlenceli sorular hazırla.'
          },
          {
            role: 'user',
            content: QUESTIONS_PROMPT({ title: storyData.title, content: storyData.content })
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    if (!questionsResponse.ok) {
      throw new Error(`Sorular oluşturulurken hata: ${questionsResponse.statusText}`);
    }

    const questionsResponseData = await questionsResponse.json();
    
    if (!questionsResponseData.choices?.[0]?.message?.content) {
      throw new Error('Sorular için GPT API geçersiz yanıt döndürdü');
    }

    let questionsData;
    try {
      questionsData = JSON.parse(questionsResponseData.choices[0].message.content);
    } catch (error) {
      throw new Error('Sorular için GPT yanıtı geçerli JSON formatında değil');
    }

    if (!questionsData || !Array.isArray(questionsData.questions)) {
      throw new Error('Sorular için GPT yanıtı geçersiz format içeriyor');
    }
    
    const questions = questionsData.questions;

    // Soru formatını doğrula
    for (const question of questions) {
      if (!question.text || !Array.isArray(question.options) || 
          question.options.length !== 4 || typeof question.correctAnswer !== 'number' ||
          !question.feedback?.correct || !question.feedback?.incorrect) {
        throw new Error('Soru formatı geçersiz');
      }
    }

    return {
      ...storyData,
      image_url: imageUrl,
      questions,
      theme // Seçilen temayı ekle
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('GPT yanıtı geçerli JSON formatında değil: ' + error.message);
    }
    throw error instanceof Error ? error : new Error('Hikaye oluşturulurken beklenmeyen bir hata oluştu');
  }
}

export interface Story {
  id: string;
  title: string;
  animalInfo?: string;
  content: string;
  summary: string;
  theme: StoryTheme;
  image_url: string;
  questions: Array<{
    text: string;
    options: string[];
    correctAnswer: number;
    feedback: {
      correct: string;
      incorrect: string;
    }
  }>;
}