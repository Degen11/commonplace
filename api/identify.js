export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Validate the request
  const body = req.body;

  if (!body || !body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  // Lock model to Haiku — ignore whatever the client sends
  const safeBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: Math.min(body.max_tokens || 4000, 4000),
    system: body.system || '',
    messages: body.messages.slice(0, 1), // Only allow single message
  };

  // Limit input size to prevent abuse (roughly 20 quotes max per batch)
  const userContent = safeBody.messages[0]?.content || '';
  if (userContent.length > 10000) {
    return res.status(400).json({ error: 'Input too large. Send fewer quotes per batch.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(safeBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errorData.error?.message || `API returned ${response.status}`
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    return res.status(500).json({ error: 'Failed to reach AI service' });
  }
}
