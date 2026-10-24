import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar, AppNavTab } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { FontSettingsModal } from './components/FontSettingsModal';
import { LanguageCode, UserStats } from './types';
import { useAccess, Product } from './lib/access';
import { getToken, FREE_MODE } from './lib/api';
import { GotoDetail } from './lib/nav';
import { logActivity, getStreak } from './lib/daily';
import { CheckoutModal } from './components/CheckoutModal';
import { MockPayPage, PaymentResultModal } from './components/PaymentPages';
import { LoginWall } from './components/LoginWall';
import { AUTH_REQUIRED } from './lib/cloud';

// Mỗi màn hình tải riêng khi mở lần đầu, giúp trang chủ nhẹ và mở nhanh.
const LearningPathView = lazy(() => import('./components/LearningPathView').then((m) => ({ default: m.LearningPathView })));
const SpeakingLabView = lazy(() => import('./components/SpeakingLabView').then((m) => ({ default: m.SpeakingLabView })));
const AiRoleplayView = lazy(() => import('./components/AiRoleplayView').then((m) => ({ default: m.AiRoleplayView })));
const PinyinMatrixView = lazy(() => import('./components/PinyinMatrixView').then((m) => ({ default: m.PinyinMatrixView })));
const PricingView = lazy(() => import('./components/PricingView').then((m) => ({ default: m.PricingView })));
const HomeView = lazy(() => import('./components/HomeView').then((m) => ({ default: m.HomeView })));
const AccountView = lazy(() => import('./components/AccountView').then((m) => ({ default: m.AccountView })));
const AdminView = lazy(() => import('./components/AdminView').then((m) => ({ default: m.AdminView })));
const LegalView = lazy(() => import('./components/LegalView').then((m) => ({ default: m.LegalView })));
const DictionaryView = lazy(() => import('./components/DictionaryView').then((m) => ({ default: m.DictionaryView })));
const HskExamHubView = lazy(() => import('./components/HskExamHubView').then((m) => ({ default: m.HskExamHubView })));
const EnglishVocabHubView = lazy(() => import('./components/EnglishVocabHubView').then((m) => ({ default: m.EnglishVocabHubView })));
const StudyCenterView = lazy(() => import('./components/StudyCenterView').then((m) => ({ default: m.StudyCenterView })));

export default function App() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('linguahub_current_lang');
    if (saved && (saved === 'zh' || saved === 'en')) {
      return saved as LanguageCode;
    }
    return 'zh';
  });
  const { user: currentUser, ready, logout, isAdmin } = useAccess();
  const [activeTab, setActiveTab] = useState<AppNavTab>(() => (FREE_MODE || getToken() ? 'learn' : 'home'));
  const [legalPage, setLegalPage] = useState<'terms' | 'privacy' | 'refund'>('terms');
  const [pricingHighlight, setPricingHighlight] = useState<string | undefined>();
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Trạng thái quay về từ cổng thanh toán, đọc 1 lần từ URL.
  const [query] = useState(() => new URLSearchParams(window.location.search));
  const [paymentStatus, setPaymentStatus] = useState<string | null>(query.get('payment'));
  const [mockPayCode, setMockPayCode] = useState<string | null>(query.get('mockpay'));
  const orderCode = query.get('order');
  const [quotaMsg, setQuotaMsg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('linguahub_current_lang', currentLang);
  }, [currentLang]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [fontModalOpen, setFontModalOpen] = useState(false);

  // Gamification Stats persistent in localStorage
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('linguahub_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      xp: 250,
      streak: 0,
      hearts: 5,
      maxHearts: 5,
      gems: 850,
      completedLessons: ['zh-u1-l1'],
      speakingPracticedCount: 18,
      averagePronunciationScore: 92,
    };
  });

  useEffect(() => {
    localStorage.setItem('linguahub_stats', JSON.stringify(stats));
  }, [stats]);

  // Chuỗi ngày học thật, tính từ nhật ký học hằng ngày.
  useEffect(() => {
    const sync = () => setStats((prev) => (prev.streak === getStreak() ? prev : { ...prev, streak: getStreak() }));
    sync();
    window.addEventListener('lp:daily', sync);
    return () => window.removeEventListener('lp:daily', sync);
  }, []);

  const handleAddXp = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      xp: prev.xp + amount,
      gems: prev.gems + Math.floor(amount / 2),
      speakingPracticedCount: prev.speakingPracticedCount + 1,
    }));
  };

  const handleFinishLesson = (xpEarned: number, lessonId: string) => {
    logActivity('lesson');
    setStats((prev) => ({
      ...prev,
      xp: prev.xp + xpEarned,
      gems: prev.gems + 15,
      completedLessons: prev.completedLessons.includes(lessonId)
        ? prev.completedLessons
        : [...prev.completedLessons, lessonId],
    }));
  };

  // Điều hướng / mở đăng nhập từ các component con qua sự kiện toàn cục.
  useEffect(() => {
    const onGoto = (e: Event) => {
      const d = (e as CustomEvent<GotoDetail>).detail;
      if (d.legal) setLegalPage(d.legal);
      setPricingHighlight(d.highlight);
      setActiveTab(d.tab as AppNavTab);
      window.scrollTo({ top: 0 });
    };
    const onAuth = (e: Event) => {
      const d = (e as CustomEvent<{ tab?: 'login' | 'register'; notice?: string }>).detail || {};
      setAuthTab(d.tab || 'login');
      setAuthNotice(d.notice || null);
      setAuthModalOpen(true);
    };
    const onQuota = (e: Event) => setQuotaMsg((e as CustomEvent<{ message: string }>).detail.message);
    window.addEventListener('lp:quota', onQuota);
    window.addEventListener('lp:goto', onGoto);
    window.addEventListener('lp:auth', onAuth);
    return () => {
      window.removeEventListener('lp:quota', onQuota);
      window.removeEventListener('lp:goto', onGoto);
      window.removeEventListener('lp:auth', onAuth);
    };
  }, []);

  // Đăng xuất / mất phiên khi đang ở trang chỉ dành cho người đã đăng nhập.
  useEffect(() => {
    if (ready && !currentUser && (activeTab === 'account' || activeTab === 'admin')) setActiveTab('home');
  }, [ready, currentUser, activeTab]);

  const handleBuy = (p: Product) => {
    if (!currentUser) {
      setPendingProduct(p);
      setAuthTab('register');
      setAuthNotice(`Tạo tài khoản hoặc đăng nhập để mua "${p.name}".`);
      setAuthModalOpen(true);
      return;
    }
    setCheckoutProduct(p);
  };

  const changeTab = (tab: AppNavTab) => {
    setPricingHighlight(undefined);
    setActiveTab(tab);
    window.scrollTo({ top: 0 });
  };

  // Đang ở trang cổng thanh toán thử nghiệm: hiển thị riêng, không kèm giao diện học.
  if (mockPayCode) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100">
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <MockPayPage code={mockPayCode} onDone={() => setMockPayCode(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentLang={currentLang}
        onSelectLang={(lang) => {
          setCurrentLang(lang);
          if (lang !== 'zh' && (activeTab === 'hsk-prep' || activeTab === 'pinyin')) {
            setActiveTab('english-vocab');
          } else if (lang === 'zh' && activeTab === 'english-vocab') {
            setActiveTab('hsk-prep');
          }
        }}
        activeTab={activeTab}
        onChangeTab={changeTab}
        stats={stats}
        currentUser={currentUser}
        onOpenAuth={() => { setAuthTab('login'); setAuthNotice(null); setAuthModalOpen(true); }}
        onOpenFontSettings={() => setFontModalOpen(true)}
        onLogout={() => { logout(); changeTab(FREE_MODE ? 'learn' : 'home'); }}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16 overflow-x-hidden">
        {AUTH_REQUIRED && !ready ? (
          <div className="py-24 text-center text-sm text-slate-400 animate-pulse">Đang tải…</div>
        ) : AUTH_REQUIRED && !currentUser && !['home', 'pricing', 'legal'].includes(activeTab) ? (
          <LoginWall onOpenAuth={(tab) => { setAuthTab(tab); setAuthNotice('Đăng nhập để vào học.'); setAuthModalOpen(true); }} />
        ) : (
        <Suspense fallback={<div className="py-24 text-center text-sm text-slate-400 animate-pulse">Đang tải…</div>}>
        {activeTab === 'home' && (
          <HomeView
            onNavigate={(tab) => changeTab(tab)}
            onOpenAuth={(tab) => { setAuthTab(tab || 'login'); setAuthNotice(null); setAuthModalOpen(true); }}
          />
        )}

        {activeTab === 'learn' && (
          <LearningPathView
            currentLang={currentLang}
            completedLessonIds={stats.completedLessons}
            onFinishLesson={handleFinishLesson}
            onOpenSpeakingLab={() => setActiveTab('speaking')}
          />
        )}

        {activeTab === 'study' && (
          <StudyCenterView currentLang={currentLang} onAddXp={handleAddXp} />
        )}

        {activeTab === 'hsk-prep' && (
          <HskExamHubView onAddXp={handleAddXp} />
        )}

        {activeTab === 'english-vocab' && (
          <EnglishVocabHubView onAddXp={handleAddXp} />
        )}

        {activeTab === 'speaking' && (
          <SpeakingLabView currentLang={currentLang} onAddXp={handleAddXp} />
        )}

        {activeTab === 'roleplay' && (
          <AiRoleplayView currentLang={currentLang} onAddXp={handleAddXp} />
        )}

        {activeTab === 'pinyin' && <PinyinMatrixView />}

        {activeTab === 'dictionary' && <DictionaryView currentLang={currentLang} />}

        {activeTab === 'pricing' && <PricingView onBuy={handleBuy} highlight={pricingHighlight} />}

        {activeTab === 'account' && <AccountView />}

        {activeTab === 'admin' && (isAdmin ? <AdminView /> : <div className="py-24 text-center text-sm text-slate-400">Bạn không có quyền truy cập trang này.</div>)}

        {activeTab === 'legal' && <LegalView page={legalPage} onChangePage={setLegalPage} />}
        </Suspense>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authTab}
        notice={authNotice}
        onOpenLegal={(page) => { setAuthModalOpen(false); setLegalPage(page); changeTab('legal'); }}
        onSuccess={() => {
          if (pendingProduct) {
            setCheckoutProduct(pendingProduct);
            setPendingProduct(null);
          }
        }}
      />

      <CheckoutModal product={checkoutProduct} onClose={() => setCheckoutProduct(null)} />

      {paymentStatus && (
        <PaymentResultModal status={paymentStatus} code={orderCode} onClose={() => setPaymentStatus(null)} />
      )}

      {quotaMsg && (
        <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl p-4 flex items-start gap-3">
          <p className="text-sm text-amber-100 flex-1">{quotaMsg}</p>
          <button onClick={() => { setQuotaMsg(null); changeTab('pricing'); }} className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shrink-0 cursor-pointer">Nâng cấp</button>
          <button onClick={() => setQuotaMsg(null)} aria-label="Đóng thông báo" className="text-slate-400 hover:text-white text-lg leading-none cursor-pointer">×</button>
        </div>
      )}

      {/* Font Settings Modal */}
      <FontSettingsModal
        isOpen={fontModalOpen}
        onClose={() => setFontModalOpen(false)}
      />

      {/* Product Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐼</span>
            <span className="font-extrabold text-sm text-slate-200 whitespace-nowrap">LinguaHub AI</span>
            <span>—</span>
            <span>Nền tảng học Tiếng Trung & Ngoại ngữ tương tác</span>
          </div>
          {!FREE_MODE && <nav aria-label="Liên kết chân trang" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-slate-400">
            <button onClick={() => changeTab('pricing')} className="hover:text-white cursor-pointer">Bảng giá</button>
            <button onClick={() => { setLegalPage('terms'); changeTab('legal'); }} className="hover:text-white cursor-pointer">Điều khoản</button>
            <button onClick={() => { setLegalPage('privacy'); changeTab('legal'); }} className="hover:text-white cursor-pointer">Bảo mật</button>
            <button onClick={() => { setLegalPage('refund'); changeTab('legal'); }} className="hover:text-white cursor-pointer">Hoàn tiền</button>
          </nav>}
        </div>
      </footer>
    </div>
  );
}
