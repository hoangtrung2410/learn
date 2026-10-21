import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller.ts';
import { ConversationService } from './conversation.service.ts';

@Module({
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
