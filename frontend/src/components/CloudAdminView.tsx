import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, Loader2, RefreshCw, Search, Users } from 'lucide-react';
import { getCloud, cloudErrorMessage, type CloudUserRow } from '../lib/cloud';
import { useAccess } from '../lib/access';

// Trang quản trị cho bản miễn phí (Supabase): xem người dùng, tiến độ học, cấp/gỡ quyền quản trị.

const cardCls = 'bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5';
const btnCls =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

const parse = <T,>(s: string | undefined, d: T): T => {
  try {
    return s ? (JSON.parse(s) ?? d) : d;
  } catch {
    return d;
  }
};

/** Rút các số liệu học tập từ bản sao localStorage đã đồng bộ. */
function summarize(p: Record<string, string> | null) {
  const stats = parse<{ xp?: number; streak?: number; completedLessons?: string[] }>(p?.linguahub_stats, {});
  const count = (k: string) => Object.values(parse<Record<string, boolean>>(p?.[k], {})).filter(Boolean).length;
  return {
    xp: stats.xp ?? 0,
    streak: stats.streak ?? 0,
    lessons: stats.completedLessons?.length ?? 0,
    zhWords: count('lp_hsk_mastered'),
    enWords: count('linguahub_mastered_en_vocab'),
  };
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const CloudAdminView: React.FC = () => {
  const { user } = useAccess();
  const [rows, setRows] = useState<CloudUserRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await (await getCloud()).listUsers());
      setError('');
    } catch (e) {
      setError(cloudErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || [])
      .map((r) => ({ ...r, sum: summarize(r.progress) }))
      .filter((r) => !s || r.email.toLowerCase().includes(s) || r.name.toLowerCase().includes(s));
  }, [rows, q]);

  const totals = useMemo(() => {
    const all = (rows || []).map((r) => summarize(r.progress));
    const week = Date.now() - 7 * 864e5;
    return {
      users: rows?.length ?? 0,
      active: (rows || []).filter((r) => r.lastSignInAt && new Date(r.lastSignInAt).getTime() > week).length,
      unconfirmed: (rows || []).filter((r) => !r.confirmed).length,
      xp: all.reduce((a, s) => a + s.xp, 0),
    };
  }, [rows]);

  const toggleAdmin = async (r: CloudUserRow) => {
    const make = !r.isAdmin;
    if (!window.confirm(make ? `Cấp quyền quản trị cho ${r.email}?` : `Gỡ quyền quản trị của ${r.email}?`)) return;
    setBusy(r.id);
    setMsg('');
    try {
      await (await getCloud()).setAdmin(r.email, make);
      setMsg(make ? `Đã cấp quyền quản trị cho ${r.email}.` : `Đã gỡ quyền quản trị của ${r.email}.`);
      await reload();
    } catch (e) {
      setError(cloudErrorMessage(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-400" /> Quản trị
        </h2>
        <button type="button" onClick={() => void reload()} disabled={loading} className={`${btnCls} bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700`}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Tải lại
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Người dùng', value: totals.users },
          { label: 'Hoạt động 7 ngày', value: totals.active },
          { label: 'Chưa xác nhận email', value: totals.unconfirmed },
          { label: 'Tổng XP', value: totals.xp.toLocaleString('vi-VN') },
        ].map((s) => (
          <div key={s.label} className={cardCls}>
            <div className="text-xs text-slate-400 font-semibold">{s.label}</div>
            <div className="text-2xl font-black text-white mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {error && <div role="alert" className="rounded-xl border px-3 py-2 text-sm bg-rose-500/10 border-rose-500/30 text-rose-300">{error}</div>}
      {msg && <div role="status" className="rounded-xl border px-3 py-2 text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-300">{msg}</div>}

      <div className={cardCls}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-400" />
          <h3 className="font-bold text-white text-sm">Danh sách người dùng</h3>
          <div className="ml-auto relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm email hoặc tên..."
              aria-label="Tìm người dùng"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {loading && !rows ? (
          <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
          </div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">Chưa có người dùng nào.</div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-3 font-semibold">Người dùng</th>
                  <th className="py-2 px-3 font-semibold">Đăng ký</th>
                  <th className="py-2 px-3 font-semibold">Đăng nhập gần nhất</th>
                  <th className="py-2 px-3 font-semibold text-right">XP</th>
                  <th className="py-2 px-3 font-semibold text-right">Chuỗi</th>
                  <th className="py-2 px-3 font-semibold text-right">Bài học</th>
                  <th className="py-2 px-3 font-semibold text-right">Từ đã thuộc</th>
                  <th className="py-2 px-3 font-semibold text-right">Quyền</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {r.name || r.email.split('@')[0]}
                        {r.isAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" aria-label="Quản trị viên" />}
                      </div>
                      <div className="text-xs text-slate-400">
                        {r.email}
                        {!r.confirmed && <span className="ml-1.5 text-amber-300">· chưa xác nhận</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{fmt(r.createdAt)}</td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{fmt(r.lastSignInAt)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{r.sum.xp.toLocaleString('vi-VN')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{r.sum.streak}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{r.sum.lessons}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300 whitespace-nowrap">
                      {r.sum.zhWords} 中 · {r.sum.enWords} EN
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {r.email.toLowerCase() === user?.email?.toLowerCase() ? (
                        <span className="text-xs text-slate-500">Bạn</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => void toggleAdmin(r)}
                          className={`${btnCls} ${
                            r.isAdmin
                              ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
                              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          {r.isAdmin ? 'Gỡ quản trị' : 'Cấp quản trị'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
