export interface Question {
  id: number;
  text: string;
  questionImageUrl: string;
  options: {
    id: string;
    text: string;
    imageUrl: string;
  }[];
  correctOptionId: string;
  solutionVideo?: string;
}
