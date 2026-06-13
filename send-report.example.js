// Example only. Use a provider such as Resend, SendGrid, Mailgun, Postmark or SMTP from serverless.
// Never expose provider API keys in the browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { to, subject, text } = req.body || {};
  if (!to || !subject || !text) return res.status(400).json({ error: 'Missing fields' });
  // TODO: call email provider with process.env.EMAIL_API_KEY
  res.status(200).json({ ok: true, preview: { to, subject, chars: text.length } });
}
