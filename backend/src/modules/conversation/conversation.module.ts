import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller.ts';
import { ConversationService } from './conversation.service.ts';
import { LiveController } from './live.controller.ts';

@Module({
  controllers: [ConversationController, LiveController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
