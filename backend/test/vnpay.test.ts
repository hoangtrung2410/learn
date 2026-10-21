import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, Harness } from './helpers.ts';

let h: Harness;
const SECRET = 'VNPAYSECRETVNPAYSECRETVNPAYSECRET12';
before(async () => {
  h = await startApp({ PAYMENT_PROVIDER: 'vnpay', VNPAY_TMN_CODE: 'TESTTMN1', VNPAY_HASH_SECRET: SECRET, VNPAY_PAY_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html' });
});
after(async () => { await h.close(); });

// Ký giống VNPay: sắp xếp khoá, mã hoá, HMAC-SHA512.
import crypto from 'crypto';
const sign = (params: Record<string, string>) => {
  const data = Object.keys(params).sort().map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`).join('&');
  return { ...params, vnp_SecureHash: crypto.createHmac('sha512', SECRET).update(Buffer.from(data, 'utf-8')).digest('hex') };
};
const qs = (p: Record<string, string>) => '?' + new URLSearchParams(p).toString();

const newOrder = async (name: string, productId = 'course-zh34') => {
  const u = await h.register(name);
  const o = await h.call('POST', '/api/orders', { productId }, u.token);
  return { ...u, order: o.body.order, payUrl: o.body.payUrl };
};

test('URL thanh toán VNPay đúng định dạng và chữ ký hợp lệ', async () => {
  const { payUrl, order } = await newOrder('vn_url');
  const url = new URL(payUrl);
  assert.equal(url.origin + url.pathname, 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
  const p = Object.fromEntries(url.searchParams.entries());
  assert.equal(p.vnp_TmnCode, 'TESTTMN1');
  assert.equal(p.vnp_TxnRef, order.code);
  assert.equal(p.vnp_Amount, String(order.amount * 100));
  assert.equal(p.vnp_CurrCode, 'VND');
  assert.equal(p.vnp_Command, 'pay');
  assert.match(p.vnp_CreateDate, /^\d{14}$/);
  assert.match(p.vnp_ReturnUrl, /\/api\/payments\/vnpay\/return$/);
  const { vnp_SecureHash, ...rest } = p;
  assert.equal(sign(rest).vnp_SecureHash, vnp_SecureHash);
});

test('Return URL: giao dịch thành công mở quyền và chuyển về trang chủ', async () => {
  const { token, order } = await newOrder('vn_ok');
  const params = sign({ vnp_TmnCode: 'TESTTMN1', vnp_TxnRef: order.code, vnp_Amount: String(order.amount * 100), vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_TransactionNo: '14000001', vnp_OrderInfo: 'Thanh toan don hang' });
  const r = await h.call('GET', '/api/payments/vnpay/return' + qs(params));
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /payment=success&order=LP/);
  assert.ok((await h.call('GET', '/api/me/access', undefined, token)).body.scopes.includes('zh34'));
  assert.equal((await h.call('GET', `/api/orders/${order.code}`, undefined, token)).body.order.status, 'paid');
});

test('Return URL: chữ ký sai bị từ chối, không mở quyền', async () => {
  const { token, order } = await newOrder('vn_badsig');
  const params = sign({ vnp_TxnRef: order.code, vnp_Amount: String(order.amount * 100), vnp_ResponseCode: '00', vnp_TransactionStatus: '00' });
  params.vnp_Amount = '100'; // sửa số tiền sau khi ký
  const r = await h.call('GET', '/api/payments/vnpay/return' + qs(params));
  assert.match(r.headers.get('location'), /payment=invalid/);
  assert.equal((await h.call('GET', `/api/orders/${order.code}`, undefined, token)).body.order.status, 'pending');
  const noSig = await h.call('GET', '/api/payments/vnpay/return' + qs({ vnp_TxnRef: order.code, vnp_ResponseCode: '00' }));
  assert.match(noSig.headers.get('location'), /payment=invalid/);
});

test('Return URL: sai số tiền dù chữ ký hợp lệ thì không mở quyền', async () => {
  const { token, order } = await newOrder('vn_amount');
  const params = sign({ vnp_TxnRef: order.code, vnp_Amount: '100000', vnp_ResponseCode: '00', vnp_TransactionStatus: '00' });
  const r = await h.call('GET', '/api/payments/vnpay/return' + qs(params));
  assert.match(r.headers.get('location'), /payment=invalid/);
  assert.equal((await h.call('GET', `/api/orders/${order.code}`, undefined, token)).body.order.status, 'pending');
});

test('Return URL: người dùng huỷ thanh toán → đơn failed', async () => {
  const { token, order } = await newOrder('vn_cancel');
  const params = sign({ vnp_TxnRef: order.code, vnp_Amount: String(order.amount * 100), vnp_ResponseCode: '24', vnp_TransactionStatus: '02' });
  const r = await h.call('GET', '/api/payments/vnpay/return' + qs(params));
  assert.match(r.headers.get('location'), /payment=failed/);
  assert.equal((await h.call('GET', `/api/orders/${order.code}`, undefined, token)).body.order.status, 'failed');
});

test('IPN: các mã phản hồi 00 / 02 / 01 / 04 / 97 theo đặc tả VNPay', async () => {
  const { token, order } = await newOrder('vn_ipn');
  const ok = sign({ vnp_TxnRef: order.code, vnp_Amount: String(order.amount * 100), vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_TransactionNo: '999' });
  assert.deepEqual((await h.call('GET', '/api/payments/vnpay/ipn' + qs(ok))).body, { RspCode: '00', Message: 'Confirm Success' });
  assert.equal((await h.call('GET', `/api/orders/${order.code}`, undefined, token)).body.order.status, 'paid');
  assert.equal((await h.call('GET', '/api/payments/vnpay/ipn' + qs(ok))).body.RspCode, '02'); // gọi lại
  assert.equal((await h.call('GET', '/api/me/access', undefined, token)).body.entitlements.length, 1);

  const missing = sign({ vnp_TxnRef: 'LPKHONGCO1', vnp_Amount: '100', vnp_ResponseCode: '00', vnp_TransactionStatus: '00' });
  assert.equal((await h.call('GET', '/api/payments/vnpay/ipn' + qs(missing))).body.RspCode, '01');

  const other = await newOrder('vn_ipn2');
  const wrongAmt = sign({ vnp_TxnRef: other.order.code, vnp_Amount: '5000000', vnp_ResponseCode: '00', vnp_TransactionStatus: '00' });
  assert.equal((await h.call('GET', '/api/payments/vnpay/ipn' + qs(wrongAmt))).body.RspCode, '04');

  const forged = { ...ok, vnp_SecureHash: 'abc123' };
  assert.equal((await h.call('GET', '/api/payments/vnpay/ipn' + qs(forged))).body.RspCode, '97');
});

test('khi chạy chế độ VNPay, cổng thử nghiệm không dùng được', async () => {
  const { token, order } = await newOrder('vn_nomock');
  const r = await h.call('POST', `/api/payments/mock/${order.code}/complete`, { result: 'success' }, token);
  assert.equal(r.status, 400);
});
