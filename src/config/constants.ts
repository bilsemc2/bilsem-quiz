// Soru Limitleri
export const MAX_QUESTION_NUMBER = 1373;
// Quiz Limitleri
export const MIN_QUESTIONS_PER_QUIZ = 1;
export const MAX_QUESTIONS_PER_QUIZ = 20;

// Sınıf Limitleri
export const MAX_STUDENTS_PER_CLASS = 30;

// Sayfalama
export const ITEMS_PER_PAGE = 12;

// Dosya Yolları
export const QUESTION_IMAGE_PATH = '/images/questions/Matris';
export const OPTION_IMAGE_PATH = '/images/options/Matris';

// Varsayılan Değerler
export const DEFAULT_QUIZ_POINTS = 10;
export const DEFAULT_QUIZ_STATUS = 'pending' as const;

// Tablo İsimleri
export const DB_TABLES = {
  QUIZZES: 'quizzes',
  QUIZ_RESULTS: 'quiz_results',
  QUIZ_CLASS_ASSIGNMENTS: 'quiz_class_assignments',
  CLASSES: 'classes',
  STUDENTS: 'students',
  PROFILES: 'profiles',
} as const;
