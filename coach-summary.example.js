// Example only. Put AI API key in server environment variables, not frontend.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { summary } = req.body || {};
  if (!summary) return res.status(400).json({ error: 'Missing summary' });
  // TODO: call AI provider with server-side key and return a concise coach response.
  res.status(200).json({ advice: 'Example: keep hard days hard, easy days easy, hit protein and sleep.' });
}
