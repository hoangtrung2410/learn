import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { SCOPE_LABEL, scopeProductId, useAccess } from '../lib/access';
import { goPricing, openAuth } from '../lib/nav';

interface LockedPanelProps {
  scope: string;
  /** Mô tả ngắn phần nội dung đang bị khoá, ví dụ "từ vựng HSK 3". */
  what?: string;
  children?: React.ReactNode;
}

/** Khung mời mua khi người dùng mở nội dung trả phí mà chưa có quyền. */
export const LockedPanel: React.FC<LockedPanelProps> = ({ scope, what, children }) => {
  const { user } = useAccess();
  const label = SCOPE_LABEL[scope] || scope;
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-amber-500/30 p-6 sm:p-8 text-center space-y-4" role="region" aria-label={`Nội dung ${label} cần mở khoá`}>
      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
        <Lock className="w-7 h-7 text-amber-300" />
      </div>
      <div>
        <h3 className="text-lg font-black text-white">{what ? `${what} thuộc khoá ${label}` : `Nội dung ${label} cần mở khoá`}</h3>
        <p className="text-sm text-slate-400 mt-1">Mở khoá để học toàn bộ, hoặc nâng cấp Premium để học mọi khoá trả phí.</p>
      </div>
      {children}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => goPricing(scopeProductId(scope))} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black cursor-pointer">
          Mua khoá {label}
        </button>
        <button onClick={() => goPricing('plan-year')} className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black flex items-center gap-1.5 cursor-pointer">
          <Crown className="w-4 h-4" /> Xem gói Premium
        </button>
      </div>
      {!user && (
        <p className="text-xs text-slate-400">
          Đã có tài khoản và đã mua? <button onClick={() => openAuth('login')} className="underline text-purple-300 cursor-pointer">Đăng nhập</button> để mở khoá.
        </p>
      )}
    </div>
  );
};

/** Nhãn khoá nhỏ gắn cạnh nút chọn cấp độ. */
export const LockIcon: React.FC = () => <Lock className="w-3 h-3 text-amber-300" aria-label="Cần mở khoá" />;
