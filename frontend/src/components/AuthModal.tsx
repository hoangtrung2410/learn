import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, User as UserIcon, Lock, ArrowRight, KeyRound, CheckCircle2, Mail, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import { useAccess } from '../lib/access';
import { CLOUD_AUTH, getCloud, cloudErrorMessage } from '../lib/cloud';
import { playPopSound, playSuccessSound } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  notice?: string | null;
  onOpenLegal?: (page: 'terms' | 'privacy') => void;
  onSuccess?: () => void;
}

const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputCls =
  'w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login', notice, onOpenLegal, onSuccess }) => {
  const { setSession } = useAccess();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): string | null => {
    if (CLOUD_AUTH) {
      if (!EMAIL_RE.test(email.trim())) return 'Email không hợp lệ.';
      if (tab === 'login') return password ? null : 'Vui lòng nhập mật khẩu.';
      if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
      if (password !== confirm) return 'Mật khẩu nhập lại không khớp.';
      return agree ? null : 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.';
    }
    if (tab === 'login') return !username.trim() || !password ? 'Vui lòng nhập tên đăng nhập (hoặc email) và mật khẩu.' : null;
    if (!USERNAME_RE.test(username.trim().toLowerCase())) return 'Tên đăng nhập gồm 3-30 ký tự: chữ thường, số, dấu . _ -';
    if (!EMAIL_RE.test(email.trim())) return 'Email không hợp lệ.';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (password !== confirm) return 'Mật khẩu nhập lại không khớp.';
    if (!agree) return 'Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    if (CLOUD_AUTH) {
      try {
        const cloud = await getCloud();
        const mail = email.trim().toLowerCase();
        if (tab === 'login') {
          const u = await cloud.signIn(mail, password);
          setSuccess('Đăng nhập thành công!');
          setSession(u, '');
        } else {
          const r = await cloud.signUp(mail, password, name.trim());
          if (r.needsConfirm || !r.user) {
            setSuccess('Đã gửi email xác nhận. Mở email, bấm vào liên kết xác nhận rồi quay lại đăng nhập.');
            setLoading(false);
            return;
          }
          setSuccess('Đăng ký thành công!');
          setSession(r.user, '');
        }
        playSuccessSound();
        setPassword('');
        setConfirm('');
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 600);
      } catch (err: any) {
        setError(cloudErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      const data = await api(tab === 'login' ? '/api/auth/login' : '/api/auth/register', {
        body: tab === 'login' ? { username, password } : { username, email, password, name },
      });
      playSuccessSound();
      setSuccess(data.message || 'Thành công!');
      setSession(data.user, data.token);
      setPassword('');
      setConfirm('');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: 'login' | 'register') => {
    playPopSound();
    setTab(t);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" role="dialog" aria-modal="true" aria-label="Đăng nhập hoặc đăng ký">
      <div className="relative w-full max-w-md max-h-[94vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
              <p className="text-xs text-slate-400">LinguaHub AI</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {notice && <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">{notice}</div>}

        <div className="flex rounded-xl bg-slate-800 p-1 text-xs font-bold">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${tab === t ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {t === 'login' ? 'Đăng nhập' : 'Tạo tài khoản mới'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {tab === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-bold text-slate-300 mb-1.5">Họ và tên</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input id="auth-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Nguyễn Văn A" maxLength={60} className={inputCls} />
              </div>
            </div>
          )}

          {!CLOUD_AUTH && (
          <div>
            <label htmlFor="auth-username" className="block text-xs font-bold text-slate-300 mb-1.5">{tab === 'login' ? 'Tên đăng nhập hoặc email' : 'Tên đăng nhập'}</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input id="auth-username" type="text" autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={tab === 'login' ? 'user_abc hoặc email@gmail.com' : 'Ví dụ: user_abc'} className={inputCls + ' font-mono'} />
            </div>
          </div>
          )}

          {(tab === 'register' || CLOUD_AUTH) && (
            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@gmail.com" className={inputCls} />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-password" className="block text-xs font-bold text-slate-300 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input id="auth-password" type={showPw ? 'text' : 'password'} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tab === 'register' ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'} className={inputCls + ' pr-11'} />
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-2.5 p-1 text-slate-500 hover:text-white cursor-pointer">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <>
              <div>
                <label htmlFor="auth-confirm" className="block text-xs font-bold text-slate-300 mb-1.5">Nhập lại mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input id="auth-confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" className={inputCls} />
                </div>
              </div>
              <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-purple-500" />
                <span>
                  Tôi đồng ý với{' '}
                  <button type="button" onClick={() => onOpenLegal?.('terms')} className="text-purple-300 underline cursor-pointer">Điều khoản sử dụng</button> và{' '}
                  <button type="button" onClick={() => onOpenLegal?.('privacy')} className="text-purple-300 underline cursor-pointer">Chính sách bảo mật</button>.
                </span>
              </label>
            </>
          )}

          {error && <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">{error}</div>}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
            {loading ? <span className="animate-pulse">Đang xử lý...</span> : (<><span>{tab === 'login' ? 'Đăng nhập' : 'Hoàn tất đăng ký'}</span><ArrowRight className="w-4 h-4" /></>)}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center">
          Quên mật khẩu? Liên hệ hỗ trợ để được cấp lại mật khẩu tạm.
        </p>
      </div>
    </div>
  );
};
