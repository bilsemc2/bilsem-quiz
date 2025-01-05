export const QUESTIONS_CONFIG = {
  totalQuestions: 374, // Toplam soru sayısı
  categories: {
    Matris: {
      totalQuestions: 374,
      path: '/images/questions/Matris'
    }
  }
};

export const generateQuiz = () => {
  const questions = [];
  const category = QUESTIONS_CONFIG.categories.Matris;
  const questionNumber = Math.floor(Math.random() * category.totalQuestions) + 1;
  
  const options = [
    {
      id: 'A',
      text: 'A',
      imageUrl: `${category.path}/${questionNumber}/A.png`
    },
    {
      id: 'B',
      text: 'B',
      imageUrl: `${category.path}/${questionNumber}/B.png`
    },
    {
      id: 'C',
      text: 'C',
      imageUrl: `${category.path}/${questionNumber}/C.png`
    },
    {
      id: 'D',
      text: 'D',
      imageUrl: `${category.path}/${questionNumber}/D.png`
    },
    {
      id: 'E',
      text: 'E',
      imageUrl: `${category.path}/${questionNumber}/E.png`
    }
  ];

  questions.push({
    id: questionNumber,
    text: `Soru ${questionNumber}`,
    questionImageUrl: `${category.path}/${questionNumber}/Q.png`,
    options,
    correctOptionId: 'A', // TODO: Doğru cevapları ekle
    solutionVideo: `${category.path}/${questionNumber}/solution.mp4`
  });

  return { questions };
};
