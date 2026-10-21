import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar, AppNavTab } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { FontSettingsModal } from './components/FontSettingsModal';
import { LanguageCode, UserStats, User } from './types';

// Mỗi màn hình tải riêng khi mở lần đầu, giúp trang chủ nhẹ và mở nhanh.
const LearningPathView = lazy(() => import('./components/LearningPathView').then((m) => ({ default: m.LearningPathView })));
const SpeakingLabView = lazy(() => import('./components/SpeakingLabView').then((m) => ({ default: m.SpeakingLabView })));
const AiRoleplayView = lazy(() => import('./components/AiRoleplayView').then((m) => ({ default: m.AiRoleplayView })));
const PinyinMatrixView = lazy(() => import('./components/PinyinMatrixView').then((m) => ({ default: m.PinyinMatrixView })));
const StoreView = lazy(() => import('./components/StoreView').then((m) => ({ default: m.StoreView })));
const DictionaryView = lazy(() => import('./components/DictionaryView').then((m) => ({ default: m.DictionaryView })));
const HskExamHubView = lazy(() => import('./components/HskExamHubView').then((m) => ({ default: m.HskExamHubView })));
const EnglishVocabHubView = lazy(() => import('./components/EnglishVocabHubView').then((m) => ({ default: m.EnglishVocabHubView })));
const StudyCenterView = lazy(() => import('./components/StudyCenterView').then((m) => ({ default: m.StudyCenterView })));
const SuperAdminPanelModal = lazy(() => import('./components/SuperAdminPanelModal').then((m) => ({ default: m.SuperAdminPanelModal })));

export default function App() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('linguahub_current_lang');
    if (saved && (saved === 'zh' || saved === 'en' || saved === 'ja' || saved === 'ko')) {
      return saved as LanguageCode;
    }
    return 'zh';
  });
  const [activeTab, setActiveTab] = useState<AppNavTab>('learn');

  useEffect(() => {
    localStorage.setItem('linguahub_current_lang', currentLang);
  }, [currentLang]);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('linguahub_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default: seed Super Admin if requested, or prompt login
    return null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
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
      streak: 7,
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

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('linguahub_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('linguahub_user');
    }
  }, [currentUser]);

  const handleAddXp = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      xp: prev.xp + amount,
      gems: prev.gems + Math.floor(amount / 2),
      speakingPracticedCount: prev.speakingPracticedCount + 1,
    }));
  };

  const handleFinishLesson = (xpEarned: number, lessonId: string) => {
    setStats((prev) => ({
      ...prev,
      xp: prev.xp + xpEarned,
      gems: prev.gems + 15,
      streak: prev.streak + 1,
      completedLessons: prev.completedLessons.includes(lessonId)
        ? prev.completedLessons
        : [...prev.completedLessons, lessonId],
    }));
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'superadmin') {
      setStats((prev) => ({
        ...prev,
        gems: Math.max(prev.gems, 9999),
        hearts: 999,
        maxHearts: 999,
      }));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUpdateStats = (newStats: Partial<UserStats>) => {
    setStats((prev) => ({
      ...prev,
      ...newStats,
    }));
  };

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
        onChangeTab={(tab) => setActiveTab(tab)}
        stats={stats}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAdminPanel={() => setAdminModalOpen(true)}
        onOpenFontSettings={() => setFontModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16 overflow-x-hidden">
        <Suspense fallback={<div className="py-24 text-center text-sm text-slate-400 animate-pulse">Đang tải…</div>}>
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

        {activeTab === 'store' && <StoreView currentLang={currentLang} />}
        </Suspense>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Super Admin Panel Modal */}
      {currentUser && adminModalOpen && (
        <Suspense fallback={null}>
        <SuperAdminPanelModal
          isOpen={adminModalOpen}
          onClose={() => setAdminModalOpen(false)}
          currentUser={currentUser}
          stats={stats}
          onUpdateStats={handleUpdateStats}
        />
        </Suspense>
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
          <div className="flex items-center gap-3 text-slate-400">
            <span>Chuẩn Khung HSK 3.0 & CEFR</span>
            <span>•</span>
            <span>Hệ Thống AI Độc Quyền</span>
            <span>•</span>
            <span>Bảo Mật An Toàn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
