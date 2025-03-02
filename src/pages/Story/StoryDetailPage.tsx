import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStories } from './services/stories';
import { Story } from './types';
import { StoryViewer } from './components/StoryViewer';
import { QuizSection } from './components/QuizSection';

export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    async function loadStory() {
      try {
        const stories = await getStories();
        const foundStory = stories.find(s => s.id === id);
        
        if (foundStory) {
          setStory(foundStory);
        } else {
          setError('Hikaye bulunamadı');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hikaye yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadStory();
    } else {
      setError('Geçersiz hikaye ID');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error || 'Hikaye bulunamadı'}
        </div>
        <button
          onClick={() => navigate('/stories')}
          className="mt-4 text-purple-600 hover:text-purple-800 font-medium flex items-center gap-2"
        >
          ← Hikayelere Dön
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {showQuiz ? (
        <QuizSection 
          questions={story.questions} 
          onBackToStory={() => setShowQuiz(false)}
          onComplete={() => {}}
        />
      ) : (
        <StoryViewer
          story={story}
          onNext={() => setShowQuiz(true)}
        />
      )}
    </div>
  );
}
