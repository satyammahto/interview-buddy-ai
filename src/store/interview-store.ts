import { create } from 'zustand';

export type InterviewMode = 'technical' | 'behavioral' | 'hr' | 'stress';
export type Difficulty = 'junior' | 'mid' | 'senior';

export interface ResumeData {
  skills: string[];
  experience_level: string;
  past_roles: string[];
  education: string;
  raw_text?: string;
}

export interface InterviewQuestion {
  id: number;
  text: string;
  category: string;
}

export interface AnswerEvaluation {
  question_id: number;
  question_text: string;
  answer_transcript: string;
  scores: {
    technical_knowledge: number;
    communication: number;
    problem_solving: number;
    confidence: number;
    relevance: number;
  };
  feedback: string;
  follow_up?: string;
}

export interface TranscriptEntry {
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
}

interface InterviewState {
  // Setup
  resumeData: ResumeData | null;
  targetRole: string;
  mode: InterviewMode;
  difficulty: Difficulty;
  
  // Interview
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  evaluations: AnswerEvaluation[];
  transcript: TranscriptEntry[];
  isInterviewActive: boolean;
  
  // Actions
  setResumeData: (data: ResumeData) => void;
  setTargetRole: (role: string) => void;
  setMode: (mode: InterviewMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setQuestions: (questions: InterviewQuestion[]) => void;
  nextQuestion: () => void;
  addEvaluation: (evaluation: AnswerEvaluation) => void;
  addTranscriptEntry: (entry: Omit<TranscriptEntry, 'timestamp'>) => void;
  setInterviewActive: (active: boolean) => void;
  reset: () => void;
}

const initialState = {
  resumeData: null,
  targetRole: '',
  mode: 'technical' as InterviewMode,
  difficulty: 'mid' as Difficulty,
  questions: [],
  currentQuestionIndex: 0,
  evaluations: [],
  transcript: [],
  isInterviewActive: false,
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,
  setResumeData: (data) => set({ resumeData: data }),
  setTargetRole: (role) => set({ targetRole: role }),
  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setQuestions: (questions) => set({ questions }),
  nextQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),
  addEvaluation: (evaluation) => set((s) => ({ evaluations: [...s.evaluations, evaluation] })),
  addTranscriptEntry: (entry) => set((s) => ({ 
    transcript: [...s.transcript, { ...entry, timestamp: Date.now() }] 
  })),
  setInterviewActive: (active) => set({ isInterviewActive: active }),
  reset: () => set(initialState),
}));
