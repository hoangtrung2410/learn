import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ExplainService } from './explain.service.ts';

@Controller('api/ai/explain')
export class ExplainController {
  constructor(
    @Inject(ExplainService)
    private readonly explainService: ExplainService,
  ) {}

  @Post()
  async explainQuery(@Body() body: { query: string; targetLanguage?: string; type?: string }) {
    return this.explainService.explainQuery(body.query, body.targetLanguage, body.type);
  }
}
