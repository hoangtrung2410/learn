import { pinyin } from 'pinyin-pro';
import { Lesson, LessonSbt, LessonStudy, Question, SbtAudio, SbtQuestion, StudyText } from '../types';

export interface BookLessonMeta {
  zh: string;
  py: string;
  vi: string;
  tokens: string[] | null;
  grammar: string[];
}

export interface BookJson {
  book: number;
  lessons: { no: number; texts: StudyText[]; grammar: LessonStudy['grammar'] }[];
}

export interface SbtJson {
  book: number;
  lessons: { no: number; questions: SbtQuestion[] }[];
}

const SBT_TRACKS_BOOK1: [string, string][] = [
  ['yuyin', 'Ngữ âm (Sổ tay)'],
  ['tingdu', 'Nghe – đọc – luyện (Sổ tay)'],
  ['moni', 'Nghe luyện thi mô phỏng (Sổ tay)'],
];

/** Gom bài tập + audio của Sổ tay cho một bài (no >= 1) hoặc đề thi mô phỏng (no = 0). */
export const buildSbt = (book: number, no: number, json?: SbtJson): LessonSbt | undefined => {
  const questions = json?.lessons.find((l) => l.no === no)?.questions ?? [];
  const pad = String(no).padStart(2, '0');
  const audio: SbtAudio[] = [];
  if (no === 0) {
    audio.push({ label: 'Nghe đề thi mô phỏng', src: `/audio/sbt${book}/mock.m4a` });
  } else if (book === 1) {
    const has: Record<string, boolean> = { yuyin: true, tingdu: no <= 6, moni: no >= 4 };
    for (const [k, label] of SBT_TRACKS_BOOK1) if (has[k]) audio.push({ label, src: `/audio/sbt1/${pad}-${k}.m4a` });
  } else {
    audio.push({ label: 'Nghe luyện thi (Sổ tay)', src: `/audio/sbt${book}/${pad}.m4a` });
  }
  if (!questions.length && !audio.length) return undefined;
  return { book, no, questions, audio };
};

export const toPinyin = (zh: string): string => pinyin(zh, { toneType: 'symbol', type: 'string', v: true });

/** Tên nhân vật trong sách -> phiên âm Hán-Việt dùng ở giao diện. */
export const SPEAKER_VI: Record<string, string> = {
  王一飞: 'Vương Nhất Phi', 王一雪: 'Vương Nhất Tuyết', 李文: 'Lý Văn', 白家月: 'Bạch Gia Nguyệt', 安妮: 'Annie',
  陈天中: 'Trần Thiên Trung', 刘明: 'Lưu Minh', 刘小雪: 'Lưu Tiểu Tuyết', 刘小明: 'Lưu Tiểu Minh', 杨同乐: 'Dương Đồng Lạc',
  胡医生: 'Bác sĩ Hồ', 小语: 'Tiểu Ngữ', 学生们: 'Các học sinh', 售货员: 'Nhân viên bán hàng', 服务员: 'Nhân viên phục vụ',
};

const segmenter: { segment: (s: string) => Iterable<{ segment: string; isWordLike?: boolean }> } | null =
  typeof Intl !== 'undefined' && (Intl as any).Segmenter ? new (Intl as any).Segmenter('zh', { granularity: 'word' }) : null;

/** Tách câu thành các cụm để xếp lại (bỏ dấu câu). */
export const tokenize = (sentence: string): string[] => {
  const clean = sentence.replace(/[，。！？、；：“”‘’（）\s,.!?]/g, '');
  if (!clean) return [];
  if (!segmenter) return clean.split('');
  const out: string[] = [];
  for (const seg of segmenter.segment(clean)) if (seg.segment) out.push(seg.segment);
  return out;
};

const hash = (s: string): number => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** 4 đáp án gồm đáp án đúng và 3 đáp án nhiễu lấy từ `pool`, vị trí đáp án đúng cố định theo `seed`. */
const options4 = (correct: string, pool: string[], seed: string): string[] => {
  const uniq = [...new Set(pool.filter((x) => x && x !== correct))];
  uniq.sort((a, b) => hash(seed + a) - hash(seed + b));
  const wrong = uniq.slice(0, 3);
  const pos = hash(seed) % (wrong.length + 1);
  wrong.splice(pos, 0, correct);
  return wrong;
};

const rotate = <T,>(arr: T[], k: number): T[] => arr.map((_, i) => arr[(i + k) % arr.length]);

const ICONS = ['📘', '🗣️', '✍️', '🎧', '🏫', '🍜', '🚄', '🏥', '📚', '🌏'];

export const buildLesson = (
  book: number,
  index: number,
  meta: BookLessonMeta,
  allMeta: BookLessonMeta[],
  data?: BookJson['lessons'][number],
  sbtJson?: SbtJson,
): Lesson => {
  const id = `hsk${book}-b${index + 1}`;
  const questions: Question[] = [];
  const add = (q: Omit<Question, 'id'>) => questions.push({ ...q, id: `${id}-q${questions.length + 1}` });

  const vocab = (data?.texts ?? []).flatMap((t) => t.vocab).filter((v, i, a) => a.findIndex((x) => x.zh === v.zh && x.vi === v.vi) === i);
  const content = vocab.filter((v) => !v.proper);
  const allVocabVi = content.map((v) => v.vi);
  const allVocabZh = content.map((v) => v.zh);
  const lines = (data?.texts ?? []).flatMap((t) => t.dialogue);

  // 1. Câu chủ đề của bài
  add({
    type: 'multiple-choice',
    prompt: meta.zh,
    promptPinyin: meta.py,
    promptVi: 'Câu chủ đề của bài này có nghĩa là gì?',
    audioText: meta.zh,
    options: options4(meta.vi, allMeta.map((m) => m.vi), `${id}t`),
    correctAnswer: meta.vi,
    explanation: `${meta.zh} (${meta.py}) — ${meta.vi}.`,
  });

  // 2. Từ mới: Hán -> nghĩa (nghe + đọc)
  const pickVocab = (n: number, salt: string) => {
    const arr = [...content].sort((a, b) => hash(id + salt + a.zh) - hash(id + salt + b.zh));
    return arr.slice(0, n);
  };
  for (const v of pickVocab(4, 'a')) {
    add({
      type: 'multiple-choice',
      prompt: v.zh,
      promptPinyin: toPinyin(v.zh),
      promptVi: 'Từ này có nghĩa là gì?',
      audioText: v.zh,
      options: options4(v.vi, allVocabVi, `${id}${v.zh}a`),
      correctAnswer: v.vi,
      explanation: `${v.zh} (${toPinyin(v.zh)}) — ${v.pos}: ${v.vi}.`,
    });
  }
  // 3. Từ mới: nghĩa -> Hán
  for (const v of pickVocab(3, 'b')) {
    add({
      type: 'multiple-choice',
      prompt: v.vi,
      promptVi: 'Chọn từ tiếng Trung tương ứng:',
      audioText: v.zh,
      options: options4(v.zh, allVocabZh, `${id}${v.zh}b`),
      correctAnswer: v.zh,
      explanation: `${v.vi} = ${v.zh} (${toPinyin(v.zh)}).`,
    });
  }
  // 4. Pinyin của từ mới
  for (const v of pickVocab(2, 'c')) {
    const py = toPinyin(v.zh);
    add({
      type: 'pinyin-match',
      prompt: v.zh,
      promptVi: 'Chọn phiên âm Pinyin đúng:',
      audioText: v.zh,
      options: options4(py, allVocabZh.map(toPinyin), `${id}${v.zh}c`),
      correctAnswer: py,
      explanation: `${v.zh} đọc là ${py}.`,
    });
  }
  // 5. Câu hội thoại: Hán -> nghĩa
  const dl = [...lines].filter((l) => l.zh.length >= 4).sort((a, b) => hash(id + 'd' + a.zh) - hash(id + 'd' + b.zh));
  for (const l of dl.slice(0, 3)) {
    add({
      type: 'multiple-choice',
      prompt: l.zh,
      promptPinyin: toPinyin(l.zh),
      promptVi: 'Câu trong bài khoá này có nghĩa là gì?',
      audioText: l.zh,
      options: options4(l.vi, lines.map((x) => x.vi), `${id}${l.zh}d`),
      correctAnswer: l.vi,
      explanation: `${l.zh} (${toPinyin(l.zh)}) — ${l.vi}`,
    });
  }
  // 6. Xếp câu từ bài khoá
  const reorderCand = lines.filter((l) => { const t = tokenize(l.zh); return t.length >= 3 && t.length <= 8 && new Set(t).size === t.length; })
    .sort((a, b) => hash(id + 'e' + a.zh) - hash(id + 'e' + b.zh));
  for (const l of reorderCand.slice(0, 2)) {
    const tokens = tokenize(l.zh);
    add({
      type: 'reorder-words',
      prompt: `Sắp xếp câu: "${l.vi}"`,
      promptVi: 'Ghép các từ theo đúng trật tự câu tiếng Trung:',
      audioText: tokens.join(''),
      options: rotate(tokens, 1 + (hash(l.zh) % (tokens.length - 1))),
      correctAnswer: tokens,
      explanation: `Câu đúng: ${l.zh} (${toPinyin(l.zh)}).`,
    });
  }
  // 7. Ngữ pháp
  add({
    type: 'multiple-choice',
    prompt: meta.zh,
    promptPinyin: meta.py,
    promptVi: 'Điểm ngữ pháp nào được học trong bài này?',
    audioText: meta.zh,
    options: options4(meta.grammar[0], allMeta.map((m) => m.grammar[0]), `${id}g`),
    correctAnswer: meta.grammar[0],
    explanation: `Bài ${index + 1} (New HSK ${book}) học: ${meta.grammar.join('; ')}.`,
  });
  // 8. Luyện nói
  add({
    type: 'speak-sentence',
    prompt: meta.zh,
    promptPinyin: meta.py,
    promptVi: `Luyện nói câu: "${meta.vi}"`,
    audioText: meta.zh,
    targetSentence: meta.zh,
    correctAnswer: meta.zh,
    explanation: `Đọc rõ thanh điệu: ${meta.py}.`,
  });

  const study: LessonStudy | undefined = data ? { book, no: data.no, texts: data.texts, grammar: data.grammar } : undefined;
  const nVocab = content.length;
  return {
    id: `zh-hsk${book}-b${index + 1}`,
    title: `Bài ${index + 1}: ${meta.zh}`,
    description: `${meta.vi}${data ? ` · ${nVocab} từ mới · ${data.texts.length} bài khoá` : ` · Ngữ pháp: ${meta.grammar.slice(0, 2).join('; ')}`}`,
    xp: 20,
    icon: ICONS[index % ICONS.length],
    questions,
    study,
    sbt: buildSbt(book, index + 1, sbtJson),
  };
};
