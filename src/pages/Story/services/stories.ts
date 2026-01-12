import { Story, StoryTheme, Question } from '../components/types';
import { supabase } from '../../../lib/supabase';

// Yerel depolama için anahtar
const STORIES_KEY = 'local_stories';

export async function saveStory(story: {
  title: string;
  content: string;
  animalInfo?: string;
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
}): Promise<Story> {
  try {
    // Supabase bağlantısını başlat
    const currentUser = supabase.auth.getUser();
    const userData = await currentUser;

    console.log('Hikaye kaydediliyor:', story);
    console.log('Tema:', story.theme);

    // Hikayeyi Supabase'e kaydet ve ID dönmesini gerektirmeden kayıt yapalım
    const { error: insertError } = await supabase
      .from('story')
      .insert({
        title: story.title,
        content: story.content,
        theme: story.theme,
        age_range: '7-12', // Varsayılan yaş aralığı
        is_active: true,
        image_path: story.image_url,
        // Oturum açıldığında user ID'si ekle
        created_by: userData.data?.user?.id || null
      });

    if (insertError) {
      console.error('Supabase hikaye kayıt hatası:', insertError);
      throw insertError;
    }

    // İnsert işlemi başarılı olduktan sonra son eklenen hikayeyi sorgula
    const { data: latestStory, error: selectError } = await supabase
      .from('story')
      .select('*')
      .eq('title', story.title)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (selectError) {
      console.error('Kaydedilen hikaye bulunamadı:', selectError);
      // Bu noktada hikaye kaydedildi ama ID bulunamadı, geçici bir ID döndürebiliriz
      // Kullanıcı deneyimini bozmamak için geçici bir ID oluşturup devam ediyoruz
      return {
        id: `temp-${Date.now()}`,
        title: story.title,
        content: story.content,
        summary: story.summary,
        theme: story.theme,
        image_url: story.image_url,
        questions: story.questions,
        created_at: new Date().toISOString()
      };
    }

    if (!latestStory) {
      console.error('Kaydedilen hikaye verisi bulunamadı');
      // Geçici ID oluşturup devam edelim
      return {
        id: `temp-${Date.now()}`,
        title: story.title,
        content: story.content,
        summary: story.summary,
        theme: story.theme,
        image_url: story.image_url,
        questions: story.questions,
        created_at: new Date().toISOString()
      };
    }

    console.log('Kaydedilen hikaye bulundu:', latestStory);
    const storyId = latestStory.id;

    // Soruları kaydet
    if (story.questions && story.questions.length > 0) {
      // Tüm soruları hazırla
      const questionInserts = story.questions.map(question => ({
        story_id: storyId,
        question_text: question.text,
        options: question.options, // JSONB olarak kabul edecek
        correct_option: question.options[question.correctAnswer], // Doğru cevabı indeks yerine string olarak saklıyoruz
        difficulty_level: 'normal' // Varsayılan zorluk seviyesi
      }));

      // Soruları toplu olarak ekle
      const { error: questionsError } = await supabase
        .from('story_questions') // Çoğul: story_questions
        .insert(questionInserts);

      if (questionsError) {
        console.error('Supabase soru kayıt hatası:', questionsError);
        // Sorular kaydedilemese bile hikaye kaydedildi
      }
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
      created_at: latestStory?.created_at || new Date().toISOString()
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

              return {
                text: q.question_text,
                options: options,
                correctAnswer: correctAnswer >= 0 ? correctAnswer : 0,
                feedback: {
                  correct: 'Doğru cevap!',
                  incorrect: 'Tekrar deneyin.'
                }
              };
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