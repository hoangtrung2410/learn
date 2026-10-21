// Điều hướng giữa các màn hình mà không cần truyền props qua nhiều tầng.
export type GotoDetail = { tab: string; highlight?: string; legal?: 'terms' | 'privacy' | 'refund' };

export const gotoTab = (detail: GotoDetail) => window.dispatchEvent(new CustomEvent<GotoDetail>('lp:goto', { detail }));
export const goPricing = (highlight?: string) => gotoTab({ tab: 'pricing', highlight });
export const openAuth = (tab: 'login' | 'register' = 'login', notice?: string) =>
  window.dispatchEvent(new CustomEvent('lp:auth', { detail: { tab, notice } }));
