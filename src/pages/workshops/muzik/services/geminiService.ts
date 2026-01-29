// Frontend service to call Gemini API via Supabase Edge Function
// This keeps the API key secure on the server side

import { supabase } from '../../../../lib/supabase';
import { AIAnalysisResponse, TestType } from '../types';

export const analyzeMusicPerformance = async (
  testType: TestType,
  target: unknown,
  detected: unknown
): Promise<AIAnalysisResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: {
        action: 'analyzeMusicPerformance',
        testType,
        target,
        detected
      }
    });

    if (error) {
      console.error('Edge Function Error:', error);
      throw error;
    }

    return data.result as AIAnalysisResponse;
  } catch (error) {
    console.error('Music Analysis Error:', error);
    return {
      score: 0,
      accuracy: 0,
      feedback: {
        strengths: [],
        improvements: ['Bağlantı hatası oluştu'],
        tips: ['Lütfen internet bağlantınızı kontrol edin']
      },
      encouragement: 'Bağlantını kontrol edip tekrar dene.',
      detailedAnalysis: 'Sistem analizi şu an gerçekleştiremiyor.'
    };
  }
};
