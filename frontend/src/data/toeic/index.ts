import { loadQuizBank } from '../packLoader';
import type { ToeicPart2, ToeicPart3, ToeicPart4, ToeicPart6, ToeicPart7, ToeicQ } from './types';

export * from './types';

/** Part 5 lấy từ ngân hàng câu "toeic" có sẵn (điền từ vào câu). */
export interface ToeicPart5 extends ToeicQ {
  id: string;
  level: string;
}

export interface ToeicData {
  part2: ToeicPart2[];
  part3: ToeicPart3[];
  part4: ToeicPart4[];
  part5: ToeicPart5[];
  part6: ToeicPart6[];
  part7: ToeicPart7[]; // single trước, rồi double, rồi triple
}

let cache: Promise<ToeicData> | null = null;

/** Tải toàn bộ dữ liệu TOEIC (chỉ khi người học mở trang luyện thi). */
export function loadToeic(): Promise<ToeicData> {
  if (!cache) {
    cache = (async () => {
      const [p2, p3, p4, p6, p7s, p7m, bank] = await Promise.all([
        import('./part2.json').then((m) => m.default as ToeicPart2[]),
        import('./part3.json').then((m) => m.default as ToeicPart3[]),
        import('./part4.json').then((m) => m.default as ToeicPart4[]),
        import('./part6.json').then((m) => m.default as ToeicPart6[]),
        import('./part7-single.json').then((m) => m.default as ToeicPart7[]),
        import('./part7-multi.json').then((m) => m.default as ToeicPart7[]),
        loadQuizBank('en'),
      ]);
      const part5: ToeicPart5[] = bank
        .filter((q) => q.type === 'toeic')
        .map((q) => ({
          id: q.id,
          level: q.level,
          q: q.question,
          options: q.options as ToeicQ['options'],
          answer: q.answer as ToeicQ['answer'],
          explain: q.explanation,
        }));
      const order = { single: 0, double: 1, triple: 2 } as const;
      const part7 = [...p7s, ...p7m].sort((a, b) => order[a.kind] - order[b.kind]);
      return { part2: p2, part3: p3, part4: p4, part5, part6: p6, part7 };
    })();
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

// ---------------------------------------------------------------- Đề thi thử
// Cấu trúc theo đề thật (bỏ Part 1 vì cần ảnh): Part 2: 25, Part 3: 13 hội thoại, Part 4: 10 bài nói,
// Part 5: 30, Part 6: 4 đoạn, Part 7: 10 đơn + 2 kép + 3 ba văn bản.
export interface ToeicTest {
  part2: ToeicPart2[];
  part3: ToeicPart3[];
  part4: ToeicPart4[];
  part5: ToeicPart5[];
  part6: ToeicPart6[];
  part7: ToeicPart7[];
}

export const TEST_COUNT = 2;

/** Trộn theo hạt giống cố định: đề số k luôn ra cùng một bộ câu. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildTest(d: ToeicData, k: number): ToeicTest {
  const slice = <T,>(arr: T[], n: number) => arr.slice(k * n, k * n + n);
  const single = d.part7.filter((s) => s.kind === 'single');
  const double = d.part7.filter((s) => s.kind === 'double');
  const triple = d.part7.filter((s) => s.kind === 'triple');
  // Part 5: chỉ lấy câu B1–C1 (đúng độ khó đề thật), trộn cố định để mỗi đề có đủ các cấp.
  const p5 = seededShuffle(d.part5.filter((q) => ['B1', 'B2', 'C1'].includes(q.level)), 2410);
  return {
    part2: slice(d.part2, 25),
    part3: slice(d.part3, 13),
    part4: slice(d.part4, 10),
    part5: slice(p5, 30),
    part6: slice(d.part6, 4),
    part7: [...slice(single, 10), ...slice(double, 2), ...slice(triple, 3)],
  };
}

/** Quy đổi điểm thô sang thang 5–495 mỗi phần (ước lượng tuyến tính, không phải bảng chính thức của ETS). */
export function scaleScore(correct: number, total: number): number {
  if (!total) return 5;
  const v = 5 + Math.round(((correct / total) * 490) / 5) * 5;
  return Math.max(5, Math.min(495, v));
}
