import { CHINESE_UNITS } from '../../data/curriculum';
import { tokenize, toPinyin } from '../../data/newHskBuilder';

export interface GameWord { zh: string; py: string; vi: string; book: number; lesson: number }
export interface GameSentence { zh: string; py: string; vi: string; tokens: string[]; book: number; lesson: number }

const words: GameWord[] = [];
const sentences: GameSentence[] = [];
const seenW = new Set<string>();
const seenS = new Set<string>();

for (const u of CHINESE_UNITS) {
  for (const l of u.lessons) {
    if (!l.study) continue;
    const { book, no } = l.study;
    for (const t of l.study.texts) {
      for (const v of t.vocab) {
        if (v.proper || seenW.has(v.zh)) continue;
        seenW.add(v.zh);
        words.push({ zh: v.zh, py: toPinyin(v.zh), vi: v.vi, book, lesson: no });
      }
      for (const d of t.dialogue) {
        const tk = tokenize(d.zh);
        if (tk.length < 3 || tk.length > 9 || new Set(tk).size !== tk.length || seenS.has(d.zh)) continue;
        seenS.add(d.zh);
        sentences.push({ zh: d.zh, py: toPinyin(d.zh), vi: d.vi, tokens: tk, book, lesson: no });
      }
    }
  }
}

export const BOOKS = [1, 2, 3];
export const lessonCount = (book: number) => (book === 3 ? 18 : 15);

export const filterWords = (book: number, lesson: number) => words.filter((w) => w.book === book && (lesson === 0 || w.lesson === lesson));
export const filterSentences = (book: number, lesson: number) => sentences.filter((s) => s.book === book && (lesson === 0 || s.lesson === lesson));

export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const pick = <T,>(arr: T[], n: number): T[] => shuffle(arr).slice(0, n);
