import React from 'react';
import { LogIn, UserPlus, BookOpen, Flame, Repeat, GraduationCap } from 'lucide-react';

interface LoginWallProps {
  onOpenAuth: (tab: 'login' | 'register') => void;
}

const POINTS = [
  { icon: BookOpen, text: 'Từ vựng HSK, tiếng Anh, ngữ pháp và luyện đề' },
  { icon: Repeat, text: 'Ôn tập thông minh, nhắc đúng lúc cần ôn' },
  { icon: Flame, text: 'Mục tiêu mỗi ngày và chuỗi ngày học' },
  { icon: GraduationCap, text: 'Tiến độ lưu theo tài khoản, học ở máy nào cũng tiếp tục được' },
];

/** Hiện thay cho nội dung học khi chưa đăng nhập. */
export const LoginWall: React.FC<LoginWallProps> = ({ onOpenAuth }) => (
  <div className="max-w-xl mx-auto px-4 py-12 sm:py-20">
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-9 text-center space-y-6 shadow-2xl">
      <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br from-emerald-500 to-sky-500 shadow-lg shadow-emerald-500/20">🐼</div>
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Đăng nhập để bắt đầu học</h1>
        <p className="text-sm text-slate-400">Tạo tài khoản miễn phí, chỉ mất một phút. Có tài khoản rồi thì đăng nhập để học tiếp.</p>
      </div>
      <ul className="text-left space-y-2.5 max-w-sm mx-auto">
        {POINTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-slate-300">
            <Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
        <button onClick={() => onOpenAuth('login')} className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black flex items-center justify-center gap-2 cursor-pointer">
          <LogIn className="w-4 h-4" /> Đăng nhập
        </button>
        <button onClick={() => onOpenAuth('register')} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer border border-slate-700">
          <UserPlus className="w-4 h-4" /> Tạo tài khoản
        </button>
      </div>
    </div>
  </div>
);
