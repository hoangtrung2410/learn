import { Module } from '@nestjs/common';
import { ExplainController } from './explain.controller.ts';
import { ExplainService } from './explain.service.ts';

@Module({
  controllers: [ExplainController],
  providers: [ExplainService],
  exports: [ExplainService],
})
export class ExplainModule {}
