import { Module } from '@nestjs/common';
import { SpeechModule } from './modules/speech/speech.module.ts';
import { ConversationModule } from './modules/conversation/conversation.module.ts';
import { TtsModule } from './modules/tts/tts.module.ts';
import { ExplainModule } from './modules/explain/explain.module.ts';
import { AuthModule } from './modules/auth/auth.module.ts';

@Module({
  imports: [
    AuthModule,
    SpeechModule,
    ConversationModule,
    TtsModule,
    ExplainModule,
  ],
})
export class AppModule {}
