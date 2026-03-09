export interface KnowledgeCardRow {
  id: string;
  icerik: string;
}

export interface KnowledgeQuestion {
  id: string;
  originalText: string;
  displayText: string;
  correctAnswer: string;
  options: string[];
}

export type LocalPhase = "loading" | "ready" | "error";
