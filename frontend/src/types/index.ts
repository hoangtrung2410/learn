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

export interface StudyDialogueLine {
  sp: string;
  zh: string;
  vi: string;
}

export interface StudyVocab {
  zh: string;
  pos: string;
  vi: string;
  proper: boolean;
}

export interface StudyText {
  n: number;
  scene: string;
  sceneVi: string;
  audioDialogue: string;
  audioVocab: string;
  dialogue: StudyDialogueLine[];
  vocab: StudyVocab[];
}

export interface StudyGrammar {
  title: string;
  explain: string;
  examples: string[];
}

export interface SbtQuestion {
  kind: 'pic' | 'match' | 'cloze' | 'read' | 'write';
  image?: string;
  prompt: string;
  options: string[];
  answer: string;
}

export interface SbtAudio {
  label: string;
  src: string;
}

/** Bài tập trong Sổ tay học và luyện tập (SBT) của giáo trình. */
export interface LessonSbt {
  book: number;
  no: number; // 0 = đề thi mô phỏng cả cấp
  questions: SbtQuestion[];
  audio: SbtAudio[];
}

/** Nội dung học theo giáo trình (bài khoá, từ mới, ngữ pháp) hiện trước phần luyện tập. */
export interface LessonStudy {
  book: number;
  no: number;
  texts: StudyText[];
  grammar: StudyGrammar[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  xp: number;
  questions: Question[];
  icon: string;
  study?: LessonStudy;
  sbt?: LessonSbt;
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


