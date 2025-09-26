const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const PLAN_PRICES = {
    plus: process.env.STRIPE_PLUS_PRICE_ID || 'price_plus',
    pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro'
};

router.post('/create-checkout-session', protect, async (req, res) => {
    try {
        const { plan } = req.body;

        if (!['plus', 'pro'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        let customer;
        if (req.user.stripeCustomerId) {
            customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
        } else {
            customer = await stripe.customers.create({
                email: req.user.email,
                name: req.user.name,
                metadata: {
                    userId: req.user._id.toString()
                }
            });

            req.user.stripeCustomerId = customer.id;
            await req.user.save();
        }

        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [{
                price: PLAN_PRICES[plan],
                quantity: 1
            }],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing`,
            metadata: {
                userId: req.user._id.toString(),
                plan: plan
            }
        });

        res.json({ success: true, sessionId: session.id, url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/buy-credits', protect, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount < 20) {
            return res.status(400).json({ error: 'Minimum purchase is $20' });
        }

        const session = await stripe.checkout.sessions.create({
            customer: req.user.stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Ad Credits',
                        description: `$${amount} worth of advertising credits`
                    },
                    unit_amount: amount * 100
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/dashboard?credits_added=true`,
            cancel_url: `${process.env.FRONTEND_URL}/dashboard`,
            metadata: {
                userId: req.user._id.toString(),
                type: 'credits',
                amount: amount.toString()
            }
        });

        res.json({ success: true, sessionId: session.id, url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const userId = session.metadata.userId;
                const user = await User.findById(userId);

                if (session.metadata.type === 'credits') {
                    const amount = parseInt(session.metadata.amount);
                    user.adCredits += amount;
                    await user.save();
                } else {
                    user.plan = session.metadata.plan;
                    user.subscriptionStatus = 'active';
                    user.stripeSubscriptionId = session.subscription;
                    await user.save();
                }
                break;

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                const customer = await User.findOne({ stripeSubscriptionId: subscription.id });
                
                if (customer) {
                    customer.subscriptionStatus = subscription.status;
                    if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
                        customer.plan = 'free';
                    }
                    await customer.save();
                }
                break;
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

router.post('/cancel-subscription', protect, async (req, res) => {
    try {
        if (!req.user.stripeSubscriptionId) {
            return res.status(400).json({ error: 'No active subscription' });
        }

        await stripe.subscriptions.cancel(req.user.stripeSubscriptionId);

        req.user.subscriptionStatus = 'canceled';
        req.user.plan = 'free';
        await req.user.save();

        res.json({ success: true, message: 'Subscription canceled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;