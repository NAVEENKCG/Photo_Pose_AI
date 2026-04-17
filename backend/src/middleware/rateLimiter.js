// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// General API rate limit: 100 requests per 10 minutes
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
});

// Login: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.', code: 'LOGIN_RATE_LIMIT' },
});

// Register: 3 attempts per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again in 1 hour.', code: 'REGISTER_RATE_LIMIT' },
});

// Pose analysis: 30 per hour per user
const poseAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Pose analysis limit reached for this hour.', code: 'POSE_RATE_LIMIT' },
});

module.exports = { generalLimiter, loginLimiter, registerLimiter, poseAnalysisLimiter };
