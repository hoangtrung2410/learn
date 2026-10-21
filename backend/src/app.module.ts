import { Module } from '@nestjs/common';
import { DbModule } from './modules/db/db.module.ts';
import { SpeechModule } from './modules/speech/speech.module.ts';
import { ConversationModule } from './modules/conversation/conversation.module.ts';
import { TtsModule } from './modules/tts/tts.module.ts';
import { ExplainModule } from './modules/explain/explain.module.ts';
import { AuthModule } from './modules/auth/auth.module.ts';
import { ShopModule } from './modules/shop/shop.module.ts';

@Module({
  imports: [
    DbModule,
    AuthModule,
    ShopModule,
    SpeechModule,
    ConversationModule,
    TtsModule,
    ExplainModule,
  ],
})
export class AppModule {}
