import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, Harness } from './helpers.ts';

let h: Harness;
before(async () => { h = await startApp({ AI_LIMIT_FREE: '2', AI_LIMIT_PAID: '4', AI_LIMIT_PREMIUM: '6', TTS_LIMIT_DAILY: '3', GEMINI_API_KEY: '' }); });
after(async () => { await h.close(); });

// Gọi API AI khi không có khoá Gemini: quan trọng là cổng kiểm tra (401/429) chạy trước.
const ai = (token?: string) => h.call('POST', '/api/ai/explain', { query: 'xin chào' }, token);

test('API AI yêu cầu đăng nhập', async () => {
  assert.equal((await ai()).status, 401);
  assert.equal((await h.call('POST', '/api/ai/conversation', {})).status, 401);
  assert.equal((await h.call('POST', '/api/ai/conversation/stream', {})).status, 401);
  assert.equal((await h.call('POST', '/api/ai/speech-coach', { targetSentence: 'a' })).status, 401);
  assert.equal((await h.call('POST', '/api/ai/tts', { text: 'a' })).status, 401);
});

test('người dùng miễn phí bị giới hạn số lượt AI mỗi ngày', async () => {
  const { token } = await h.register('ai_free');
  assert.notEqual((await ai(token)).status, 429);
  assert.notEqual((await ai(token)).status, 429);
  const blocked = await ai(token);
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.message, /Nâng cấp/);
  const acc = await h.call('GET', '/api/me/access', undefined, token);
  assert.equal(acc.body.ai.limit, 2);
  assert.equal(acc.body.ai.used, 2);
});

test('người dùng đã mua có hạn mức cao hơn, Premium cao nhất', async () => {
  const paid = await h.register('ai_paid');
  const o = await h.call('POST', '/api/orders', { productId: 'course-zh34' }, paid.token);
  await h.call('POST', `/api/payments/mock/${o.body.order.code}/complete`, { result: 'success' }, paid.token);
  assert.equal((await h.call('GET', '/api/me/access', undefined, paid.token)).body.ai.limit, 4);

  const prem = await h.register('ai_prem');
  const o2 = await h.call('POST', '/api/orders', { productId: 'plan-month' }, prem.token);
  await h.call('POST', `/api/payments/mock/${o2.body.order.code}/complete`, { result: 'success' }, prem.token);
  assert.equal((await h.call('GET', '/api/me/access', undefined, prem.token)).body.ai.limit, 6);
});

test('giọng đọc AI có hạn mức riêng và không ăn vào hạn mức AI', async () => {
  const { token } = await h.register('tts_user');
  for (let i = 0; i < 3; i++) assert.notEqual((await h.call('POST', '/api/ai/tts', { text: 'a' }, token)).status, 429);
  assert.equal((await h.call('POST', '/api/ai/tts', { text: 'a' }, token)).status, 429);
  assert.notEqual((await ai(token)).status, 429);
});

test('/conversation/enrich chỉ cần đăng nhập, không trừ thêm hạn mức AI', async () => {
  assert.equal((await h.call('POST', '/api/ai/conversation/enrich', {})).status, 401);
  const { token } = await h.register('enrich_user');
  for (let i = 0; i < 5; i++) assert.notEqual((await h.call('POST', '/api/ai/conversation/enrich', {}, token)).status, 429);
  assert.equal((await h.call('GET', '/api/me/access', undefined, token)).body.ai.used, 0);
});
