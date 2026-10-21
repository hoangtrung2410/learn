import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, Harness } from './helpers.ts';
import { signToken } from '../src/common/security.ts';

let h: Harness;
before(async () => { h = await startApp(); });
after(async () => { await h.close(); });

test('đăng ký thành công trả về token và user (không lộ mật khẩu)', async () => {
  const r = await h.call('POST', '/api/auth/register', { username: 'Hoc_Vien1', email: 'A@Test.com', password: 'Password123', name: 'Học Viên' });
  assert.equal(r.status, 201);
  assert.ok(r.body.token);
  assert.equal(r.body.user.username, 'hoc_vien1');
  assert.equal(r.body.user.email, 'a@test.com');
  assert.equal(r.body.user.role, 'user');
  assert.equal(JSON.stringify(r.body).includes('Password123'), false);
  assert.equal(JSON.stringify(r.body).includes('password_hash'), false);
});

test('đăng ký bị từ chối khi dữ liệu sai', async () => {
  const cases: [any, RegExp][] = [
    [{ username: 'ab', email: 'x@y.com', password: 'Password123' }, /Tên đăng nhập/],
    [{ username: 'user_ok', email: 'khong-hop-le', password: 'Password123' }, /Email/],
    [{ username: 'user_ok', email: 'x@y.com', password: '123' }, /ít nhất 8/],
    [{ username: 'user ok', email: 'x@y.com', password: 'Password123' }, /Tên đăng nhập/],
    [{ username: 'user_ok', email: 'x@y.com', password: 'a'.repeat(200) }, /quá dài/],
  ];
  for (const [body, re] of cases) {
    const r = await h.call('POST', '/api/auth/register', body);
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.match(r.body.message, re);
  }
});

test('không cho đăng ký trùng tên đăng nhập hoặc email', async () => {
  await h.register('dup_user');
  const a = await h.call('POST', '/api/auth/register', { username: 'dup_user', email: 'other@test.com', password: 'Password123' });
  assert.equal(a.status, 400);
  assert.match(a.body.message, /đã tồn tại/);
  const b = await h.call('POST', '/api/auth/register', { username: 'dup_other', email: 'dup_user@test.com', password: 'Password123' });
  assert.equal(b.status, 400);
  assert.match(b.body.message, /Email/);
});

test('đăng nhập bằng tên đăng nhập hoặc email; sai mật khẩu bị 401', async () => {
  await h.register('login_user');
  assert.equal((await h.login('login_user', 'Password123')).status, 201);
  assert.equal((await h.login('login_user@test.com', 'Password123')).status, 201);
  const bad = await h.login('login_user', 'sai-mat-khau');
  assert.equal(bad.status, 401);
  const none = await h.login('khong_ton_tai', 'Password123');
  assert.equal(none.status, 401);
  assert.equal(bad.body.message, none.body.message); // không lộ tài khoản có tồn tại hay không
});

test('khoá tạm thời sau nhiều lần nhập sai mật khẩu', async () => {
  await h.register('brute_user');
  for (let i = 0; i < 8; i++) assert.equal((await h.login('brute_user', 'sai')).status, 401);
  const blocked = await h.login('brute_user', 'Password123');
  assert.equal(blocked.status, 429);
});

test('/api/auth/me cần token hợp lệ', async () => {
  const { token } = await h.register('me_user');
  assert.equal((await h.call('GET', '/api/auth/me')).status, 401);
  assert.equal((await h.call('GET', '/api/auth/me', undefined, 'rac.rac.rac')).status, 401);
  const ok = await h.call('GET', '/api/auth/me', undefined, token);
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.username, 'me_user');
});

test('token bị sửa nội dung hoặc ký sai khoá hoặc hết hạn đều bị từ chối', async () => {
  const { token } = await h.register('tamper_user');
  const [hd, , sig] = token.split('.');
  const forgedBody = Buffer.from(JSON.stringify({ sub: 1, role: 'admin', exp: 9999999999 })).toString('base64url');
  assert.equal((await h.call('GET', '/api/admin/stats', undefined, `${hd}.${forgedBody}.${sig}`)).status, 401);
  const wrongKey = signToken({ sub: 1, role: 'admin' }, 'khoa-khac', 3600);
  assert.equal((await h.call('GET', '/api/admin/stats', undefined, wrongKey)).status, 401);
  const expired = signToken({ sub: 1, role: 'admin' }, 'test-secret-test-secret-test-secret', -10);
  assert.equal((await h.call('GET', '/api/admin/stats', undefined, expired)).status, 401);
});

test('đổi mật khẩu: sai mật khẩu cũ bị từ chối, đúng thì đăng nhập được bằng mật khẩu mới', async () => {
  const { token } = await h.register('chg_user');
  const bad = await h.call('POST', '/api/auth/change-password', { currentPassword: 'sai', newPassword: 'MatKhauMoi123' }, token);
  assert.equal(bad.status, 400);
  const short = await h.call('POST', '/api/auth/change-password', { currentPassword: 'Password123', newPassword: '123' }, token);
  assert.equal(short.status, 400);
  const ok = await h.call('POST', '/api/auth/change-password', { currentPassword: 'Password123', newPassword: 'MatKhauMoi123' }, token);
  assert.equal(ok.status, 201);
  assert.equal((await h.login('chg_user', 'Password123')).status, 401);
  assert.equal((await h.login('chg_user', 'MatKhauMoi123')).status, 201);
});

test('tài khoản quản trị đăng nhập được; endpoint cũ không còn lộ danh sách người dùng', async () => {
  assert.ok(h.adminToken);
  assert.equal((await h.call('GET', '/api/auth/users')).status, 404);
  assert.equal((await h.call('POST', '/api/auth/google', { email: 'hoangyen040221@x.com' })).status, 404);
  assert.equal((await h.call('POST', '/api/auth/guest')).status, 404);
});

test('người dùng thường không vào được API quản trị (403), chưa đăng nhập (401)', async () => {
  const { token } = await h.register('normal_user');
  for (const path of ['/api/admin/stats', '/api/admin/orders', '/api/admin/users', '/api/admin/products', '/api/admin/coupons']) {
    assert.equal((await h.call('GET', path)).status, 401, path);
    assert.equal((await h.call('GET', path, undefined, token)).status, 403, path);
    assert.equal((await h.call('GET', path, undefined, h.adminToken)).status, 200, path);
  }
});

test('tài khoản bị khoá không đăng nhập được và token cũ mất hiệu lực', async () => {
  const { token, user } = await h.register('locked_user');
  const r = await h.call('POST', `/api/admin/users/${user.id}/disable`, { disabled: true }, h.adminToken);
  assert.equal(r.status, 201);
  assert.equal((await h.call('GET', '/api/auth/me', undefined, token)).status, 401);
  assert.equal((await h.login('locked_user', 'Password123')).status, 403);
  await h.call('POST', `/api/admin/users/${user.id}/disable`, { disabled: false }, h.adminToken);
  assert.equal((await h.login('locked_user', 'Password123')).status, 201);
});

test('admin đặt lại mật khẩu cho người dùng', async () => {
  const { user } = await h.register('reset_user');
  const r = await h.call('POST', `/api/admin/users/${user.id}/reset-password`, {}, h.adminToken);
  assert.equal(r.status, 201);
  assert.ok(r.body.temporaryPassword);
  assert.equal((await h.login('reset_user', 'Password123')).status, 401);
  assert.equal((await h.login('reset_user', r.body.temporaryPassword)).status, 201);
});

test('header bảo mật được gắn vào phản hồi', async () => {
  const r = await h.call('GET', '/api/catalog');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.equal(r.headers.get('x-powered-by'), null);
});

test('đổi mật khẩu làm token cũ mất hiệu lực, token mới trả về vẫn dùng được', async () => {
  const { token } = await h.register('pv_user');
  const r = await h.call('POST', '/api/auth/change-password', { currentPassword: 'Password123', newPassword: 'MatKhauMoi456' }, token);
  assert.equal(r.status, 201);
  assert.ok(r.body.token);
  assert.equal((await h.call('GET', '/api/auth/me', undefined, token)).status, 401);
  assert.equal((await h.call('GET', '/api/auth/me', undefined, r.body.token)).status, 200);
});

test('admin đặt lại mật khẩu thì token cũ của người dùng bị vô hiệu', async () => {
  const { token, user } = await h.register('pv_reset');
  await h.call('POST', `/api/admin/users/${user.id}/reset-password`, {}, h.adminToken);
  assert.equal((await h.call('GET', '/api/auth/me', undefined, token)).status, 401);
});
