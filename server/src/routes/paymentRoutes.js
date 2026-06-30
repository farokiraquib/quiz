const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');
const PLAN_LIMITS = require('../config/plans');

const router = express.Router();
router.use(authMiddleware);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plan Prices (in INR, multiply by 100 for paise)
const PLAN_PRICES = {
  STARTER: 0,
  SEMESTER_PASS: 1499,
  ANNUAL_PRO: 1999,
  INSTITUTE: 11999,
};

// Create Order
router.post('/create-order', async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!plan || !PLAN_PRICES.hasOwnProperty(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }
    
    const amount = PLAN_PRICES[plan] * 100; // in paise
    
    if (amount === 0) {
      // Free plan upgrade (downgrade) directly
      const updated = await prisma.teacher.update({
        where: { id: req.teacher.id },
        data: { plan: 'STARTER', razorpayOrderId: null, razorpayPaymentId: null }
      });
      return res.json({ success: true, plan: updated.plan, message: 'Switched to Starter plan' });
    }

    const options = {
      amount,
      currency: 'INR',
      receipt: `rcpt_${req.teacher.id.substring(0,8)}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    // Temporarily store order ID in db or just send to client
    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify Payment
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Calculate expiration date (e.g. 6 months for SEMESTER, 12 for PRO/INSTITUTE)
      let planExpiresAt = new Date();
      if (plan === 'SEMESTER_PASS') {
        planExpiresAt.setMonth(planExpiresAt.getMonth() + 6);
      } else {
        planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);
      }

      const updatedTeacher = await prisma.teacher.update({
        where: { id: req.teacher.id },
        data: {
          plan,
          planExpiresAt,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id
        }
      });

      res.json({ success: true, plan: updatedTeacher.plan });
    } else {
      res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;
