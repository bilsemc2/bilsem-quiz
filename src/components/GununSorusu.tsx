import React, { useState, useEffect, useCallback } from 'react';
import {
  loadDailyQuestion,
  type DailyQuestion
} from '@/features/content/model/dailyQuestionUseCases';
import { toast } from 'sonner';
import { encryptImageUrl, loadImageAsBase64, getImageProtectionStyles } from '../utils/imageProtection';

const GununSorusu: React.FC = () => {
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);

  // Resmi Base64 formatında yükle
  const loadQuestionImage = useCallback(async (imageUrl: string) => {
    if (!imageUrl) return;

    setImageLoading(true);
    try {
      const secureUrl = encryptImageUrl(imageUrl);
      const base64Data = await loadImageAsBase64(secureUrl);
      setImageBase64(base64Data);
    } catch (error) {
      console.error('Resim yüklenirken hata:', error);
    } finally {
      setImageLoading(false);
    }
  }, []);

  // Günün sorusunu yükle
  useEffect(() => {
    const fetchDailyQuestion = async () => {
      setLoading(true);
      try {
        const dailyQuestion = await loadDailyQuestion();
        setQuestion(dailyQuestion);

        if (dailyQuestion?.image_url) {
          loadQuestionImage(dailyQuestion.image_url);
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
  }, [loadQuestionImage]);

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
      <style>{getImageProtectionStyles()}</style>
      {/* Soru içeriği */}
      <div className="mb-4">
        {question.text && (
          <p className="text-gray-800 mb-4">{question.text}</p>
        )}

        {question.image_url && (
          <div className="mb-4 flex justify-center relative overflow-hidden rounded-lg">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-3 grid-rows-3 place-items-center select-none"
            >
              {Array.from({ length: 9 }, (_, index) => (
                <span key={index} className="-rotate-[20deg] text-sm font-black tracking-[0.2em] text-black/10">
                  BILSEMC2
                </span>
              ))}
            </div>
            {imageLoading ? (
              <div className="animate-pulse bg-gray-200 rounded-lg" style={{ width: '300px', height: '200px' }} />
            ) : imageBase64 ? (
              <img
                src={imageBase64}
                alt={`Soru ${question.question_number}`}
                className="max-w-full h-auto rounded-lg shadow-md protected-image"
                style={{ maxHeight: '300px' }}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                draggable="false"
              />
            ) : (
              <img
                src={encryptImageUrl(question.image_url)}
                alt={`Soru ${question.question_number}`}
                className="max-w-full h-auto rounded-lg shadow-md protected-image"
                style={{ maxHeight: '300px' }}
                loading="lazy"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                draggable="false"
              />
            )}
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
