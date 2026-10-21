import { Module } from '@nestjs/common';
import { TtsController } from './tts.controller.ts';
import { TtsService } from './tts.service.ts';

@Module({
  controllers: [TtsController],
  providers: [TtsService],
  exports: [TtsService],
})
export class TtsModule {}
