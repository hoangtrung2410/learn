export type LanguageCode = 'zh' | 'en' | 'ja' | 'ko';

export interface LanguageInfo {
  id: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  levelTitle: string;
  description: string;
  badge: string;
  accentColor: string;
}

export type QuestionType =
  | 'multiple-choice'
  | 'speak-sentence'
  | 'reorder-words'
  | 'pinyin-match'
  | 'listen-select';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  promptPinyin?: string;
  promptVi: string;
  audioText: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  targetSentence?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  xp: number;
  questions: Question[];
  icon: string;
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string;
  description: string;
  badge: string;
  color: string;
  lessons: Lesson[];
}

export interface WordScore {
  word: string;
  phonetic: string;
  score: number;
  status: 'perfect' | 'good' | 'needs-work';
  comment: string;
}

export interface SpeechEvaluationResult {
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  toneScore: number;
  cefrLevel: string;
  pinyinOrIpa: string;
  nativeMeaningVi: string;
  feedbackSummary: string;
  wordsBreakdown: WordScore[];
  pronunciationTips: string[];
  soundAlikeWarning?: string;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  category?: string;
  description: string;
  partnerRole: string;
  userRole: string;
  difficulty: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  initialPrompt: string;
  initialPinyin?: string;
  initialVi: string;
  icon: string;
  suggestedStarters: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pinyin?: string;
  vietnamese?: string;
  feedback?: {
    naturalness: string;
    tip: string;
    betterAlternative?: string;
  };
  timestamp: number;
  streaming?: boolean;
  error?: boolean;
}

export interface UserStats {
  xp: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  gems: number;
  completedLessons: string[];
  speakingPracticedCount: number;
  averagePronunciationScore: number;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar: string;
  isSuperAdmin: boolean;
  provider: 'local';
}

export interface ToeicWord {
  id: string;
  word: string;
  ipa: string;
  pos: 'n' | 'v' | 'adj' | 'adv' | 'phrase';
  meaningVi: string;
  example: string;
  exampleVi: string;
  takeNoteId: number;
  takeNoteTitle: string;
  subGroup: string;
}


