import { Global, Module } from '@nestjs/common';
import { ShopController, AdminController } from './shop.controller.ts';
import { CatalogService } from './catalog.service.ts';
import { CouponsService } from './coupons.service.ts';
import { EntitlementsService } from './entitlements.service.ts';
import { OrdersService } from './orders.service.ts';
import { PaymentsService } from './payments.service.ts';
import { AdminService } from './admin.service.ts';
import { AiQuotaGuard, TtsQuotaGuard } from './ai-quota.guard.ts';

@Global()
@Module({
  controllers: [ShopController, AdminController],
  providers: [CatalogService, CouponsService, EntitlementsService, OrdersService, PaymentsService, AdminService, AiQuotaGuard, TtsQuotaGuard],
  exports: [EntitlementsService, AiQuotaGuard, TtsQuotaGuard],
})
export class ShopModule {}
