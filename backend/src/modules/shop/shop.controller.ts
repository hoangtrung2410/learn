import { Controller, Get, Post, Put, Body, Param, Query, Req, Res, Inject, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard, AdminGuard } from '../auth/auth.guard.ts';
import { CatalogService } from './catalog.service.ts';
import { CouponsService } from './coupons.service.ts';
import { EntitlementsService } from './entitlements.service.ts';
import { OrdersService } from './orders.service.ts';
import { PaymentsService } from './payments.service.ts';
import { AdminService } from './admin.service.ts';
import { FREE_SCOPES } from '../db/catalog.ts';
import { config } from '../../common/config.ts';

const ipOf = (req: any): string => req.ip || req.socket?.remoteAddress || '127.0.0.1';

@Controller('api')
export class ShopController {
  constructor(
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(CouponsService) private readonly coupons: CouponsService,
    @Inject(EntitlementsService) private readonly ents: EntitlementsService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(PaymentsService) private readonly payments: PaymentsService,
  ) {}

  @Get('catalog')
  getCatalog() {
    return {
      products: this.catalog.list(),
      freeScopes: FREE_SCOPES,
      paymentProvider: this.payments.provider(),
      aiLimits: { free: config.aiLimits().free, paid: config.aiLimits().paid, premium: config.aiLimits().premium },
      support: { email: config.supportEmail(), phone: config.supportPhone() },
    };
  }

  @Get('me/access')
  @UseGuards(AuthGuard)
  myAccess(@Req() req: any) {
    const a = this.ents.access(req.user.id);
    const limit = this.ents.aiLimit(a.tier);
    return { ...a, ai: { used: this.ents.usage(req.user.id, 'ai'), limit } };
  }

  @Post('coupons/validate')
  @UseGuards(AuthGuard)
  validateCoupon(@Body() body: any) {
    const q = this.orders.quote(String(body?.productId ?? ''), String(body?.code ?? ''));
    return { code: q.coupon, listAmount: q.listAmount, discount: q.discount, amount: q.amount };
  }

  @Post('orders')
  @UseGuards(AuthGuard)
  createOrder(@Body() body: any, @Req() req: any) {
    return this.orders.create(req.user, body, ipOf(req));
  }

  @Get('orders/mine')
  @UseGuards(AuthGuard)
  myOrders(@Req() req: any) {
    return { items: this.orders.mine(req.user) };
  }

  @Get('orders/:code')
  @UseGuards(AuthGuard)
  getOrder(@Param('code') code: string, @Req() req: any) {
    return { order: this.orders.getFor(req.user, code) };
  }

  @Post('orders/:code/cancel')
  @UseGuards(AuthGuard)
  cancelOrder(@Param('code') code: string, @Req() req: any) {
    return { order: this.orders.cancel(req.user, code) };
  }

  // ---------------- Thanh toán
  @Post('payments/mock/:code/complete')
  @UseGuards(AuthGuard)
  mockComplete(@Param('code') code: string, @Body() body: any, @Req() req: any) {
    this.payments.assertMock();
    const o = this.orders.assertOwner(req.user, code);
    if (o.provider !== 'mock') throw new BadRequestException('Đơn hàng này không dùng cổng thử nghiệm.');
    if (o.status !== 'pending' && o.status !== 'paid') throw new BadRequestException('Đơn hàng không còn ở trạng thái chờ thanh toán.');
    if (body?.result === 'success') this.orders.markPaid(code, { providerRef: 'mock', amount: o.amount });
    else this.orders.markFailed(code, 'mock-failed');
    return { order: this.orders.getFor(req.user, code) };
  }

  @Get('payments/vnpay/return')
  vnpayReturn(@Query() query: any, @Res() res: any) {
    const app = config.appUrl();
    if (!this.payments.verifyVnpay(query)) return res.redirect(`${app}/?payment=invalid`);
    const code = String(query.vnp_TxnRef || '');
    const o: any = this.orders.raw(code);
    if (!o) return res.redirect(`${app}/?payment=invalid`);
    const success = query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
    if (success) {
      const r = this.orders.markPaid(code, { providerRef: String(query.vnp_TransactionNo || ''), amount: Math.round(Number(query.vnp_Amount) / 100) });
      return res.redirect(`${app}/?payment=${r.ok ? 'success' : 'invalid'}&order=${encodeURIComponent(code)}`);
    }
    this.orders.markFailed(code, String(query.vnp_ResponseCode || ''));
    return res.redirect(`${app}/?payment=failed&order=${encodeURIComponent(code)}`);
  }

  // IPN: VNPay gọi máy chủ → máy chủ, là nguồn xác nhận đáng tin nhất.
  @Get('payments/vnpay/ipn')
  vnpayIpn(@Query() query: any) {
    if (!this.payments.verifyVnpay(query)) return { RspCode: '97', Message: 'Invalid signature' };
    const code = String(query.vnp_TxnRef || '');
    const o: any = this.orders.raw(code);
    if (!o) return { RspCode: '01', Message: 'Order not found' };
    if (o.amount !== Math.round(Number(query.vnp_Amount) / 100)) return { RspCode: '04', Message: 'Invalid amount' };
    if (o.status === 'paid') return { RspCode: '02', Message: 'Order already confirmed' };
    const success = query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
    if (success) this.orders.markPaid(code, { providerRef: String(query.vnp_TransactionNo || ''), amount: o.amount });
    else this.orders.markFailed(code, String(query.vnp_ResponseCode || ''));
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly admin: AdminService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(CouponsService) private readonly coupons: CouponsService,
  ) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('orders')
  listOrders(@Query() q: any) {
    return this.orders.adminList({ status: q.status, q: q.q, page: Number(q.page) || 1, pageSize: Number(q.pageSize) || 20 });
  }

  @Post('orders/:code/mark-paid')
  markPaid(@Param('code') code: string, @Req() req: any) {
    return { order: this.orders.adminMarkPaid(code, req.user.id) };
  }

  @Post('orders/:code/refund')
  refund(@Param('code') code: string, @Req() req: any) {
    return { order: this.orders.adminRefund(code, req.user.id) };
  }

  @Get('users')
  users(@Query() q: any) {
    return this.admin.users({ q: q.q, page: Number(q.page) || 1, pageSize: Number(q.pageSize) || 20 });
  }

  @Post('users/:id/grant')
  grant(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.admin.grant(Number(id), body, req.user.id);
  }

  @Post('users/:id/revoke')
  revoke(@Param('id') id: string, @Body() body: any) {
    return this.admin.revoke(Number(id), Number(body?.entitlementId));
  }

  @Post('users/:id/disable')
  disable(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.admin.setDisabled(Number(id), !!body?.disabled, req.user.id);
  }

  @Post('users/:id/reset-password')
  resetPassword(@Param('id') id: string) {
    return this.admin.resetPassword(Number(id));
  }

  @Get('products')
  products() {
    return { products: this.catalog.list(true) };
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) {
    return { product: this.catalog.update(id, body) };
  }

  @Get('coupons')
  coupons_() {
    return { items: this.coupons.list() };
  }

  @Post('coupons')
  createCoupon(@Body() body: any) {
    return { coupon: this.coupons.create(body) };
  }

  @Post('coupons/:code/active')
  setCouponActive(@Param('code') code: string, @Body() body: any) {
    return { coupon: this.coupons.setActive(code, !!body?.active) };
  }
}
