// api/count.js
// 相談カウンターの読み書き
// Vercel KV（無料プランで使える簡易DB）を使用

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const KV_URL      = process.env.KV_REST_API_URL;
  const KV_TOKEN    = process.env.KV_REST_API_TOKEN;
  const COUNT_KEY   = 'veto:consult_count';
  const BASE_COUNT  = 42; // 初期値

  // ── GET: 現在のカウントを返す ──
  if (req.method === 'GET') {
    try {
      const r = await fetch(`${KV_URL}/get/${COUNT_KEY}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await r.json();
      const count = data.result ? parseInt(data.result) : BASE_COUNT;
      return res.status(200).json({ count: Math.max(BASE_COUNT, count) });
    } catch (e) {
      return res.status(200).json({ count: BASE_COUNT });
    }
  }

  // ── POST: カウントを+1して返す ──
  if (req.method === 'POST') {
    try {
      const r = await fetch(`${KV_URL}/incr/${COUNT_KEY}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await r.json();
      let count = data.result ? parseInt(data.result) : BASE_COUNT;

      if (count < BASE_COUNT) {
        await fetch(`${KV_URL}/set/${COUNT_KEY}/${BASE_COUNT + 1}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        count = BASE_COUNT + 1;
      }

      return res.status(200).json({ count });
    } catch (e) {
      return res.status(200).json({ count: BASE_COUNT });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
