import { Story, StoryTheme, Question } from '../components/types';
import { supabase } from '../../../lib/supabase';

// Yerel depolama için anahtar
const STORIES_KEY = 'local_stories';



/** Fisher-Yates shuffle: seçenekleri karıştırıp correctAnswer indeksini günceller */
export function shuffleQuestionOptions<T extends { options: string[]; correctAnswer: number }>(question: T): T {
  const options = [...question.options];
  const correctOption = options[question.correctAnswer];

  // Fisher-Yates shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    ...question,
    options,
    correctAnswer: options.indexOf(correctOption)
  };
}

export async function saveStory(story: {
  title: string;
  content: string;
  animalInfo?: string;
  summary: string;
  theme: StoryTheme;
  image_url: string;
  questions: Array<{
    id?: string;
    aiGeneratedQuestionId?: string;
    text: string;
    options: string[];
    correctAnswer: number;
    feedback: {
      correct: string;
      incorrect: string;
    }
  }>;
}): Promise<Story> {
  try {
    // Supabase bağlantısını başlat
    const currentUser = supabase.auth.getUser();
    const userData = await currentUser;


    // Hikayeyi Supabase'e kaydet ve ID'sini al
    const { data: insertedStory, error: insertError } = await supabase
      .from('story')
      .insert({
        title: story.title,
        content: story.content,
        theme: story.theme,
        age_range: '7-12',
        is_active: true,
        image_path: story.image_url,
        created_by: userData.data?.user?.id || null
      })
      .select()
      .single();

    if (insertError || !insertedStory) {
      console.error('Supabase hikaye kayıt hatası:', insertError);
      throw insertError || new Error('Hikaye kaydedilemedi');
    }

    const storyId = insertedStory.id;

    // Soruları kaydet
    if (story.questions && story.questions.length > 0) {

      const questionInserts = story.questions.map((question) => {
        return {
          story_id: storyId,
          question_text: question.text,
          options: question.options,
          correct_option: question.options[question.correctAnswer],
          difficulty_level: 'normal'
        };
      });


      const { error: questionsError } = await supabase
        .from('story_questions')
        .insert(questionInserts)
        .select();

      if (questionsError) {
        console.error('[saveStory] Soru kayıt HATASI:', questionsError);
        throw new Error(`Sorular kaydedilemedi: ${questionsError.message}`);
      }

    } else {
    }

    // Tam nesneyi oluştur
    const newStory: Story = {
      id: storyId,
      title: story.title,
      content: story.content,
      summary: story.summary,
      theme: story.theme,
      image_url: story.image_url,
      animalInfo: story.animalInfo,
      questions: story.questions,
      created_at: insertedStory.created_at || new Date().toISOString()
    };

    // Local storage'a yedek olarak kaydet
    const stories = getStoriesFromLocalStorage();
    stories.push(newStory);
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));

    return newStory;
  } catch (error) {
    console.error('Hikaye kaydedilirken bir hata oluştu:', error);

    // Supabase'e kaydedilemezse sadece local storage'a kaydet
    const stories = getStoriesFromLocalStorage();

    const newStory: Story = {
      id: crypto.randomUUID(),
      ...story,
      created_at: new Date().toISOString()
    };

    stories.push(newStory);
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));

    return newStory;
  }
}

export async function getStories(): Promise<Story[]> {
  try {
    // Önce Supabase'den hikayeleri alma
    const { data: storyData, error: storyError } = await supabase
      .from('story')
      .select('*')
      .order('created_at', { ascending: false });

    if (storyError) {
      console.error('Supabase hikaye alma hatası:', storyError);
      // Hata durumunda yerel depolamaya geri dön
      return getStoriesFromLocalStorage();
    }

    if (storyData && storyData.length > 0) {
      // Her hikaye için soruları çek
      const stories: Story[] = await Promise.all(
        storyData.map(async (storyItem) => {
          // Hikayenin sorularını çek
          const { data: questionData, error: questionError } = await supabase
            .from('story_questions') // Çoğul: story_questions
            .select('*')
            .eq('story_id', storyItem.id);

          let questions: Question[] = [];

          if (questionData && !questionError) {
            // Soru verilerini formatla
            questions = questionData.map(q => {
              // options dizisini al
              const options: string[] = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;

              // Doğru cevabın indeksini bul
              const correctAnswer: number = options.findIndex((option: string) => option === q.correct_option);

              return shuffleQuestionOptions({
                id: q.id,
                aiGeneratedQuestionId: q.ai_generated_question_id || undefined,
                text: q.question_text,
                options: options,
                correctAnswer: correctAnswer >= 0 ? correctAnswer : 0,
                feedback: {
                  correct: 'Doğru cevap!',
                  incorrect: 'Tekrar deneyin.'
                }
              });
            });
          }

          // Story nesnesini oluştur
          return {
            id: storyItem.id,
            title: storyItem.title,
            content: storyItem.content,
            theme: storyItem.theme as StoryTheme,
            image_url: storyItem.image_path ? (storyItem.image_path.startsWith('/') ? storyItem.image_path : '/' + storyItem.image_path) : '',
            summary: '', // Veritabanında yok, varsayılan boş değer
            questions,
            created_at: storyItem.created_at
          };
        })
      );

      return stories;
    }

    // Supabase'den veri gelmediğinde yerel depolamadan al
    return getStoriesFromLocalStorage();
  } catch (error) {
    console.error('Hikayeler yüklenirken hata oluştu:', error);
    // Herhangi bir hata durumunda yerel depolamadan getir
    return getStoriesFromLocalStorage();
  }
}

function getStoriesFromLocalStorage(): Story[] {
  try {
    const storiesJson = localStorage.getItem(STORIES_KEY);
    if (!storiesJson) return [];

    const stories = JSON.parse(storiesJson);
    if (!Array.isArray(stories)) return [];

    return stories;
  } catch (error) {
    console.error('Hikayeler yüklenirken hata oluştu:', error);
    return [];
  }
}

export async function saveStoryQuestions(storyId: string, questions: Array<{
  id?: string;
  aiGeneratedQuestionId?: string;
  text: string;
  options: string[];
  correctAnswer: number;
  feedback: { correct: string; incorrect: string; };
}>): Promise<void> {
  if (!questions || questions.length === 0) return;

  try {
    const questionInserts = questions.map((question) => {
      return {
        story_id: storyId,
        question_text: question.text,
        options: question.options,
        correct_option: question.options[question.correctAnswer],
        difficulty_level: 'normal'
      };
    });

    const { error } = await supabase
      .from('story_questions')
      .insert(questionInserts);

    if (error) {
      console.error('Soru kayıt hatası:', error);
    }
  } catch (error) {
    console.error('Sorular kaydedilirken hata:', error);
  }
}

