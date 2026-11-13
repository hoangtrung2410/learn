// Dữ liệu luyện thi TOEIC (tự soạn, không chép đề ETS). Giải thích bằng tiếng Việt.

/** Một câu hỏi trắc nghiệm có 4 lựa chọn (Part 3, 4, 6, 7). */
export interface ToeicQ {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explain: string;
}

/** Bảng/biểu nhỏ đi kèm (câu hỏi "Look at the graphic"). */
export interface ToeicGraphic {
  title: string;
  rows: string[][]; // dòng đầu là tiêu đề cột
}

/** Part 2: nghe một câu hỏi/câu nói và chọn câu đáp phù hợp nhất trong 3 câu (A/B/C). */
export interface ToeicPart2 {
  id: string;
  prompt: string;
  options: [string, string, string];
  answer: 0 | 1 | 2;
  explain: string;
}

/** Part 3: hội thoại 2-3 người, 3 câu hỏi. */
export interface ToeicPart3 {
  id: string;
  speakers: { name: string; gender: 'M' | 'W' }[];
  lines: { s: number; text: string }[]; // s = chỉ số trong speakers
  graphic?: ToeicGraphic;
  questions: [ToeicQ, ToeicQ, ToeicQ];
}

/** Part 4: bài nói một người (thông báo, tin nhắn thoại, quảng cáo...), 3 câu hỏi. */
export interface ToeicPart4 {
  id: string;
  kind: string; // ví dụ: announcement, voicemail, advertisement, news report, tour, meeting excerpt
  gender: 'M' | 'W';
  text: string;
  graphic?: ToeicGraphic;
  questions: [ToeicQ, ToeicQ, ToeicQ];
}

/** Part 6: đoạn văn có 4 chỗ trống [1]..[4]; câu hỏi thứ i ứng với chỗ trống [i]. */
export interface ToeicPart6 {
  id: string;
  kind: string; // email, notice, memo, article, advertisement, letter
  title: string;
  text: string;
  questions: [ToeicQ, ToeicQ, ToeicQ, ToeicQ];
}

/** Part 7: đọc 1, 2 hoặc 3 văn bản rồi trả lời 2-5 câu hỏi. */
export interface ToeicPart7 {
  id: string;
  kind: 'single' | 'double' | 'triple';
  docs: { type: string; title: string; text: string }[];
  questions: ToeicQ[];
}
