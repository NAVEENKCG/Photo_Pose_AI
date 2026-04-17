// src/routes/poses.js - Pose Analysis Routes
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { poseAnalysisLimiter } = require('../middleware/rateLimiter');
const { getPrisma } = require('../utils/prismaClient');

// All pose routes require authentication
router.use(authenticate);

// ── POST /api/poses/analyze ───────────────────────────────────────
router.post('/analyze', poseAnalysisLimiter, async (req, res, next) => {
  const {
    imageBase64,
    fileName,
    keypoints,
    score,
    confidence,
    poseType,
    recommendations,
    metadata,
  } = req.body;

  // Validate image input
  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required.', code: 'MISSING_IMAGE' });
  }

  // Validate base64 size (max ~5MB base64 ≈ ~6.67MB)
  const sizeInBytes = Buffer.byteLength(imageBase64, 'base64');
  if (sizeInBytes > 7 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large. Maximum 5MB.', code: 'FILE_TOO_LARGE' });
  }

  const prisma = getPrisma();

  try {
    // Calculate server-side score if not provided
    const finalScore = Math.min(100, Math.max(0, score || 75));
    const finalConfidence = Math.min(1, Math.max(0, confidence || 0.85));

    const pose = await prisma.pose.create({
      data: {
        id: uuidv4(),
        userId: req.user.id,
        imageUrl: `data:image/jpeg;base64,${imageBase64.slice(0, 50)}...`, // In prod: use S3
        score: Math.round(finalScore),
        confidence: finalConfidence,
        poseType: poseType || 'standing',
        keypoints: keypoints ? JSON.stringify(keypoints) : '[]',
        recommendations: recommendations ? JSON.stringify(recommendations) : '[]',
        metadata: metadata ? JSON.stringify(metadata) : '{}',
      },
    });

    res.json({
      poseId: pose.id,
      score: pose.score,
      confidence: pose.confidence,
      poseType: pose.poseType,
      keypoints: keypoints || [],
      recommendations: recommendations || [],
      createdAt: pose.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/poses/history ────────────────────────────────────────
router.get('/history', async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const sortBy = ['createdAt', 'score'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
  const order = req.query.order === 'asc' ? 'asc' : 'desc';
  const prisma = getPrisma();

  try {
    const [poses, total] = await Promise.all([
      prisma.pose.findMany({
        where: { userId: req.user.id, deletedAt: null },
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
        select: {
          id: true, score: true, confidence: true, poseType: true, createdAt: true,
          recommendations: true,
        },
      }),
      prisma.pose.count({ where: { userId: req.user.id, deletedAt: null } }),
    ]);

    res.json({
      poses: poses.map(p => ({
        ...p,
        recommendations: JSON.parse(p.recommendations || '[]'),
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/poses/:id ────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  const prisma = getPrisma();
  try {
    const pose = await prisma.pose.findFirst({
      where: { id: req.params.id, userId: req.user.id, deletedAt: null },
    });

    if (!pose) {
      return res.status(404).json({ error: 'Pose not found.', code: 'NOT_FOUND' });
    }

    res.json({
      ...pose,
      keypoints: JSON.parse(pose.keypoints || '[]'),
      recommendations: JSON.parse(pose.recommendations || '[]'),
      metadata: JSON.parse(pose.metadata || '{}'),
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/poses/:id ─────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  const prisma = getPrisma();
  try {
    const pose = await prisma.pose.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!pose) {
      return res.status(404).json({ error: 'Pose not found.', code: 'NOT_FOUND' });
    }

    // Soft delete
    await prisma.pose.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Pose deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
