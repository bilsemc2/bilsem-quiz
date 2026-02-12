import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface LevelFlavor {
  title: string;
  hint: string;
}

export const getLevelFlavor = async (level: number): Promise<LevelFlavor> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, mystical, and slightly humorous title and a 5-word cryptic hint for "Level ${level}" of a difficult maze game. 
      The higher the level, the more ominous the title should be.
      
      Return ONLY valid JSON in this format:
      {
        "title": "The Void of despair",
        "hint": "Turn left at the shadow."
      }`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as LevelFlavor;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: `Level ${level}`,
      hint: "Find the path, avoid the walls."
    };
  }
};