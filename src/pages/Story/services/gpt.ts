import { StoryTheme } from '../components/types';
import { supabase } from '../../../lib/supabase';

// Supabase Edge Function URL
const getEdgeFunctionUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/gemini-proxy`;
};

export async function generateStory(theme: StoryTheme) {
  try {
    // Get the auth session for the function call
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'generateStory',
        theme
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Hikaye oluşturulurken bir hata oluştu');
    }

    const data = await response.json();
    const storyData = data.result;

    // Validate the response
    if (!storyData || typeof storyData !== 'object') {
      throw new Error('Geçersiz hikaye verisi');
    }

    if (!storyData.title || !storyData.content || !storyData.summary) {
      throw new Error('Hikaye verilerinde gerekli alanlar eksik');
    }

    // Validate questions
    if (!storyData.questions || !Array.isArray(storyData.questions)) {
      throw new Error('Hikaye sorularında hata');
    }

    // Validate each question format
    for (const question of storyData.questions) {
      if (!question.text || !Array.isArray(question.options) ||
        question.options.length !== 4 || typeof question.correctAnswer !== 'number' ||
        !question.feedback?.correct || !question.feedback?.incorrect) {
        throw new Error('Soru formatı geçersiz');
      }
    }

    return {
      ...storyData,
      image_url: '', // Resim oluşturma şu an için devre dışı
      theme
    };
  } catch (error) {
    console.error('Hikaye oluşturma hatası:', error);
    throw error instanceof Error ? error : new Error('Hikaye oluşturulurken beklenmeyen bir hata oluştu');
  }
}

export async function generateQuestions(story: { title: string; content: string }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'generateQuestions',
        story
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Sorular oluşturulurken bir hata oluştu');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Soru oluşturma hatası:', error);
    throw error instanceof Error ? error : new Error('Sorular oluşturulurken beklenmeyen bir hata oluştu');
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