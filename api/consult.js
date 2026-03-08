// api/consult.js
// Vercel Serverless Function
// ブラウザから直接Claude APIを叩かない。必ずここを経由させる。

export default async function handler(req, res) {
  // CORSヘッダー（自分のVercelドメインからのみ許可）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエスト（ブラウザのpreflight）に応答
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages が必要です' });
  }

  try {
    // ── Claude API呼び出し ──
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `あなたは「VETO」というAI導入失敗防止サービスのAI診断アシスタントです。
企業のAI導入計画を3ステップで診断します。

【STEP 1】導入目的確認
まず「何のためにAIを入れるのか」「成功の定義は何か」を確認する。

【STEP 2】組織体制確認
「現場は知っているか」「推進できる人材はいるか」「経営層の関与度」を確認する。

【STEP 3】技術・リスク確認
「どのツールを使うか」「データはあるか」「ベンダー依存リスク」を確認する。

返答ルール：
- 必ず「STEP X —」で始めてください
- 200字以内の日本語で
- 確認質問を1〜2個含めてください
- 失敗パターン（リテラシー不足型・KPI不在型・現場拒絶型・シャドーAI型・短期成果強制型・AI幻覚型・ベンダーロック型・スコープ爆発型）に該当する場合は「⚠ PATTERN:」で明示してください
- 社名・個人名を求めないでください`,
        messages: messages
      })
    });

    const data = await claudeRes.json();

    if (!claudeRes.ok) {
      console.error('Claude API error:', data);
      return res.status(500).json({ error: 'Claude API呼び出し失敗', detail: data });
    }

    const reply = data.content?.[0]?.text || 'エラーが発生しました。';

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'サーバーエラー', detail: err.message });
  }
}
