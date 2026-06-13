// Example only. Put this in a serverless function, never in frontend app.js.
// Requires: STRIPE_SECRET_KEY and PRICE_ID in server environment variables.
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { userId, successUrl, cancelUrl } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.PRICE_ID, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId }
  });
  res.status(200).json({ url: session.url });
}
