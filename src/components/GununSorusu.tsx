import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { encryptImageUrl, loadImageAsBase64, getImageProtectionStyles } from '../utils/imageProtection';

interface Question {
  id: string;
  text: string;
  question_number: number;
  correct_option_id: string;
  image_url?: string;
  solution_video?: string | null;
  is_active: boolean;
}

const GununSorusu: React.FC = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const watermarkRef = useRef<HTMLDivElement>(null);
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

          // Eğer resim varsa, Base64 formatında yükle
          if (data[index].image_url) {
            loadQuestionImage(data[index].image_url);
          }
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

    // Koruma CSS'ini ekle
    const style = document.createElement('style');
    style.textContent = getImageProtectionStyles();
    document.head.appendChild(style);

    // Temizleme fonksiyonu
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Resmi Base64 formatında yükle
  const loadQuestionImage = async (imageUrl: string) => {
    if (!imageUrl) return;

    setImageLoading(true);
    try {
      // Resmi güvenli URL ile yükle
      const secureUrl = encryptImageUrl(imageUrl);
      const base64Data = await loadImageAsBase64(secureUrl);
      setImageBase64(base64Data);

      // Filigran ekle
      setTimeout(addWatermark, 500);
    } catch (error) {
      console.error('Resim yüklenirken hata:', error);
    } finally {
      setImageLoading(false);
    }
  };

  // Filigran ekle
  const addWatermark = () => {
    if (!watermarkRef.current) return;

    const container = watermarkRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Canvas boyutunu ayarla
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    // Yarı saydam filigran metni
    ctx.globalAlpha = 0.2;
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';

    // Filigran metnini eğimli olarak yerleştir
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6); // -30 derece eğim

    // Filigran metnini tekrarla
    const text = '';
    const textWidth = ctx.measureText(text).width;

    for (let y = -canvas.height; y < canvas.height; y += 40) {
      for (let x = -canvas.width; x < canvas.width; x += textWidth + 40) {
        ctx.fillText(text, x, y);
      }
    }

    ctx.restore();

    // Canvas'ı arka plan olarak ayarla
    container.style.position = 'relative';
    const watermarkElement = document.createElement('div');
    watermarkElement.style.position = 'absolute';
    watermarkElement.style.top = '0';
    watermarkElement.style.left = '0';
    watermarkElement.style.width = '100%';
    watermarkElement.style.height = '100%';
    watermarkElement.style.backgroundImage = `url(${canvas.toDataURL('image/png')})`;
    watermarkElement.style.pointerEvents = 'none';
    watermarkElement.style.zIndex = '2';

    // Önceki filigranı temizle ve yenisini ekle
    const oldWatermark = container.querySelector('.watermark');
    if (oldWatermark) {
      container.removeChild(oldWatermark);
    }

    watermarkElement.className = 'watermark';
    container.appendChild(watermarkElement);
  };

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
          <div className="mb-4 flex justify-center relative" ref={watermarkRef}>
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