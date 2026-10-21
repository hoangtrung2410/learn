import { UseGuards, Controller, Post, Body, Inject, Res, Req } from '@nestjs/common';
import { ConversationService } from './conversation.service.ts';
import { AiQuotaGuard } from '../shop/ai-quota.guard.ts';
import { AuthGuard } from '../auth/auth.guard.ts';

@Controller('api/ai/conversation')
export class ConversationController {
  constructor(
    @Inject(ConversationService)
    private readonly conversationService: ConversationService,
  ) {}

  // Giữ nguyên cho app Flutter.
  @Post()
  @UseGuards(AiQuotaGuard)
  async handleConversation(@Body() body: any) {
    return this.conversationService.handleConversation(body);
  }

  // Server-Sent Events: {type:'delta',text} ... {type:'done'} hoặc {type:'error'}.
  @Post('stream')
  @UseGuards(AiQuotaGuard)
  async stream(@Body() body: any, @Req() req: any, @Res() res: any) {
    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();

    let closed = false;
    res.on('close', () => {
      closed = true;
    });
    const send = (obj: unknown) => {
      if (!closed) res.write(`data: ${JSON.stringify(obj)}\n\n`);
    };

    try {
      for await (const text of this.conversationService.streamReply(body || {})) {
        if (closed) return;
        send({ type: 'delta', text });
      }
      send({ type: 'done' });
    } catch (err: any) {
      console.warn('[chat/stream] failed:', String(err?.message || err).slice(0, 200));
      send({ type: 'error', message: 'AI chưa phản hồi được, vui lòng thử lại.' });
    } finally {
      if (!closed) res.end();
    }
  }

  // Phần bổ sung đi kèm lượt hội thoại đã tính hạn mức ở /stream nên chỉ cần đăng nhập.
  @Post('enrich')
  @UseGuards(AuthGuard)
  async enrich(@Body() body: any) {
    return this.conversationService.enrich(body || {});
  }
}
