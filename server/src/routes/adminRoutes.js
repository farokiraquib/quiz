const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// Simple hardcoded admin password for demo purposes.
// In a real app, use a dedicated Admin model + JWT.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'livequizz_admin_123';

// Middleware to check admin password
function adminAuth(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Invalid admin password.' });
  }
}

router.use(adminAuth);

// ─── GET /api/admin/promos ──────────────────────────────────────────
router.get('/promos', async (req, res) => {
  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, promos });
  } catch (err) {
    console.error('[admin:get-promos] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/admin/promos ─────────────────────────────────────────
router.post('/promos', async (req, res) => {
  try {
    const { code, discountPercentage, maxUses } = req.body;

    if (!code || typeof discountPercentage !== 'number') {
      return res.status(400).json({ error: 'Code and discountPercentage are required.' });
    }

    if (discountPercentage <= 0 || discountPercentage > 100) {
      return res.status(400).json({ error: 'Discount must be between 1 and 100.' });
    }

    const uppercaseCode = code.toUpperCase().trim();

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: uppercaseCode }
    });

    if (existing) {
      return res.status(409).json({ error: 'Promo code already exists.' });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: uppercaseCode,
        discountPercentage,
        maxUses: maxUses ? parseInt(maxUses) : null,
      }
    });

    res.status(201).json({ success: true, promo });
  } catch (err) {
    console.error('[admin:create-promo] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/admin/promos/:id/toggle ───────────────────────────────
router.put('/promos/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const promo = await prisma.promoCode.update({
      where: { id },
      data: { active }
    });

    res.json({ success: true, promo });
  } catch (err) {
    console.error('[admin:toggle-promo] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
