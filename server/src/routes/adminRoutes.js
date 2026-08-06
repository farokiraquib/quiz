const express = require('express');
const prisma = require('../prisma');
const { getAllRoomsAdmin, removeRoom } = require('../gameState');

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

// ─── GET /api/admin/live-rooms ───────────────────────────────────────
router.get('/live-rooms', async (req, res) => {
  try {
    const allRooms = await getAllRoomsAdmin();
    const activeRooms = allRooms.filter(r => r.status !== 'finished');
    // activeRooms has { code, status, teacherId, players }
    
    // Resolve teacher info for each room
    const teacherIds = [...new Set(activeRooms.map(r => r.teacherId).filter(Boolean))];
    const teachers = await prisma.teacher.findMany({
      where: { id: { in: teacherIds } },
      select: { id: true, name: true, email: true, plan: true }
    });
    
    const teacherMap = {};
    teachers.forEach(t => { teacherMap[t.id] = t; });
    
    const enrichedRooms = activeRooms.map(r => ({
      code: r.code,
      status: r.status,
      players: r.players,
      teacher: r.teacherId ? teacherMap[r.teacherId] || null : null
    }));
    
    res.json({ success: true, liveRooms: enrichedRooms });
  } catch (err) {
    console.error('[admin:get-live-rooms] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/admin/live-rooms/:code ──────────────────────────────
router.delete('/live-rooms/:code', async (req, res) => {
  try {
    const { code } = req.params;
    await removeRoom(code);
    res.json({ success: true, message: `Room ${code} deleted successfully.` });
  } catch (err) {
    console.error(`[admin:delete-room] Error deleting room ${req.params.code}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/admin/room-history ─────────────────────────────────────
router.get('/room-history', async (req, res) => {
  try {
    const history = await prisma.roomHistory.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          select: { id: true, name: true, email: true, plan: true }
        }
      },
      take: 200 // Limit to recent 200 for performance
    });
    
    res.json({ success: true, history });
  } catch (err) {
    console.error('[admin:get-room-history] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
