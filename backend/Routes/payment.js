const express = require('express');
const Stripe = require('stripe');
const addOneMonth = require('../utils/dataHelper');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Checkout create
router.post('/create-checkout', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: 'price_XXXX', quantity: 1 }],
    client_reference_id: req.user.id,
    success_url: 'https://ame.app/success',
    cancel_url: 'https://ame.app/cancel',
  });
  res.json({ url: session.url });
});

// Webhook
router.post('/webhook', async (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature'],
    process.env.WEBHOOK_SECRET
  );

  if (event.type === 'checkout.session.completed') {
    const userId = event.data.object.client_reference_id;
    await db.users.update(userId, {
      plan: 'premium',
      plan_expires_at: addOneMonth(new Date()),
    });
  }
  res.sendStatus(200);
});

module.exports = router;