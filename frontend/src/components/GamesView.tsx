import React, { useMemo, useState } from 'react';
import { ArrowLeft, Ear, Layers, Shuffle } from 'lucide-react';
import { BOOKS, filterSentences, filterWords, lessonCount } from './games/pool';
import { MemoryGame } from './games/MemoryGame';
import { ListenGame } from './games/ListenGame';
import { SentenceGame } from './games/SentenceGame';

type GameId = 'memory' | 'listen' | 'sentence';

const GAMES: { id: GameId; icon: React.ReactNode; name: string; desc: string; tone: string }[] = [
  { id: 'memory', icon: <Layers size={24} />, name: 'Ghép cặp', desc: 'Lật thẻ để ghép chữ Hán với nghĩa tiếng Việt.', tone: 'from-emerald-500/25 to-emerald-900/10' },
  { id: 'listen', icon: <Ear size={24} />, name: 'Nghe và chọn', desc: 'Nghe giọng đọc rồi chọn đúng chữ Hán. Sai 3 lần là hết tim.', tone: 'from-sky-500/25 to-sky-900/10' },
  { id: 'sentence', icon: <Shuffle size={24} />, name: 'Xếp câu tốc độ', desc: 'Xếp các từ thành câu hội thoại trong 30 giây.', tone: 'from-violet-500/25 to-violet-900/10' },
];

export const GamesView: React.FC<{ onAddXp: (n: number) => void }> = ({ onAddXp }) => {
  const [game, setGame] = useState<GameId | null>(null);
  const [book, setBook] = useState(1);
  const [lesson, setLesson] = useState(0);
  const words = useMemo(() => filterWords(book, lesson), [book, lesson]);
  const sentences = useMemo(() => filterSentences(book, lesson), [book, lesson]);

  const selector = (
    <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Chơi với từ của</div>
      <div className="flex flex-wrap items-center gap-2">
        {BOOKS.map((b) => (
          <button key={b} onClick={() => { setBook(b); setLesson(0); }} className={`rounded-xl px-3 py-1.5 text-sm font-bold ${book === b ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>HSK {b}</button>
        ))}
        <select value={lesson} onChange={(e) => setLesson(Number(e.target.value))} className="ml-auto rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200">
          <option value={0}>Tất cả bài</option>
          {Array.from({ length: lessonCount(book) }, (_, k) => <option key={k} value={k + 1}>Bài {k + 1}</option>)}
        </select>
      </div>
      <div className="mt-2 text-xs text-slate-500">{words.length} từ · {sentences.length} câu</div>
    </div>
  );

  if (!game) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-black tracking-tight text-white">Trò chơi ôn từ</h1>
        <p className="mb-5 mt-1 text-slate-400">Chơi để nhớ từ lâu hơn, mỗi ván thắng đều được cộng XP.</p>
        {selector}
        <div className="grid gap-4 sm:grid-cols-3">
          {GAMES.map((g) => (
            <button key={g.id} onClick={() => setGame(g.id)} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${g.tone} p-5 text-left transition-transform hover:-translate-y-1`}>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">{g.icon}</div>
              <h3 className="mt-3 text-lg font-extrabold text-white">{g.name}</h3>
              <p className="mt-1 text-sm text-slate-300/90">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const cur = GAMES.find((g) => g.id === game)!;
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <button onClick={() => setGame(null)} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Chọn trò khác</button>
      <h2 className="mb-3 text-2xl font-black text-white">{cur.name}</h2>
      {selector}
      {game === 'memory' && <MemoryGame words={words} onWin={onAddXp} />}
      {game === 'listen' && <ListenGame words={words} onWin={onAddXp} />}
      {game === 'sentence' && <SentenceGame sentences={sentences} onWin={onAddXp} />}
    </div>
  );
};
