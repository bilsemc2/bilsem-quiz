export interface GameState {
  currentLevel: number;
  score: number;
  questionTime: Date; // The starting time shown
  targetOffset: number; // 5 or 10 minutes
  userSetMinutes: number; // 0-59
  isCorrect: boolean | null;
  feedbackMessage: string;
  isLoadingFeedback: boolean;
}

export interface ClockTime {
  hours: number;
  minutes: number;
}
