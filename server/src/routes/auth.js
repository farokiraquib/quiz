// Authentication routes: signup and login
// Uses Prisma for PostgreSQL

const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { signToken } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

// ─── POST /api/auth/signup ──────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if teacher already exists
    const existing = await prisma.teacher.findUnique({
      where: { email: normalizedEmail }
    });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const teacher = await prisma.teacher.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
      }
    });

    const token = signToken({ id: teacher.id, email: teacher.email, name: teacher.name });

    console.log(`[Auth] Signup: ${teacher.email}`);

    res.status(201).json({
      success: true,
      token,
      user: { id: teacher.id, email: teacher.email, name: teacher.name },
    });
  } catch (err) {
    console.error('[auth:signup] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    const teacher = await prisma.teacher.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, teacher.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ id: teacher.id, email: teacher.email, name: teacher.name });

    console.log(`[Auth] Login: ${teacher.email}`);

    res.json({
      success: true,
      token,
      user: { id: teacher.id, email: teacher.email, name: teacher.name },
    });
  } catch (err) {
    console.error('[auth:login] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
