import { withApiHandler, ANTHROPIC, RATE_LIMITS } from './_shared.js';
import { autoGroupSchema, parseBody } from './_schemas.js';

const SYSTEM_PROMPT = `You filter quotes by theme. Given a theme and numbered quotes, return a JSON array of matching indices. Example: [0,3,7]
Rules:
- Include quotes that clearly match the theme (direct or strong thematic connection)
- Return [] if nothing matches
- Return ONLY the JSON array, nothing else`;

export default withApiHandler(async (req, res) => {
  const { ok, data: body, error: validationError } = parseBody(autoGroupSchema, req.body);
  if (!ok) return res.status(400).json({ error: validationError });

  const { theme, quotes } = body;

  // Build compact quote list — index + truncated text to minimize tokens
  const quotesBlock = quotes
    .map((q, i) => `[${i}] ${q.length > 100 ? q.slice(0, 100) + '…' : q}`)
    .join('\n');

  const userContent = `Theme: "${theme}"\n\nQuotes:\n${quotesBlock}`;

  // Guard total input size
  if (userContent.length > 60000) {
    return res.status(400).json({ error: 'Input too large. Try with fewer quotes.' });
  }

  const safeBody = {
    model: ANTHROPIC.MODEL,
    max_tokens: 1024, // indices only — very small output
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  };

  try {
    const response = await fetch(ANTHROPIC.URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC.VERSION,
      },
      body: JSON.stringify(safeBody),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status);
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    const text = (data.content || []).map(x => x.text || '').join('');
    const raw = text.replace(/```json|```/g, '').trim();

    let indices;
    try {
      indices = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'AI returned invalid response. Please try again.' });
    }

    if (!Array.isArray(indices) || !indices.every(i => Number.isInteger(i) && i >= 0 && i < quotes.length)) {
      return res.status(502).json({ error: 'AI returned invalid indices. Please try again.' });
    }

    return res.status(200).json({ indices });
  } catch (error) {
    console.error('Auto-group API error:', error?.message || 'unknown');
    return res.status(500).json({ error: 'Failed to reach AI service' });
  }
}, {
  rateLimit: RATE_LIMITS.AUTO_GROUP,
  requireAnthropicKey: true,
});
