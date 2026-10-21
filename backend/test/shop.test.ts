import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, Harness } from './helpers.ts';

let h: Harness;
before(async () => { h = await startApp(); });
after(async () => { await h.close(); });

const pay = async (token: string, code: string, result: 'success' | 'failed' = 'success') =>
  h.call('POST', `/api/payments/mock/${code}/complete`, { result }, token);

test('catalog công khai: có gói và khoá học, phần miễn phí, thông tin hỗ trợ', async () => {
  const r = await h.call('GET', '/api/catalog');
  assert.equal(r.status, 200);
  const ids = r.body.products.map((p: any) => p.id);
  for (const id of ['plan-month', 'plan-year', 'course-zh34', 'course-zh56', 'course-zh79', 'course-enb', 'course-enc', 'course-toeic', 'course-ielts']) assert.ok(ids.includes(id), id);
  assert.deepEqual(r.body.freeScopes, ['zh12', 'ena']);
  assert.equal(r.body.paymentProvider, 'mock');
});

test('người dùng mới chỉ có quyền miễn phí', async () => {
  const { token } = await h.register('free_user');
  const a = await h.call('GET', '/api/me/access', undefined, token);
  assert.equal(a.status, 200);
  assert.deepEqual(a.body.scopes.sort(), ['ena', 'zh12']);
  assert.equal(a.body.tier, 'free');
  assert.equal(a.body.entitlements.length, 0);
  assert.equal((await h.call('GET', '/api/me/access')).status, 401);
});

test('mua khoá học: tạo đơn, thanh toán thành công, mở quyền, đơn chuyển paid', async () => {
  const { token } = await h.register('buyer1');
  const c = await h.call('POST', '/api/orders', { productId: 'course-zh34' }, token);
  assert.equal(c.status, 201);
  assert.equal(c.body.order.status, 'pending');
  assert.equal(c.body.order.amount, 399000);
  assert.match(c.body.order.code, /^LP[A-Z0-9]{8}$/);
  assert.match(c.body.payUrl, /mockpay=LP/);

  // chưa trả tiền → chưa có quyền
  assert.equal((await h.call('GET', '/api/me/access', undefined, token)).body.scopes.includes('zh34'), false);

  const p = await pay(token, c.body.order.code);
  assert.equal(p.body.order.status, 'paid');
  const a = await h.call('GET', '/api/me/access', undefined, token);
  assert.ok(a.body.scopes.includes('zh34'));
  assert.equal(a.body.scopes.includes('zh56'), false);
  assert.equal(a.body.tier, 'paid');
  assert.equal(a.body.entitlements[0].expiresAt, null); // vĩnh viễn
});

test('thanh toán thất bại: đơn failed, không mở quyền', async () => {
  const { token } = await h.register('buyer_fail');
  const c = await h.call('POST', '/api/orders', { productId: 'course-zh56' }, token);
  const p = await pay(token, c.body.order.code, 'failed');
  assert.equal(p.body.order.status, 'failed');
  assert.equal((await h.call('GET', '/api/me/access', undefined, token)).body.scopes.includes('zh56'), false);
});

test('xác nhận thanh toán nhiều lần chỉ cấp quyền một lần (idempotent)', async () => {
  const { token } = await h.register('buyer_idem');
  const c = await h.call('POST', '/api/orders', { productId: 'plan-month' }, token);
  await pay(token, c.body.order.code);
  await pay(token, c.body.order.code);
  await pay(token, c.body.order.code);
  const a = await h.call('GET', '/api/me/access', undefined, token);
  assert.equal(a.body.entitlements.length, 1);
  const days = (a.body.entitlements[0].expiresAt - a.body.entitlements[0].startsAt) / 86400000;
  assert.equal(Math.round(days), 30);
});

test('không mua trùng khoá học vĩnh viễn đã sở hữu', async () => {
  const { token } = await h.register('buyer_dup');
  const c = await h.call('POST', '/api/orders', { productId: 'course-enb' }, token);
  await pay(token, c.body.order.code);
  const again = await h.call('POST', '/api/orders', { productId: 'course-enb' }, token);
  assert.equal(again.status, 400);
  assert.match(again.body.message, /đã sở hữu/);
});

test('gói Premium mở toàn bộ nội dung trả phí; mua thêm sẽ cộng dồn thời hạn', async () => {
  const { token } = await h.register('premium_user');
  const c1 = await h.call('POST', '/api/orders', { productId: 'plan-month' }, token);
  await pay(token, c1.body.order.code);
  const a1 = await h.call('GET', '/api/me/access', undefined, token);
  assert.equal(a1.body.tier, 'premium');
  for (const s of ['zh34', 'zh56', 'zh79', 'enb', 'enc', 'toeic', 'ielts']) assert.ok(a1.body.scopes.includes(s), s);
  const firstExpiry = a1.body.entitlements[0].expiresAt;

  const c2 = await h.call('POST', '/api/orders', { productId: 'plan-month' }, token);
  await pay(token, c2.body.order.code);
  const a2 = await h.call('GET', '/api/me/access', undefined, token);
  assert.equal(Math.round((a2.body.planUntil - firstExpiry) / 86400000), 30);
});

test('sản phẩm không tồn tại / ngừng bán / thiếu thông tin', async () => {
  const { token } = await h.register('buyer_bad');
  assert.equal((await h.call('POST', '/api/orders', { productId: 'khong-co' }, token)).status, 404);
  assert.equal((await h.call('POST', '/api/orders', {}, token)).status, 404);
  assert.equal((await h.call('POST', '/api/orders', { productId: 'course-zh34' })).status, 401);
  await h.call('PUT', '/api/admin/products/course-zh79', { active: false }, h.adminToken);
  assert.equal((await h.call('POST', '/api/orders', { productId: 'course-zh79' }, token)).status, 404);
  const cat = await h.call('GET', '/api/catalog');
  assert.equal(cat.body.products.some((p: any) => p.id === 'course-zh79'), false);
  await h.call('PUT', '/api/admin/products/course-zh79', { active: true }, h.adminToken);
});

test('người khác không xem / huỷ / thanh toán được đơn của bạn', async () => {
  const a = await h.register('owner_a');
  const b = await h.register('owner_b');
  const c = await h.call('POST', '/api/orders', { productId: 'course-enc' }, a.token);
  const code = c.body.order.code;
  assert.equal((await h.call('GET', `/api/orders/${code}`, undefined, b.token)).status, 404);
  assert.equal((await h.call('POST', `/api/orders/${code}/cancel`, {}, b.token)).status, 404);
  assert.equal((await pay(b.token, code)).status, 403);
  assert.equal((await h.call('GET', `/api/orders/${code}`, undefined, a.token)).status, 200);
  assert.equal((await h.call('GET', `/api/orders/${code}`, undefined, h.adminToken)).status, 200);
});

test('danh sách đơn của tôi và huỷ đơn đang chờ', async () => {
  const { token } = await h.register('order_list');
  const c = await h.call('POST', '/api/orders', { productId: 'course-toeic' }, token);
  const mine = await h.call('GET', '/api/orders/mine', undefined, token);
  assert.equal(mine.body.items.length, 1);
  assert.equal(mine.body.items[0].productName, 'Luyện thi TOEIC');
  const cancel = await h.call('POST', `/api/orders/${c.body.order.code}/cancel`, {}, token);
  assert.equal(cancel.body.order.status, 'cancelled');
  assert.equal((await h.call('POST', `/api/orders/${c.body.order.code}/cancel`, {}, token)).status, 400);
  // đơn đã huỷ không thanh toán được
  assert.equal((await pay(token, c.body.order.code)).status, 400);
});

// ---------------- Mã giảm giá
test('mã giảm giá theo phần trăm và theo số tiền; tính tiền ở máy chủ', async () => {
  await h.call('POST', '/api/admin/coupons', { code: 'GIAM20', percentOff: 20 }, h.adminToken);
  await h.call('POST', '/api/admin/coupons', { code: 'GIAM50K', amountOff: 50000 }, h.adminToken);
  const { token } = await h.register('coupon_user');

  const v1 = await h.call('POST', '/api/coupons/validate', { productId: 'course-zh34', code: 'giam20' }, token);
  assert.equal(v1.status, 201);
  assert.equal(v1.body.discount, 79800);
  assert.equal(v1.body.amount, 319200);

  const v2 = await h.call('POST', '/api/coupons/validate', { productId: 'course-zh34', code: 'GIAM50K' }, token);
  assert.equal(v2.body.amount, 349000);

  const o = await h.call('POST', '/api/orders', { productId: 'course-zh34', coupon: 'GIAM20', amount: 1 }, token);
  assert.equal(o.body.order.amount, 319200); // bỏ qua số tiền client gửi lên
  assert.equal(o.body.order.couponCode, 'GIAM20');
});

test('mã giảm giá sai, hết hạn, hết lượt, bị tắt', async () => {
  const { token } = await h.register('coupon_bad');
  const v = (code: string) => h.call('POST', '/api/coupons/validate', { productId: 'course-zh34', code }, token);
  assert.equal((await v('KHONGCO')).status, 400);

  await h.call('POST', '/api/admin/coupons', { code: 'HETHAN', percentOff: 10, expiresAt: Date.now() - 1000 }, h.adminToken);
  assert.match((await v('HETHAN')).body.message, /hết hạn/);

  await h.call('POST', '/api/admin/coupons', { code: 'MOTLAN', percentOff: 10, maxUses: 1 }, h.adminToken);
  const u1 = await h.register('coupon_once');
  const o = await h.call('POST', '/api/orders', { productId: 'course-zh34', coupon: 'MOTLAN' }, u1.token);
  await pay(u1.token, o.body.order.code);
  assert.match((await v('MOTLAN')).body.message, /hết lượt/);

  await h.call('POST', '/api/admin/coupons', { code: 'TATMA', percentOff: 10 }, h.adminToken);
  await h.call('POST', '/api/admin/coupons/TATMA/active', { active: false }, h.adminToken);
  assert.match((await v('TATMA')).body.message, /vô hiệu/);
});

test('mã giảm 100% tặng khoá học: đơn tự động paid, mở quyền ngay, không cần cổng thanh toán', async () => {
  await h.call('POST', '/api/admin/coupons', { code: 'TANGFREE', percentOff: 100 }, h.adminToken);
  const { token } = await h.register('free_gift');
  const o = await h.call('POST', '/api/orders', { productId: 'course-ielts', coupon: 'TANGFREE' }, token);
  assert.equal(o.status, 201);
  assert.equal(o.body.order.amount, 0);
  assert.equal(o.body.order.status, 'paid');
  assert.equal(o.body.payUrl, null);
  assert.ok((await h.call('GET', '/api/me/access', undefined, token)).body.scopes.includes('ielts'));
});

test('số tiền sau giảm nhỏ hơn 5.000đ (nhưng khác 0) bị từ chối', async () => {
  await h.call('POST', '/api/admin/coupons', { code: 'GIAMSAU', amountOff: 396000 }, h.adminToken);
  const { token } = await h.register('coupon_tiny');
  const r = await h.call('POST', '/api/orders', { productId: 'course-zh34', coupon: 'GIAMSAU' }, token);
  assert.equal(r.status, 400);
});

test('tạo mã giảm giá: kiểm tra dữ liệu đầu vào', async () => {
  const bad = [
    { code: 'ab', percentOff: 10 },
    { code: 'OKCODE', percentOff: 10, amountOff: 1000 },
    { code: 'OKCODE' },
    { code: 'OKCODE', percentOff: 0 },
    { code: 'OKCODE', percentOff: 101 },
    { code: 'OKCODE', amountOff: 10 },
  ];
  for (const b of bad) assert.equal((await h.call('POST', '/api/admin/coupons', b, h.adminToken)).status, 400, JSON.stringify(b));
  assert.equal((await h.call('POST', '/api/admin/coupons', { code: 'GIAM20', percentOff: 5 }, h.adminToken)).status, 400); // trùng
});

// ---------------- Quản trị
test('admin xác nhận thủ công đơn đang chờ → mở quyền; không xác nhận lần hai', async () => {
  const { token } = await h.register('manual_user');
  const c = await h.call('POST', '/api/orders', { productId: 'course-zh56' }, token);
  const r = await h.call('POST', `/api/admin/orders/${c.body.order.code}/mark-paid`, {}, h.adminToken);
  assert.equal(r.body.order.status, 'paid');
  assert.ok((await h.call('GET', '/api/me/access', undefined, token)).body.scopes.includes('zh56'));
  assert.equal((await h.call('POST', `/api/admin/orders/${c.body.order.code}/mark-paid`, {}, h.adminToken)).status, 400);
});

test('hoàn tiền: đơn chuyển refunded và thu hồi quyền học', async () => {
  const { token } = await h.register('refund_user');
  const c = await h.call('POST', '/api/orders', { productId: 'course-zh79' }, token);
  await pay(token, c.body.order.code);
  assert.ok((await h.call('GET', '/api/me/access', undefined, token)).body.scopes.includes('zh79'));
  const r = await h.call('POST', `/api/admin/orders/${c.body.order.code}/refund`, {}, h.adminToken);
  assert.equal(r.body.order.status, 'refunded');
  assert.equal((await h.call('GET', '/api/me/access', undefined, token)).body.scopes.includes('zh79'), false);
  assert.equal((await h.call('POST', `/api/admin/orders/${c.body.order.code}/refund`, {}, h.adminToken)).status, 400);
  // sau khi hoàn tiền có thể mua lại
  assert.equal((await h.call('POST', '/api/orders', { productId: 'course-zh79' }, token)).status, 201);
});

test('admin cấp / thu hồi quyền học thủ công', async () => {
  const { token, user } = await h.register('grant_user');
  const g = await h.call('POST', `/api/admin/users/${user.id}/grant`, { productId: 'plan-month', days: 7 }, h.adminToken);
  assert.equal(g.status, 201);
  const a = await h.call('GET', '/api/me/access', undefined, token);
  assert.equal(a.body.tier, 'premium');
  assert.equal(Math.round((a.body.entitlements[0].expiresAt - a.body.entitlements[0].startsAt) / 86400000), 7);
  await h.call('POST', `/api/admin/users/${user.id}/revoke`, { entitlementId: a.body.entitlements[0].id }, h.adminToken);
  assert.equal((await h.call('GET', '/api/me/access', undefined, token)).body.tier, 'free');
  assert.equal((await h.call('POST', `/api/admin/users/${user.id}/grant`, { productId: 'khong-co' }, h.adminToken)).status, 400);
  assert.equal((await h.call('POST', `/api/admin/users/${user.id}/grant`, { productId: 'plan-month', days: -3 }, h.adminToken)).status, 400);
  assert.equal((await h.call('POST', `/api/admin/users/99999/grant`, { productId: 'plan-month' }, h.adminToken)).status, 404);
});

test('admin sửa giá sản phẩm: kiểm tra giá hợp lệ và áp dụng cho đơn mới', async () => {
  assert.equal((await h.call('PUT', '/api/admin/products/course-enc', { priceVnd: -5 }, h.adminToken)).status, 400);
  assert.equal((await h.call('PUT', '/api/admin/products/course-enc', { priceVnd: 1000 }, h.adminToken)).status, 400);
  assert.equal((await h.call('PUT', '/api/admin/products/course-enc', { priceVnd: 12.5 }, h.adminToken)).status, 400);
  assert.equal((await h.call('PUT', '/api/admin/products/khong-co', { priceVnd: 10000 }, h.adminToken)).status, 404);
  const r = await h.call('PUT', '/api/admin/products/course-enc', { priceVnd: 350000 }, h.adminToken);
  assert.equal(r.body.product.priceVnd, 350000);
  const { token } = await h.register('price_user');
  const o = await h.call('POST', '/api/orders', { productId: 'course-enc' }, token);
  assert.equal(o.body.order.amount, 350000);
  await h.call('PUT', '/api/admin/products/course-enc', { priceVnd: 399000 }, h.adminToken);
  // đơn cũ giữ nguyên giá đã chốt
  assert.equal((await h.call('GET', `/api/orders/${o.body.order.code}`, undefined, token)).body.order.amount, 350000);
});

test('admin tìm kiếm, lọc đơn hàng và xem thống kê doanh thu', async () => {
  const all = await h.call('GET', '/api/admin/orders?pageSize=5', undefined, h.adminToken);
  assert.ok(all.body.total > 5);
  assert.equal(all.body.items.length, 5);
  const paid = await h.call('GET', '/api/admin/orders?status=paid', undefined, h.adminToken);
  assert.ok(paid.body.items.every((o: any) => o.status === 'paid'));
  const one = await h.call('GET', '/api/admin/orders?q=buyer1', undefined, h.adminToken);
  assert.ok(one.body.items.length >= 1 && one.body.items.every((o: any) => o.username.includes('buyer1')));
  const stats = await h.call('GET', '/api/admin/stats', undefined, h.adminToken);
  assert.ok(stats.body.revenueTotal >= 399000);
  assert.ok(stats.body.users > 5);
  assert.ok(stats.body.ordersByStatus.paid >= 1);
  assert.ok(Array.isArray(stats.body.daily));
  const users = await h.call('GET', '/api/admin/users?q=premium_user', undefined, h.adminToken);
  assert.equal(users.body.items[0].tier, 'premium');
});

// ---------------- Cổng thanh toán thử nghiệm
test('cổng thử nghiệm bị tắt khi chạy production', async () => {
  const prev = process.env.NODE_ENV;
  const { token } = await h.register('prod_mock');
  const c = await h.call('POST', '/api/orders', { productId: 'course-zh34' }, token);
  process.env.NODE_ENV = 'production';
  try {
    const r = await pay(token, c.body.order.code);
    assert.equal(r.status, 400);
    assert.equal((await h.call('GET', '/api/me/access', undefined, token)).body.scopes.includes('zh34'), false);
  } finally {
    process.env.NODE_ENV = prev;
  }
});
