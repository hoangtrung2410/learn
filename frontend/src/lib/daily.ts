// Ghi nhận việc học theo từng ngày (lưu trong trình duyệt) để làm mục tiêu hằng ngày và chuỗi ngày học thật.
export type Activity = 'srs' | 'quiz' | 'lesson' | 'word' | 'grammar';
export type GoalLevel = 'light' | 'normal' | 'hard';
type DayLog = Record<Activity, number>;

const KEY = 'lp_daily_v1';

interface Store {
  days: Record<string, DayLog>;
  goal: GoalLevel;
}

const empty = (): DayLog => ({ srs: 0, quiz: 0, lesson: 0, word: 0, grammar: 0 });

// Ngày theo giờ máy người học (không dùng UTC để chuỗi ngày không lệch).
export const dayKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function read(): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.days) return { days: raw.days, goal: raw.goal || 'normal' };
  } catch {
    /* dữ liệu hỏng thì bắt đầu lại */
  }
  return { days: {}, goal: 'normal' };
}

function write(s: Store) {
  try {
    // Giữ tối đa ~120 ngày gần nhất để dữ liệu không phình ra.
    const keys = Object.keys(s.days).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - 120))) delete s.days[k];
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* trình duyệt chặn lưu trữ: bỏ qua */
  }
  window.dispatchEvent(new Event('lp:daily'));
}

export function logActivity(kind: Activity, n = 1) {
  if (n <= 0) return;
  const s = read();
  const k = dayKey();
  s.days[k] = { ...empty(), ...(s.days[k] || {}) };
  s.days[k][kind] += n;
  write(s);
}

export const getDay = (key: string = dayKey()): DayLog => ({ ...empty(), ...(read().days[key] || {}) });
export const getGoalLevel = (): GoalLevel => read().goal;
export function setGoalLevel(g: GoalLevel) {
  const s = read();
  s.goal = g;
  write(s);
}

export interface Mission {
  id: 'review' | 'practice' | 'learn';
  title: string;
  hint: string;
  target: number;
  done: number;
}

const TARGETS: Record<GoalLevel, [number, number, number]> = {
  light: [5, 5, 1],
  normal: [10, 10, 1],
  hard: [20, 20, 2],
};
export const GOAL_LABEL: Record<GoalLevel, string> = { light: 'Nhẹ nhàng', normal: 'Vừa sức', hard: 'Chăm chỉ' };

export function getMissions(key: string = dayKey(), goal: GoalLevel = getGoalLevel()): Mission[] {
  const d = getDay(key);
  const [a, b, c] = TARGETS[goal];
  return [
    { id: 'review', title: 'Ôn từ vựng', hint: 'Lật thẻ ôn tập hoặc đánh dấu từ đã thuộc', target: a, done: d.srs + d.word },
    { id: 'practice', title: 'Làm câu hỏi', hint: 'Luyện đề, trắc nghiệm hoặc thi thử', target: b, done: d.quiz },
    { id: 'learn', title: 'Học bài mới', hint: 'Hoàn thành bài học hoặc nắm một điểm ngữ pháp', target: c, done: d.lesson + d.grammar },
  ];
}

export const isMissionDone = (m: Mission) => m.done >= m.target;
export const completedCount = (key?: string, goal?: GoalLevel) => getMissions(key, goal).filter(isMissionDone).length;

/** Một ngày được tính vào chuỗi khi hoàn thành ít nhất 1 nhiệm vụ. */
export const dayCounts = (key: string, goal: GoalLevel = getGoalLevel()) => completedCount(key, goal) >= 1;

/** Chuỗi ngày liên tiếp. Hôm nay chưa đạt thì vẫn giữ chuỗi tới hết hôm nay (tính từ hôm qua). */
export function getStreak(goal: GoalLevel = getGoalLevel()): number {
  const d = new Date();
  if (!dayCounts(dayKey(d), goal)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dayCounts(dayKey(d), goal)) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** 7 ngày gần nhất (cũ → mới) để vẽ dải tuần. */
export function lastDays(n = 7): { key: string; label: string; done: boolean; today: boolean }[] {
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({ key, label: labels[d.getDay()], done: dayCounts(key), today: i === 0 });
  }
  return out;
}
