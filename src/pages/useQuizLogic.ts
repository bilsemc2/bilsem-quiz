// src/pages/useQuizLogic.ts
import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useQuizState } from '../hooks/useQuizState';
import { useQuizFeedback } from '../hooks/useQuizFeedback';
import { useQuizTimer } from '../hooks/useQuizTimer';
import { handleQuizComplete } from '../utils/quizHandlers';
import { generateQuiz } from '../utils/quizGenerator';
import { shuffleArray } from '../utils/arrayUtils';
import { User } from '@supabase/supabase-js';  // senin user tipin

interface UseQuizLogicProps {
  user: User | null; 
  onComplete?: (score: number, totalQuestions: number) => void;
  navigate: (path: string, options?: any) => void;
}

export function useQuizLogic({ user, onComplete, navigate }: UseQuizLogicProps) {
  // *** STATE ***
  const [userXP, setUserXP] = useState<number>(0);
  const [requiredXP, setRequiredXP] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // *** QUIZ HOOKS *** (mevcut hook'ların)
  const [quizState, quizActions] = useQuizState();
  const [feedbackState, feedbackActions] = useQuizFeedback();
  
  // Timer, 60 saniye gibi
  const handleTimeout = useCallback(() => {
    // Timer bittiğinde buraya girebilirsin
    // istersen quizState'i güncelle veya feedback yolla
    quizActions.setIsTimeout(true);
  }, [quizActions]);

  const [timerState, timerActions] = useQuizTimer(60, handleTimeout);

  // *** XP KONTROLÜ ***
  const loadUserXP = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('experience')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      
      setUserXP(profile?.experience || 0);
    } catch (err) {
      console.error('XP kontrolü yapılırken hata:', err);
    }
  }, [user]);

  // *** QUIZ BAŞLATMA ***
  const initQuiz = useCallback(async () => {
    setLoading(true);
    try {
      await loadUserXP();
      
      // Timer'ı başlat
      timerActions.resetTimer();
      timerActions.startTimer();
      
      // Quiz state'ini sıfırla
      quizActions.resetQuizState();
      
      // Quiz'i yükle
      const savedQuiz = localStorage.getItem('currentQuiz');
      if (savedQuiz) {
        try {
          const parsedQuiz = JSON.parse(savedQuiz);
          if (!parsedQuiz.questions || !Array.isArray(parsedQuiz.questions)) {
            throw new Error('Geçersiz quiz formatı');
          }
          quizActions.setQuiz(parsedQuiz);
          localStorage.removeItem('currentQuiz');
        } catch (error) {
          console.error('Kaydedilmiş quiz yüklenirken hata:', error);
          // Hata durumunda yeni quiz oluştur
          const quizData = await generateQuiz(10);
          quizActions.setQuiz(quizData);
        }
      } else {
        // Normal quiz oluştur
        const quizData = await generateQuiz(10);
        quizActions.setQuiz(quizData);
      }
      
    } catch (error) {
      console.error('Quiz başlatılırken hata:', error);
      feedbackActions.showFeedback({
        type: 'error',
        message: 'Quiz başlatılırken bir hata oluştu. Lütfen sayfayı yenileyin.'
      });
    } finally {
      setLoading(false);
    }
  }, [loadUserXP, timerActions, quizActions, feedbackActions]);

  // *** QUIZ TAMAMLANDIĞINDA ***
  const onQuizComplete = useCallback(() => {
    if (quizState.quiz && user) {
      handleQuizComplete(
        quizState.quiz,
        quizState.score,
        user,
        supabase,
        onComplete,
        navigate
      );
    }
  }, [quizState.quiz, quizState.score, user, onComplete, navigate]);

  // *** SEÇENEK SEÇİLDİĞİNDE ***
  const handleOptionSelect = useCallback((optionId: string) => {
    if (quizState.isAnswered || quizState.isTimeout) return;
    
    // Timer'ı durdur
    timerActions.stopTimer();
    
    // Seçimi işle
    quizActions.selectOption(optionId);
    
    // Doğru/yanlış kontrolü
    const isCorrect = optionId === quizState.currentQuestion?.correctOptionId;
    
    // Feedback göster
    feedbackActions.showFeedback({
      type: isCorrect ? 'success' : 'error',
      message: isCorrect ? 'Doğru!' : 'Yanlış cevap...'
    });
  }, [quizState, quizActions, timerActions, feedbackActions]);

  // *** SONRAKİ SORUYA GEÇ ***
  const handleNextQuestion = useCallback(() => {
    // Feedback'i kapat
    feedbackActions.hideFeedback();
    
    if (quizState.isLastQuestion) {
      onQuizComplete();
      return;
    }
    
    // Sonraki soruya geç
    quizActions.setCurrentQuestionIndex(quizState.currentQuestionIndex + 1);
    quizActions.setIsAnswered(false);
    quizActions.setSelectedOption(null);
    
    // Timer'ı yeniden başlat
    timerActions.resetTimer();
    timerActions.startTimer();
  }, [
    quizState.currentQuestionIndex,
    quizState.isLastQuestion,
    quizActions,
    timerActions,
    feedbackActions,
    onQuizComplete
  ]);

  // *** ETKİLEŞİMLER / EK USEEFFECT ***
  // Örnek: Sorunun tam bitişinde timer'ı durdurmak veya
  //        anlık kontrol yapmak istersen

  useEffect(() => {
    // isAnswered false ve timer çalışmıyorsa -> Timer'ı başlat
    if (!quizState.isAnswered && !timerState.isRunning) {
      timerActions.startTimer();
    }
  }, [quizState.isAnswered, timerState.isRunning, timerActions]);

  // *** DÖNÜŞ ***
  return {
    // Ekranda kullanacağımız state
    quizState,
    feedbackState,
    userXP,
    requiredXP,
    loading,
    handleOptionSelect,
    onQuizComplete,
    handleNextQuestion,
    timerState,
    initQuiz,
  };
}