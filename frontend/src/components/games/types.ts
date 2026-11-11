export type GameLang = 'zh' | 'en';

/** Một từ dùng trong game (chung cho tiếng Trung và tiếng Anh). */
export interface GameItem { id: string; front: string; sub?: string; back: string; lang: GameLang }
/** Một câu để xếp lại. */
export interface GameSentence { id: string; text: string; sub?: string; vi: string; tokens: string[]; lang: GameLang }

export const joinTokens = (tokens: string[], lang: GameLang) => tokens.join(lang === 'zh' ? '' : ' ');

export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const pick = <T,>(arr: T[], n: number): T[] => shuffle(arr).slice(0, n);

/** Tách câu thành các cụm để xếp lại; trả về [] nếu câu không phù hợp (quá ngắn/dài). */
export const toSentenceTokens = (text: string, lang: GameLang): string[] => {
  const clean = text.replace(/[，。！？、；：“”‘’（）,.!?;:"()]/g, ' ').trim();
  let tokens: string[];
  if (lang === 'en') tokens = clean.split(/\s+/).filter(Boolean);
  else {
    const seg = typeof Intl !== 'undefined' && (Intl as any).Segmenter ? new (Intl as any).Segmenter('zh', { granularity: 'word' }) : null;
    const noSpace = clean.replace(/\s+/g, '');
    tokens = seg ? [...seg.segment(noSpace)].map((s: any) => s.segment) : noSpace.split('');
  }
  return tokens.length >= 3 && tokens.length <= 9 ? tokens : [];
};
