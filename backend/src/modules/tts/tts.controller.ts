import { UseGuards, Controller, Post, Body, Inject } from '@nestjs/common';
import { TtsService } from './tts.service.ts';
import { TtsQuotaGuard } from '../shop/ai-quota.guard.ts';

@UseGuards(TtsQuotaGuard)
@Controller('api/ai/tts')
export class TtsController {
  constructor(
    @Inject(TtsService)
    private readonly ttsService: TtsService,
  ) {}

  @Post()
  async generateTts(@Body() body: { text: string; targetLanguage?: string; voice?: string }) {
    return this.ttsService.generateSpeech(body.text, body.targetLanguage, body.voice);
  }
}
