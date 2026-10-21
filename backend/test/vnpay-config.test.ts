import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startApp } from './helpers.ts';

test('thiếu cấu hình VNPay thì tạo đơn báo lỗi rõ ràng (503)', async () => {
  const h = await startApp({ PAYMENT_PROVIDER: 'vnpay', VNPAY_TMN_CODE: '', VNPAY_HASH_SECRET: '' });
  try {
    const u = await h.register('cfg_user');
    const r = await h.call('POST', '/api/orders', { productId: 'course-zh34' }, u.token);
    assert.equal(r.status, 503);
    assert.match(r.body.message, /chưa được cấu hình/);
  } finally {
    await h.close();
  }
});
