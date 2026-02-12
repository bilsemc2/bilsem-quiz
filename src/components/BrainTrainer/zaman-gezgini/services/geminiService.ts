import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTeacherFeedback = async (
  isCorrect: boolean,
  originalTime: string,
  targetOffset: number,
  userTime: string
): Promise<string> => {
  try {
    const prompt = `
      Sen ilkokul öğrencilerine saati öğreten neşeli ve cesaretlendirici bir öğretmensin. Adın "Zaman Ustası".
      
      Durum:
      Öğrenciye şu soru soruldu: "Saat ${originalTime}. ${targetOffset} dakika sonrası kaçtır?"
      Öğrencinin cevabı: ${userTime}.
      Sonuç: ${isCorrect ? "DOĞRU" : "YANLIŞ"}.

      Görev:
      Türkçe olarak tek bir cümlelik bir geri bildirim ver.
      - Eğer doğruysa: Tebrik et, eğlenceli bir emoji kullan.
      - Eğer yanlışsa: Nazikçe hatayı söyle ve tekrar denemesi için cesaretlendir. Asla cevabı doğrudan söyleme, ipucu ver.
      
      Örnekler:
      "Harikasın! Yelkovanı tam olması gereken yere getirdin! 🎉"
      "Biraz yaklaştın ama tam olmadı, yelkovanı ${targetOffset} dakika ileri sayarak tekrar dener misin? 🤔"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || (isCorrect ? "Harika iş! 🎉" : "Tekrar dene, başarabilirsin! 💪");
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback if API fails
    return isCorrect 
      ? "Tebrikler! Doğru cevap! 🌟" 
      : "Üzgünüm, yanlış cevap. Tekrar dene! 🤔";
  }
};