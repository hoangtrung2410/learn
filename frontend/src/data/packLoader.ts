import { pinyin } from 'pinyin-pro';
import { HskVocabItem, HSK_VOCABULARY_LIST } from './hskVocabData';
import { ENGLISH_VOCABULARY_1000, EnglishVocabItem } from './englishVocab1000Data';

// Các gói dữ liệu lớn nằm trong src/data/packs, chỉ tải khi người học mở tính năng tương ứng.
const rawTxt = import.meta.glob('./packs/*.txt', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>;
const rawJson = import.meta.glob('./packs/*.json', { import: 'default' }) as Record<string, () => Promise<any>>;

const fileName = (p: string) => p.split('/').pop() || p;

async function readTxt(prefix: string): Promise<string[]> {
  const keys = Object.keys(rawTxt)
    .filter((k) => fileName(k).startsWith(prefix))
    .sort((a, b) =>
      fileName(a).localeCompare(fileName(b), undefined, { numeric: true })
    );
  const chunks = await Promise.all(keys.map((k) => rawTxt[k]()));
  return chunks
    .join('\n')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

async function readJson<T>(prefix: string): Promise<T[]> {
  const keys = Object.keys(rawJson)
    .filter((k) => fileName(k).startsWith(prefix))
    .sort((a, b) => fileName(a).localeCompare(fileName(b), undefined, { numeric: true }));
  const parts = await Promise.all(keys.map((k) => rawJson[k]()));
  return parts.flat() as T[];
}

export const toPinyin = (text: string): string => {
  try {
    return pinyin(text, { toneType: 'symbol', type: 'string', v: true });
  } catch {
    return '';
  }
};

// ---------------------------------------------------------------- Chinese vocab
let zhVocabCache: HskVocabItem[] | null = null;

export async function loadZhVocab(): Promise<HskVocabItem[]> {
  if (zhVocabCache) return zhVocabCache;
  const out: HskVocabItem[] = [];
  const seen = new Set<string>();
  for (let level = 1; level <= 6; level++) {
    const lines = await readTxt(`hsk${level}`);
    let n = 0;
    for (const line of lines) {
      const f = line.split('|');
      if (f.length < 6) continue;
      const [hanzi, meaning, pos, sinoViet, exZh, exVi] = f.map((s) => s.trim());
      if (!hanzi || !meaning || seen.has(hanzi)) continue;
      seen.add(hanzi);
      n++;
      out.push({
        id: `hsk${level}-${n}`,
        level,
        hanzi,
        pinyin: toPinyin(hanzi),
        sinoViet: sinoViet || undefined,
        meaning,
        partOfSpeech: pos,
        exampleHanzi: exZh,
        examplePinyin: toPinyin(exZh),
        exampleVi: exVi,
      });
    }
  }
  // Giữ lại các từ trong bộ cũ nếu chưa có trong gói mới.
  for (const old of HSK_VOCABULARY_LIST) {
    if (!seen.has(old.hanzi)) {
      seen.add(old.hanzi);
      out.push(old);
    }
  }
  zhVocabCache = out;
  return out;
}

// ---------------------------------------------------------------- English vocab
let enVocabCache: EnglishVocabItem[] | null = null;

export async function loadEnVocab(): Promise<EnglishVocabItem[]> {
  if (enVocabCache) return enVocabCache;
  const out: EnglishVocabItem[] = [...ENGLISH_VOCABULARY_1000];
  const seen = new Set(out.map((w) => w.word.toLowerCase()));
  for (const prefix of ['en-core', 'en-toeic', 'en-ielts']) {
    const lines = await readTxt(prefix);
    let n = 0;
    for (const line of lines) {
      const f = line.split('|').map((s) => s.trim());
      if (f.length < 9) continue;
      const [word, ipa, pos, level, topic, meaningVi, collocation, exampleEn, exampleVi] = f;
      const key = word.toLowerCase();
      if (!word || !meaningVi || seen.has(key)) continue;
      if (!['A1', 'A2', 'B1', 'B2', 'C1'].includes(level)) continue;
      seen.add(key);
      n++;
      out.push({
        id: `${prefix}-${n}`,
        word,
        ipa,
        partOfSpeech: pos,
        level: level as EnglishVocabItem['level'],
        topic,
        meaningVi,
        collocation,
        exampleEn,
        exampleVi,
      });
    }
  }
  enVocabCache = out;
  return out;
}

// ---------------------------------------------------------------- Quiz bank
export interface QuizQuestion {
  id: string;
  lang: 'zh' | 'en';
  level: string; // '1'..'6' | 'A1'..'C1'
  type: string; // vocab | grammar | reading | listen | toeic | ielts
  question: string;
  options: string[];
  answer: number; // 0..3
  explanation: string;
}

async function loadQuiz(lang: 'zh' | 'en'): Promise<QuizQuestion[]> {
  const lines = await readTxt(lang === 'zh' ? 'zh-quiz-' : 'en-quiz-');
  const out: QuizQuestion[] = [];
  lines.forEach((line, i) => {
    const f = line.split('|').map((s) => s.trim());
    if (f.length < 9) return;
    const [level, type, question, a, b, c, d, ans, explanation] = f;
    const answer = 'ABCD'.indexOf(ans.toUpperCase());
    if (answer < 0 || !question || !a || !b || !c || !d) return;
    out.push({
      id: `${lang}-q-${i}`,
      lang,
      level: level.toUpperCase(),
      type: type.toLowerCase(),
      question,
      options: [a, b, c, d],
      answer,
      explanation,
    });
  });
  return out;
}

// ---------------------------------------------------------------- Câu hỏi sinh tự động từ kho từ vựng
// Mỗi từ sinh tối đa 3 dạng: đoán nghĩa, đoán từ theo nghĩa, điền từ vào câu ví dụ.
// Đáp án lấy thẳng từ dữ liệu từ vựng nên nhất quán với phần học từ; nhiễu chọn cùng cấp + cùng loại từ.
interface GenWord {
  id: string;
  level: string;
  term: string;
  read: string; // pinyin / IPA
  pos: string;
  meaning: string;
  example: string;
  exampleVi: string;
}

const shortMeaning = (m: string) => {
  const first = m.split(/[,;(（]/)[0].trim();
  return first.length >= 2 ? first : m.trim();
};

function pickDistractors<T extends GenWord>(pool: T[], w: T, pickKey: (x: T) => string, n = 3): T[] {
  const out: T[] = [];
  const used = new Set<string>([pickKey(w)]);
  const tryFrom = (cands: T[]) => {
    for (let tries = 0; tries < 60 && out.length < n && cands.length; tries++) {
      const c = cands[Math.floor(Math.random() * cands.length)];
      const k = pickKey(c);
      if (used.has(k)) continue;
      used.add(k);
      out.push(c);
    }
  };
  const bucket = pool.filter((x) => x.level === w.level && x.pos === w.pos);
  tryFrom(bucket.length > 12 ? bucket : pool.filter((x) => x.pos === w.pos));
  if (out.length < n) tryFrom(pool);
  return out;
}

function makeQ(lang: 'zh' | 'en', id: string, level: string, type: string, question: string, right: string, wrong: string[], explanation: string): QuizQuestion {
  const opts = [right, ...wrong];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { id, lang, level, type, question, options: opts, answer: opts.indexOf(right), explanation };
}

function generateVocabQuestions(lang: 'zh' | 'en', words: GenWord[]): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  for (const w of words) {
    const mean = shortMeaning(w.meaning);
    if (!w.term || !mean) continue;
    // 1. Từ → nghĩa
    const d1 = pickDistractors(words, w, (x) => shortMeaning(x.meaning));
    if (d1.length === 3) {
      out.push(makeQ(lang, `gen-m-${w.id}`, w.level, 'vocab', lang === 'zh' ? `“${w.term}” có nghĩa là gì?` : `What does "${w.term}" mean?`, mean, d1.map((x) => shortMeaning(x.meaning)), `${w.term} (${w.read}) = ${w.meaning}. Ví dụ: ${w.example} — ${w.exampleVi}`));
    }
    // 2. Nghĩa → từ
    const d2 = pickDistractors(words, w, (x) => x.term);
    if (d2.length === 3) {
      out.push(makeQ(lang, `gen-r-${w.id}`, w.level, 'vocab', lang === 'zh' ? `Từ nào có nghĩa là “${mean}”?` : `Which word means “${mean}”?`, w.term, d2.map((x) => x.term), `${w.term} (${w.read}) = ${w.meaning}.`));
    }
    // 3. Điền từ vào câu ví dụ
    if (w.example && w.example.includes(w.term) && w.term.length >= (lang === 'zh' ? 1 : 3)) {
      const idx = w.example.indexOf(w.term);
      if (lang === 'en') {
        const before = w.example[idx - 1];
        const after = w.example[idx + w.term.length];
        if ((before && /[A-Za-z]/.test(before)) || (after && /[A-Za-z]/.test(after))) continue;
      }
      const blank = w.example.replace(w.term, '___');
      const d3 = pickDistractors(words, w, (x) => x.term).filter((x) => !w.example.includes(x.term));
      if (d3.length === 3) {
        out.push(makeQ(lang, `gen-c-${w.id}`, w.level, 'cloze', `${blank}\n(${w.exampleVi})`.replace(/\n/g, '¶'), w.term, d3.map((x) => x.term), `Câu đầy đủ: ${w.example}. ${w.term} (${w.read}) = ${w.meaning}.`));
      }
    }
  }
  return out;
}

const quizCache: Partial<Record<'zh' | 'en', QuizQuestion[]>> = {};
export async function loadQuizBank(lang: 'zh' | 'en'): Promise<QuizQuestion[]> {
  if (!quizCache[lang]) {
    const base = await loadQuiz(lang);
    let gen: QuizQuestion[] = [];
    try {
      if (lang === 'zh') {
        const v = await loadZhVocab();
        gen = generateVocabQuestions('zh', v.map((x) => ({ id: x.id, level: String(x.level), term: x.hanzi, read: x.pinyin, pos: x.partOfSpeech, meaning: x.meaning, example: x.exampleHanzi, exampleVi: x.exampleVi })));
      } else {
        const v = await loadEnVocab();
        gen = generateVocabQuestions('en', v.map((x) => ({ id: x.id, level: x.level, term: x.word, read: x.ipa, pos: x.partOfSpeech, meaning: x.meaningVi, example: x.exampleEn, exampleVi: x.exampleVi })));
      }
    } catch (e) {
      console.warn('Không sinh được câu hỏi từ vựng', e);
    }
    quizCache[lang] = [...base, ...gen];
  }
  return quizCache[lang]!;
}

// ---------------------------------------------------------------- Grammar
export interface GrammarEntry {
  level: string;
  title: string;
  formula: string;
  explanation: string;
  trap: string;
  examples: { text: string; vi: string; pinyin?: string }[];
}

export async function loadGrammar(lang: 'zh' | 'en'): Promise<GrammarEntry[]> {
  if (lang === 'zh') {
    const raw = await readJson<any>('zh-grammar');
    return raw.map((g) => ({
      level: String(g.level),
      title: g.title,
      formula: g.formula,
      explanation: g.explanation,
      trap: g.examTrap || '',
      examples: (g.examples || []).map((e: any) => ({
        text: e.hanzi,
        vi: e.vi,
        pinyin: toPinyin(e.hanzi),
      })),
    }));
  }
  const raw = await readJson<any>('en-grammar');
  return raw.map((g) => ({
    level: String(g.level),
    title: g.title,
    formula: g.formula,
    explanation: g.explanation,
    trap: g.commonMistake || '',
    examples: (g.examples || []).map((e: any) => ({ text: e.en, vi: e.vi })),
  }));
}
