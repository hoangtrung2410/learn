import React, { useState, useEffect } from 'react';
import { User, UserStats } from '../types';
import {
  X,
  Crown,
  Users,
  Cpu,
  Gem,
  CheckCircle,
  RefreshCw,
  Award,
  Zap,
} from 'lucide-react';
import { playPopSound, playSuccessSound } from '../utils/audio';

interface SuperAdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  stats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
}

export const SuperAdminPanelModal: React.FC<SuperAdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  stats,
  onUpdateStats,
}) => {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleGrantMaxGems = () => {
    playSuccessSound();
    onUpdateStats({
      gems: 99999,
      xp: stats.xp + 5000,
      hearts: 999,
      maxHearts: 999,
      streak: 99,
    });
    setActionNotice('Đã cấp đặc quyền Super Admin: 99,999 Kim Cương, +5000 XP & Vô hạn Tim!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleUnlockAll = () => {
    playSuccessSound();
    onUpdateStats({
      completedLessons: ['u1-l1', 'u1-l2', 'u1-l3', 'u2-l1', 'u2-l2', 'u3-l1', 'u3-l2'],
    });
    setActionNotice('Đã mở khóa toàn bộ lộ trình bài học HSK!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Bảng Quản Trị Super Admin</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Level VIP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Đăng nhập bởi: <strong className="text-amber-300">{currentUser.name}</strong> (@{currentUser.username})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {actionNotice && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            {actionNotice}
          </div>
        )}

        {/* Quick Power Actions for Super Admin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleGrantMaxGems}
            className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 hover:border-amber-400 text-left transition-all hover:scale-[1.01] flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300">
                Nạp 99,999 Kim Cương & Tim Vô Hạn
              </h4>
              <p className="text-xs text-slate-400">Mở toàn bộ tài nguyên học liệu cao cấp</p>
            </div>
          </button>

          <button
            onClick={handleUnlockAll}
            className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all hover:scale-[1.01] flex items-center gap-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">
                Mở Khóa Toàn Bộ Lộ Trình HSK
              </h4>
              <p className="text-xs text-slate-400">Truy cập tất cả các Unit bài học</p>
            </div>
          </button>
        </div>

        {/* Server & AI Status */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> Trạng thái AI Engine & Server
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              Hoạt động 100%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60">
              <span className="text-slate-400 block">Mô hình AI:</span>
              <strong className="text-purple-300 font-bold">gemini-3.8-flash</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60">
              <span className="text-slate-400 block">Dự phòng:</span>
              <strong className="text-cyan-300 font-bold">gemini-flash-latest</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/60">
              <span className="text-slate-400 block">Backend:</span>
              <strong className="text-emerald-300 font-bold">NestJS Module</strong>
            </div>
          </div>
        </div>

        {/* Users Database in System */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              Tài khoản trong hệ thống ({usersList.length}):
            </span>
            <button
              onClick={() => {
                playPopSound();
                loadUsers();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2">
            {usersList.map((u) => {
              const isSuper = u.role === 'superadmin';
              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                    isSuper
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-600"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{u.name}</span>
                        {isSuper && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                            👑 SUPER ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        @{u.username} {u.email ? `• ${u.email}` : ''}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold uppercase text-[10px]">
                    {u.provider}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Đóng Bảng Quản Trị
          </button>
        </div>
      </div>
    </div>
  );
};
