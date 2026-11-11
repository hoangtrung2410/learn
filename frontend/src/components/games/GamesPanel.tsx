import React, { useState } from 'react';
import { ArrowLeft, Ear, Layers, Shuffle } from 'lucide-react';
import { GameItem, GameLang, GameSentence } from './types';
import { MemoryGame } from './MemoryGame';
import { ListenGame } from './ListenGame';
import { SentenceGame } from './SentenceGame';

type GameId = 'memory' | 'listen' | 'sentence';

const GAMES: { id: GameId; icon: React.ReactNode; name: string; desc: string; tone: string }[] = [
  { id: 'memory', icon: <Layers size={22} />, name: 'Ghép cặp', desc: 'Lật thẻ để ghép từ với nghĩa tiếng Việt.', tone: 'from-emerald-500/25 to-emerald-900/10' },
  { id: 'listen', icon: <Ear size={22} />, name: 'Nghe và chọn', desc: 'Nghe giọng đọc rồi chọn đúng từ. Sai 3 lần là hết tim.', tone: 'from-sky-500/25 to-sky-900/10' },
  { id: 'sentence', icon: <Shuffle size={22} />, name: 'Xếp câu tốc độ', desc: 'Xếp các từ thành câu ví dụ trong 30 giây.', tone: 'from-violet-500/25 to-violet-900/10' },
];

interface Props {
  lang: GameLang;
  items: GameItem[];
  sentences: GameSentence[];
  onAddXp: (n: number) => void;
}

/** Game ôn từ — dùng đúng danh sách từ đang lọc trong màn hình học từ (tiếng Trung hoặc tiếng Anh). */
export const GamesPanel: React.FC<Props> = ({ lang, items, sentences, onAddXp }) => {
  const [game, setGame] = useState<GameId | null>(null);
  const info = <p className="mb-4 text-xs text-slate-500">Chơi với {items.length} từ đang chọn ở bộ lọc phía trên {lang === 'zh' ? '(tiếng Trung)' : '(tiếng Anh)'}.</p>;

  if (!game) {
    return (
      <div>
        <h3 className="text-xl font-black text-white">Trò chơi ôn từ</h3>
        <p className="mb-1 mt-1 text-sm text-slate-400">Chơi để nhớ từ lâu hơn, mỗi ván thắng đều được cộng XP.</p>
        {info}
        <div className="grid gap-3 sm:grid-cols-3">
          {GAMES.map((g) => (
            <button key={g.id} onClick={() => setGame(g.id)} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${g.tone} p-4 text-left transition-transform hover:-translate-y-1`}>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">{g.icon}</div>
              <h4 className="mt-3 text-base font-extrabold text-white">{g.name}</h4>
              <p className="mt-1 text-xs text-slate-300/90">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => setGame(null)} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Chọn trò khác</button>
      {info}
      {game === 'memory' && <MemoryGame words={items} onWin={onAddXp} />}
      {game === 'listen' && <ListenGame words={items} onWin={onAddXp} />}
      {game === 'sentence' && <SentenceGame sentences={sentences} onWin={onAddXp} />}
    </div>
  );
};
