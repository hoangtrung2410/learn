import { Module } from '@nestjs/common';
import { SpeechController } from './speech.controller.ts';
import { SpeechService } from './speech.service.ts';

@Module({
  controllers: [SpeechController],
  providers: [SpeechService],
  exports: [SpeechService],
})
export class SpeechModule {}
