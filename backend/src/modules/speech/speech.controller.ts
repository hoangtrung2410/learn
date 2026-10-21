import { UseGuards, Controller, Post, Body, Inject, BadRequestException } from '@nestjs/common';
import { SpeechService } from './speech.service.ts';
import { AiQuotaGuard } from '../shop/ai-quota.guard.ts';

@UseGuards(AiQuotaGuard)
@Controller('api/ai/speech-coach')
export class SpeechController {
  constructor(
    @Inject(SpeechService)
    private readonly speechService: SpeechService,
  ) {}

  @Post()
  async evaluateSpeech(@Body() body: any) {
    if (!body?.targetSentence) {
      throw new BadRequestException('targetSentence is required');
    }
    return this.speechService.evaluateSpeech(body);
  }
}
