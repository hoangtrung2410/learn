import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, getToken, setToken, FREE_MODE } from './api';
import { CLOUD_AUTH, getCloud, pullProgress, startAutoSync, stopAutoSync, flushProgress, clearLocalProgress } from './cloud';
import type { User } from '../types';

export interface Entitlement {
  id: number;
  productId: string;
  name: string;
  kind: 'plan' | 'course';
  scopes: string[];
  startsAt: number;
  expiresAt: number | null;
}

export interface Product {
  id: string;
  kind: 'plan' | 'course';
  name: string;
  tagline: string;
  description: string;
  priceVnd: number;
  listPriceVnd: number;
  durationDays: number | null;
  scopes: string[];
  highlight: boolean;
  active?: boolean;
}

interface AccessState {
  user: User | null;
  ready: boolean;
  scopes: string[];
  tier: 'free' | 'paid' | 'premium';
  planUntil: number | null;
  entitlements: Entitlement[];
  ai: { used: number; limit: number } | null;
  hasScope: (scope: string) => boolean;
  isAdmin: boolean;
  setSession: (user: User, token: string) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const FREE = ['zh12', 'ena'];
const Ctx = createContext<AccessState | null>(null);

export const useAccess = (): AccessState => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAccess phải nằm trong AccessProvider');
  return v;
};

// Quy đổi cấp độ nội dung → quyền truy cập cần có.
export const zhLevelScope = (level: number): string => (level <= 2 ? 'zh12' : level <= 4 ? 'zh34' : level <= 6 ? 'zh56' : 'zh79');
export const enLevelScope = (level: string, pack?: string): string => {
  if (pack === 'toeic') return 'toeic';
  if (pack === 'ielts') return 'ielts';
  return level === 'A1' || level === 'A2' ? 'ena' : level === 'B1' || level === 'B2' ? 'enb' : 'enc';
};
export const SCOPE_LABEL: Record<string, string> = {
  zh12: 'HSK 1-2',
  zh34: 'HSK 3-4',
  zh56: 'HSK 5-6',
  zh79: 'HSK 7-9',
  ena: 'Tiếng Anh A1-A2',
  enb: 'Tiếng Anh B1-B2',
  enc: 'Tiếng Anh C1',
  toeic: 'TOEIC',
  ielts: 'IELTS',
};
/** Sản phẩm khoá học tương ứng một scope (để dẫn người dùng tới đúng trang mua). */
export const scopeProductId = (scope: string): string => `course-${scope}`;

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const cloudUserId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [scopes, setScopes] = useState<string[]>(FREE);
  const [tier, setTier] = useState<AccessState['tier']>('free');
  const [planUntil, setPlanUntil] = useState<number | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [ai, setAi] = useState<AccessState['ai']>(null);

  const reset = useCallback(() => {
    setUser(null);
    setScopes(FREE);
    setTier('free');
    setPlanUntil(null);
    setEntitlements([]);
    setAi(null);
  }, []);

  const loadAccess = useCallback(async () => {
    const a = await api('/api/me/access');
    setScopes(a.scopes);
    setTier(a.tier);
    setPlanUntil(a.planUntil ?? null);
    setEntitlements(a.entitlements);
    setAi(a.ai);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    try {
      const me = await api('/api/auth/me');
      setUser(me.user);
      await loadAccess();
    } catch {
      /* token hết hạn sẽ được xử lý ở sự kiện lp:unauthorized */
    }
  }, [loadAccess]);

  // Bản miễn phí dùng Supabase: lấy tiến độ từ tài khoản về máy, rồi tự đẩy thay đổi lên.
  const syncAfterLogin = useCallback(async (u: User) => {
    try {
      const r = await pullProgress(u.id);
      if (r === 'reload') {
        window.location.reload();
        return;
      }
    } catch {
      /* chưa đồng bộ được: vẫn cho học, lần sau thử lại */
    }
    startAutoSync(u.id);
  }, []);

  // Khôi phục phiên đăng nhập khi mở trang.
  useEffect(() => {
    if (CLOUD_AUTH) {
      let off: (() => void) | undefined;
      let alive = true;
      (async () => {
        try {
          const cloud = await getCloud();
          const u = await cloud.getUser();
          if (!alive) return;
          if (u) {
            cloudUserId.current = u.id;
            setUser(u);
            await syncAfterLogin(u);
          }
          off = cloud.onChange((next) => {
            const cur = cloudUserId.current;
            if (next && cur !== next.id) void syncAfterLogin(next);
            if (!next && cur) stopAutoSync();
            cloudUserId.current = next ? next.id : null;
            setUser(next);
          });
        } finally {
          if (alive) setReady(true);
        }
      })();
      return () => {
        alive = false;
        off?.();
      };
    }
    if (FREE_MODE) {
      setReady(true);
      return;
    }
    (async () => {
      if (getToken()) {
        try {
          const me = await api('/api/auth/me');
          setUser(me.user);
          await loadAccess();
        } catch {
          setToken(null);
          reset();
        }
      }
      setReady(true);
    })();
  }, [loadAccess, reset, syncAfterLogin]);

  // Token hết hạn / bị thu hồi → về trạng thái chưa đăng nhập.
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      reset();
    };
    window.addEventListener('lp:unauthorized', onUnauthorized);
    return () => window.removeEventListener('lp:unauthorized', onUnauthorized);
  }, [reset]);

  const setSession = useCallback(
    (u: User, token: string) => {
      if (CLOUD_AUTH) {
        if (cloudUserId.current !== u.id) void syncAfterLogin(u);
        cloudUserId.current = u.id;
        setUser(u);
        return;
      }
      setToken(token);
      setUser(u);
      loadAccess().catch(() => {});
    },
    [loadAccess, syncAfterLogin],
  );

  const logout = useCallback(() => {
    if (CLOUD_AUTH) {
      void (async () => {
        try {
          await flushProgress();
          stopAutoSync();
          const cloud = await getCloud();
          await cloud.signOut();
        } finally {
          clearLocalProgress(); // máy dùng chung: không để tiến độ người này lọt sang người sau
          window.location.reload();
        }
      })();
      return;
    }
    setToken(null);
    reset();
  }, [reset]);

  const value = useMemo<AccessState>(
    () => ({
      user,
      ready,
      scopes,
      tier,
      planUntil,
      entitlements,
      ai,
      hasScope: (s: string) => FREE_MODE || scopes.includes(s),
      isAdmin: user?.role === 'admin',
      setSession,
      logout,
      refresh,
    }),
    [user, ready, scopes, tier, planUntil, entitlements, ai, setSession, logout, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
