// src/routes/users.js - User Profile Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getPrisma } = require('../utils/prismaClient');

router.use(authenticate);

// ── GET /api/users/me ─────────────────────────────────────────────
router.get('/me', async (req, res, next) => {
  const prisma = getPrisma();
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        avatar: true, role: true, mfaEnabled: true, createdAt: true, lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.', code: 'NOT_FOUND' });
    }

    // Fetch stats
    const [totalPoses, avgScore] = await Promise.all([
      prisma.pose.count({ where: { userId: req.user.id, deletedAt: null } }),
      prisma.pose.aggregate({
        where: { userId: req.user.id, deletedAt: null },
        _avg: { score: true },
      }),
    ]);

    res.json({
      ...user,
      stats: {
        totalPoses,
        averageScore: Math.round(avgScore._avg.score || 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/users/me ─────────────────────────────────────────────
router.put('/me', [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).escape(),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).escape(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input.', code: 'VALIDATION_ERROR' });
  }

  const { firstName, lastName } = req.body;
  const prisma = getPrisma();

  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users/me/change-password ───────────────────────────
router.post('/me/change-password', [
  body('currentPassword').isLength({ min: 1 }),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid password format.', code: 'VALIDATION_ERROR' });
  }

  const { currentPassword, newPassword } = req.body;
  const prisma = getPrisma();

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect.', code: 'INVALID_PASSWORD' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash },
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/me/stats ───────────────────────────────────────
router.get('/me/stats', async (req, res, next) => {
  const prisma = getPrisma();
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalPoses, weeklyPoses, avgScore, topScore] = await Promise.all([
      prisma.pose.count({ where: { userId: req.user.id, deletedAt: null } }),
      prisma.pose.count({ where: { userId: req.user.id, deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
      prisma.pose.aggregate({
        where: { userId: req.user.id, deletedAt: null },
        _avg: { score: true },
      }),
      prisma.pose.aggregate({
        where: { userId: req.user.id, deletedAt: null },
        _max: { score: true },
      }),
    ]);

    res.json({
      totalPoses,
      weeklyPoses,
      averageScore: Math.round(avgScore._avg.score || 0),
      topScore: topScore._max.score || 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
