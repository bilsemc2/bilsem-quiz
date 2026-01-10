export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
}

export interface UserProfile {
  name: string;
  email: string;
  school: string;
  grade: string;
  avatar_url: string;
  points: number;
  experience: number;
  referral_code?: string;
  referral_count?: number;
  classes?: ClassInfo[];
  yetenek_alani?: string | string[];
  resim_analiz_hakki?: number;
}

export interface ClassStudent {
  classes: ClassInfo;
}

// Quiz ve performans ile ilgili istatistikler
export interface QuizStats {
  totalQuizzes: number;
  totalCorrect: number;
  totalWrong: number;
  averageScore: number;
  levelProgress: number;
  currentLevel: number;
  nextLevelXP: number;
  currentXP: number;
  levelBadge: string;
  levelTitle: string;
}

export interface DailyStats {
  date: string;
  correct: number;
  wrong: number;
}
