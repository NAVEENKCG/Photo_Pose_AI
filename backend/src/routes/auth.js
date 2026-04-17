// src/routes/auth.js - Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');
const { getPrisma } = require('../utils/prismaClient');

// ── Input Validators ──────────────────────────────────────────────
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format.'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, and number.'),
  body('firstName').trim().isLength({ min: 1, max: 50 }).escape(),
  body('lastName').trim().isLength({ min: 1, max: 50 }).escape(),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
];

// ── POST /api/auth/register ───────────────────────────────────────
router.post('/register', registerLimiter, registerValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Invalid input. Please check your data.',
      code: 'VALIDATION_ERROR',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  const { email, password, firstName, lastName } = req.body;
  const prisma = getPrisma();

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Something went wrong. Please try again.', code: 'CONFLICT' });
    }

    // Hash password with bcrypt (cost 12)
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'USER',
        isActive: true,
      },
    });

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token hash in DB
    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      userId: user.id,
      email: user.email,
      accessToken,
      refreshToken,
      expiresIn: 900,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────
router.post('/login', loginLimiter, loginValidation, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid credentials.', code: 'INVALID_CREDENTIALS' });
  }

  const { email, password } = req.body;
  const prisma = getPrisma();

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Constant-time comparison to prevent timing attacks
    const passwordHash = user?.passwordHash || '$2a$12$dummyhashtopreventtimingattacks';
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!user || !isValid || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token.', code: 'NO_TOKEN' });
  }

  const prisma = getPrisma();

  try {
    const payload = verifyRefreshToken(refreshToken);

    // Check token is in DB (not blacklisted)
    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, userId: payload.userId },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.', code: 'INVALID_TOKEN' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found.', code: 'USER_NOT_FOUND' });
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const newRefreshToken = generateRefreshToken(user.id);
    const newAccessToken = generateAccessToken(user.id, user.email, user.role);

    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.', code: 'INVALID_TOKEN' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────
router.post('/logout', authenticate, async (req, res, next) => {
  const { refreshToken } = req.body;
  const prisma = getPrisma();

  try {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { userId: req.user.id, token: refreshToken },
      });
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
