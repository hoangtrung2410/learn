// POST /api/ai/conversation/stream — Server-Sent Events: {type:'delta',text} ... {type:'done'} hoặc {type:'error'}.
import { guard } from '../../_lib/ai.js';
import { streamReply } from '../../_lib/conversation.js';

export const config = { maxDuration: 60 };

export default async function handler(req: any, res: any) {
  const body = await guard(req, res, 'ai');
  if (!body) return;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  let closed = false;
  req.on('close', () => {
    closed = true;
  });
  const send = (obj: unknown) => {
    if (!closed) res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  try {
    for await (const text of streamReply(body)) {
      if (closed) return;
      send({ type: 'delta', text });
    }
    send({ type: 'done' });
  } catch (err: any) {
    console.warn('[chat/stream] failed:', String(err?.message || err).slice(0, 200));
    send({ type: 'error', message: 'AI chưa phản hồi được, vui lòng thử lại.' });
  } finally {
    if (!closed) res.end();
  }
}
