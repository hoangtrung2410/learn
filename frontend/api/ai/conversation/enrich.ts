// POST /api/ai/conversation/enrich — đi kèm lượt hội thoại đã tính lượt ở /stream nên chỉ cần đăng nhập.
import { guard } from '../../_lib/ai.js';
import { enrich } from '../../_lib/conversation.js';

export const config = { maxDuration: 60 };

export default async function handler(req: any, res: any) {
  const body = await guard(req, res, 'none');
  if (!body) return;
  res.status(200).json(await enrich(body));
}
