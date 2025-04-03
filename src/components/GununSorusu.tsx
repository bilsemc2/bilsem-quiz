import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  question_number: number;
  correct_option_id: string;
  image_url?: string;
  solution_video?: any;
  is_active: boolean;
}

const GununSorusu: React.FC = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  // Günün tarihine göre sabit bir soru seçmek için
  const getTodaysSeed = () => {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  };

  // Günün sorusunu yükle
  useEffect(() => {
    const fetchDailyQuestion = async () => {
      setLoading(true);
      try {
        // Bugünün tarihine göre sabit bir sıra belirle
        const todaySeed = getTodaysSeed();
        
        // Aktif sorulardan birini seç
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('is_active', true)
          .order('question_number', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Günün tarihine göre belirli bir soruyu seç
          const index = todaySeed % data.length;
          setQuestion(data[index]);
        } else {
          console.log('Hiç soru bulunamadı');
        }
      } catch (error) {
        console.error('Günün sorusu yüklenirken hata:', error);
        toast.error('Günün sorusu yüklenirken bir hata oluştu', {
          description: 'Lütfen daha sonra tekrar deneyin.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDailyQuestion();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Bugün için soru bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Soru içeriği */}
      <div className="mb-4">
        {question.text && (
          <p className="text-gray-800 mb-4">{question.text}</p>
        )}
        
        {question.image_url && (
          <div className="mb-4 flex justify-center">
            <img 
              src={question.image_url} 
              alt={`Soru ${question.question_number}`}
              className="max-w-full h-auto rounded-lg shadow-md"
              style={{ maxHeight: '300px' }}
            />
          </div>
        )}
      </div>

      <div className="mt-4 text-right">
        <div className="text-gray-500 text-sm">
          Soru #{question.question_number}
        </div>
      </div>
    </div>
  );
};

export default GununSorusu;