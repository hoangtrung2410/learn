import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const VOCAB_PAGE_SIZE = 10;

interface VocabPagerProps {
  page: number; // 0-based
  total: number;
  onChange: (page: number) => void;
}

export const VocabPager: React.FC<VocabPagerProps> = ({ page, total, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / VOCAB_PAGE_SIZE));
  if (total <= VOCAB_PAGE_SIZE) return null;

  const go = (p: number) => {
    onChange(Math.min(pages - 1, Math.max(0, p)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const btn =
    'flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2 flex-wrap">
      <button type="button" className={`${btn} bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700`} disabled={page === 0} onClick={() => go(page - 1)}>
        <ChevronLeft className="w-4 h-4" /> Trước
      </button>
      <label className="flex items-center gap-1.5 text-xs text-slate-400">
        Trang
        <input
          type="number"
          min={1}
          max={pages}
          value={page + 1}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n)) go(n - 1);
          }}
          className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-center text-xs focus:outline-none focus:border-amber-400"
        />
        / {pages}
      </label>
      <button type="button" className={`${btn} bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700`} disabled={page >= pages - 1} onClick={() => go(page + 1)}>
        Sau <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
