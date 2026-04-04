export type Difficulty = "Fácil" | "Media" | "Difícil";

export type ExamOption = {
  id: string;
  text: string;
};

export type ExamQuestion = {
  id: number;
  subject: string;
  difficulty: Difficulty;
  question: string;
  options: ExamOption[];
  correctAnswer: string;
  explanation: string;
};

export type ExamStage = "exam" | "results";

export type SubjectStats = {
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  answered: number;
  percentage: number;
};