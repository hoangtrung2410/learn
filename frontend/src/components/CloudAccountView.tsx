import React, { useState } from 'react';
import { Crown, KeyRound, UserRound } from 'lucide-react';
import { useAccess } from '../lib/access';
import { getCloud, cloudErrorMessage } from '../lib/cloud';
import { openAuth } from '../lib/nav';

// Trang tài khoản cho bản miễn phí (Supabase): thông tin và đặt/đổi mật khẩu.
// Người đăng nhập bằng link qua email dùng mục này để có mật khẩu cho các lần sau.
export const CloudAccountView: React.FC = () => {
  const { user, ready, isAdmin } = useAccess();
  const [pw, setPw] = useState({ next: '', again: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="py-24 text-center text-sm text-slate-400 animate-pulse">Đang tải…</div>;
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <UserRound className="w-12 h-12 text-slate-500 mx-auto" />
        <p className="text-slate-300">Bạn cần đăng nhập để xem tài khoản.</p>
        <button onClick={() => openAuth('login')} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold cursor-pointer">Đăng nhập</button>
      </div>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (pw.next.length < 8) return setMsg({ ok: false, text: 'Mật khẩu phải có ít nhất 8 ký tự.' });
    if (pw.next !== pw.again) return setMsg({ ok: false, text: 'Mật khẩu nhập lại không khớp.' });
    setBusy(true);
    try {
      await (await getCloud()).setPassword(pw.next);
      setPw({ next: '', again: '' });
      setMsg({ ok: true, text: 'Đã lưu mật khẩu. Lần sau đăng nhập bằng email và mật khẩu này.' });
    } catch (err) {
      setMsg({ ok: false, text: cloudErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <img src={user.avatar} alt="" className="w-16 h-16 rounded-2xl bg-slate-800" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-white truncate">{user.name}</h1>
          <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
        </div>
        {isAdmin && (
          <span className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-amber-400 text-slate-950">
            <Crown className="w-4 h-4" /> Quản trị viên
          </span>
        )}
      </section>

      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6" aria-labelledby="set-pw">
        <h2 id="set-pw" className="text-lg font-black text-white flex items-center gap-2 mb-1"><KeyRound className="w-5 h-5 text-purple-400" /> Đặt / đổi mật khẩu</h2>
        <p className="text-xs text-slate-400 mb-4">Nếu bạn vào bằng link qua email, đặt mật khẩu ở đây để lần sau đăng nhập bằng mật khẩu.</p>
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-3 items-end">
          <div><label htmlFor="cpw-new" className="block text-xs font-bold text-slate-300 mb-1.5">Mật khẩu mới</label><input id="cpw-new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="Ít nhất 8 ký tự" className={input} /></div>
          <div><label htmlFor="cpw-again" className="block text-xs font-bold text-slate-300 mb-1.5">Nhập lại mật khẩu</label><input id="cpw-again" type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} className={input} /></div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy || !pw.next} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold cursor-pointer">{busy ? 'Đang lưu…' : 'Lưu mật khẩu'}</button>
            {msg && <span role="status" className={`text-xs ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</span>}
          </div>
        </form>
      </section>
    </div>
  );
};
