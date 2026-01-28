import { Question, QuizOption } from '../types/quiz';

export const fetchQuestionFromStorage = async (questionNumber: number): Promise<Question | null> => {
  try {
    // Soru görseli
    const questionUrl = `/src/images/questions/Matris/Soru-${questionNumber}.webp`;

    // Normal seçenek görselleri (yanlış cevaplar)
    const optionLetters = ['A', 'B', 'C', 'D', 'E'];
    const optionUrls = optionLetters.map(letter =>
      `/src/images/options/Matris/${questionNumber}/Soru-${questionNumber}${letter}.webp`
    );

    // Doğru cevap görselini bul
    const correctAnswerUrl = `/src/images/options/Matris/${questionNumber}/Soru-cevap-${questionNumber}D.webp`;
    const correctAnswer = correctAnswerUrl.match(/[A-E]\.webp$/)?.[0][0] || 'D';

    // Doğru cevabı options dizisine ekle
    const correctIndex = 'ABCDE'.indexOf(correctAnswer);
    if (correctIndex !== -1) {
      optionUrls[correctIndex] = correctAnswerUrl;
    }

    // QuizOption[] formatına dönüştür
    const options: QuizOption[] = optionLetters.map((letter, idx) => ({
      id: letter,
      text: '',
      imageUrl: optionUrls[idx],
      isCorrect: letter === correctAnswer,
    }));

    return {
      id: String(questionNumber),
      questionImageUrl: questionUrl,
      question: '',
      options,
      correctOptionId: correctAnswer,
      points: 10,
    };

  } catch (error) {
    console.error('Soru yükleme hatası:', error);
    return null;
  }
};

export const generateQuiz = async (totalQuestions: number = 40): Promise<Question[]> => {
  const questions: Question[] = [];

  for (let i = 1; i <= totalQuestions; i++) {
    const question = await fetchQuestionFromStorage(i);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
};
