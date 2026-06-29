// Quiz CRUD routes — all protected by auth middleware
// Uses Prisma for PostgreSQL

const express = require('express');
const prisma = require('../prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All quiz routes require authentication
router.use(authMiddleware);

// ─── GET /api/quizzes ───────────────────────────────────────────────
// List all quizzes for the authenticated teacher
router.get('/', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { teacherId: req.teacher.id },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ quizzes });
  } catch (err) {
    console.error('[quiz:list] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/quizzes ──────────────────────────────────────────────
// Create a new quiz
router.post('/', async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Title and questions array are required' });
    }

    const quiz = await prisma.quiz.create({
      data: {
        teacherId: req.teacher.id,
        title: title.trim(),
        questionsJson: questions,
      }
    });

    console.log(`[Quiz] Created: ${quiz.title} by ${req.teacher.email}`);
    res.status(201).json({ quiz });
  } catch (err) {
    console.error('[quiz:create] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/quizzes/:id ───────────────────────────────────────────
// Update an existing quiz
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, questions } = req.body;

    const existing = await prisma.quiz.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    if (existing.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to edit this quiz' });
    }

    const updatedData = {};
    if (title !== undefined) updatedData.title = title.trim();
    if (questions !== undefined) updatedData.questionsJson = questions;

    const quiz = await prisma.quiz.update({
      where: { id },
      data: updatedData
    });

    console.log(`[Quiz] Updated: ${quiz.title}`);
    res.json({ quiz });
  } catch (err) {
    console.error('[quiz:update] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/quizzes/:id ────────────────────────────────────────
// Delete a quiz
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.quiz.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    if (existing.teacherId !== req.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to delete this quiz' });
    }

    await prisma.quiz.delete({
      where: { id }
    });

    console.log(`[Quiz] Deleted: ${existing.title}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[quiz:delete] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
