const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticateTeacher } = require('../middleware/auth');

// Get history of rooms created by the teacher
router.get('/', authenticateTeacher, async (req, res) => {
  try {
    const history = await prisma.roomHistory.findMany({
      where: {
        teacherId: req.teacher.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
    
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching room history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

module.exports = router;
