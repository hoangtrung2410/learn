import 'reflect-metadata';

export interface Harness {
  base: string;
  close: () => Promise<void>;
  call: (method: string, path: string, body?: any, token?: string) => Promise<{ status: number; body: any }>;
  register: (username: string, extra?: any) => Promise<{ token: string; user: any }>;
  login: (username: string, password: string) => Promise<{ status: number; body: any }>;
  adminToken: string;
}

export async function startApp(env: Record<string, string> = {}): Promise<Harness> {
  Object.assign(process.env, {
    DB_PATH: ':memory:',
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-test-secret-test-secret',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'AdminPass123',
    PAYMENT_PROVIDER: 'mock',
    APP_URL: 'http://localhost:5173',
    API_URL: 'http://localhost:3000',
    ...env,
  });
  const { createApp } = await import('../src/app.factory.ts');
  const app = await createApp({ quiet: true });
  await app.listen(0, '127.0.0.1');
  const addr: any = app.getHttpServer().address();
  const base = `http://127.0.0.1:${addr.port}`;

  const call = async (method: string, path: string, body?: any, token?: string) => {
    const res = await fetch(base + path, {
      method,
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: any = text;
    try { parsed = JSON.parse(text); } catch {}
    return { status: res.status, body: parsed, headers: res.headers } as any;
  };

  const register = async (username: string, extra: any = {}) => {
    const r = await call('POST', '/api/auth/register', { username, email: `${username}@test.com`, password: 'Password123', name: username, ...extra });
    if (r.status >= 300) throw new Error('register failed: ' + JSON.stringify(r.body));
    return { token: r.body.token, user: r.body.user };
  };
  const login = (username: string, password: string) => call('POST', '/api/auth/login', { username, password });
  const admin = await login('admin', 'AdminPass123');

  return {
    base,
    call,
    register,
    login,
    adminToken: admin.body.token,
    close: async () => { await app.close(); },
  };
}
