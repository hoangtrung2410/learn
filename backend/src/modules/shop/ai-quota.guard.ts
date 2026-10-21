import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException, HttpException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.ts';
import { EntitlementsService } from './entitlements.service.ts';
import { config } from '../../common/config.ts';

// Bắt buộc đăng nhập + trừ hạn mức theo ngày cho các API gọi Gemini (tốn chi phí).
function makeGuard(kind: 'ai' | 'tts') {
  @Injectable()
  class QuotaGuard implements CanActivate {
    constructor(
      @Inject(AuthService) private readonly auth: AuthService,
      @Inject(EntitlementsService) private readonly ents: EntitlementsService,
    ) {}
    canActivate(ctx: ExecutionContext): boolean {
      const req = ctx.switchToHttp().getRequest();
      const user = this.auth.userFromRequest(req);
      if (!user) throw new UnauthorizedException('Vui lòng đăng nhập để dùng tính năng AI.');
      req.user = user;
      const { tier } = this.ents.access(user.id);
      const limit = kind === 'tts' ? config.aiLimits().tts : this.ents.aiLimit(tier);
      if (!this.ents.consume(user.id, kind, limit)) {
        throw new HttpException(
          kind === 'tts'
            ? 'Bạn đã dùng hết lượt giọng đọc AI hôm nay.'
            : tier === 'premium'
              ? 'Bạn đã dùng hết lượt AI hôm nay. Vui lòng quay lại vào ngày mai.'
              : `Bạn đã dùng hết ${limit} lượt AI miễn phí hôm nay. Nâng cấp để có thêm lượt.`,
          429,
        );
      }
      return true;
    }
  }
  return QuotaGuard;
}

export const AiQuotaGuard = makeGuard('ai');
export const TtsQuotaGuard = makeGuard('tts');
