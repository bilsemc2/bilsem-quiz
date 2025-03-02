export type StoryTheme = 'animals' | 'adventure' | 'fantasy' | 'science' | 'friendship' | 'life-lessons';

export interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  feedback: {
    correct: string;
    incorrect: string;
  }
}

export interface Story {
  id: string;
  title: string;
  content: string;
  summary: string;
  theme: StoryTheme;
  image_url: string;
  audio_url?: string;
  animalInfo?: string;
  questions: Question[];
  created_at: string;
}

export const themeTranslations: Record<StoryTheme, string> = {
  animals: 'Hayvanlar',
  adventure: 'Macera',
  fantasy: 'Fantastik',
  science: 'Bilim',
  friendship: 'Arkadaşlık',
  'life-lessons': 'Hayat Dersleri'
};
