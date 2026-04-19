// src/routes/poses.js - Pose Analysis Routes
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { poseAnalysisLimiter } = require('../middleware/rateLimiter');
const { getPrisma } = require('../utils/prismaClient');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'dummy' });

// All pose routes require authentication
router.use(authenticate);

// ── POST /api/poses/generate (Dynamic Claude Poses) ─────────────────────────
router.post('/generate', poseAnalysisLimiter, async (req, res, next) => {
  const { primaryScene, labels, lighting, isIndoor } = req.body;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are a professional portrait and fashion photographer with 20 years of experience.

SCENE ANALYSIS:
- Environment: ${primaryScene || 'general'}
- Detected objects: ${labels?.slice(0, 8).join(', ') || 'general'}
- Lighting: ${lighting || 'natural'}
- Setting: ${isIndoor ? 'Indoor' : 'Outdoor'}

Generate exactly 5 photography poses that are:
1. PERFECTLY SUITED for this exact scene
2. Varied in style, achievable by non-professionals
3. Defined using gesture-drawing brush strokes as normalized coordinates (0-1).

Each pose needs these SEPARATE stroke paths:
- head_neck: oval head + neck 
- left_arm: shoulder to elbow to wrist
- right_arm: shoulder to elbow to wrist
- torso: shoulder line → hip line
- left_leg: hip to knee to ankle
- right_leg: hip to knee to ankle

Respond ONLY with valid JSON, no other text:
{
  "poses": [
    {
      "id": "unique_id",
      "name": "Pose Name",
      "instruction": "Short instruction (max 8 words)",
      "vibe": "Mood",
      "strokes": [
        {
          "id": "head_neck",
          "baseWidth": 4,
          "pts": [
            {"x": 0.50, "y": 0.05},
            {"x": 0.48, "y": 0.10, "cp1x": 0.46, "cp1y": 0.08}
          ]
        },
        ... (repeat for other strokes) ...
      ],
      "miniIconPath": "M... SVG path for 60x80 icon"
    }
  ]
}`
      }]
    });

    const rawText = response.content[0].text.trim();
    // Strip markdown fences if present
    const jsonStr = rawText.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
    const data = JSON.parse(jsonStr);

    res.json({ poses: data.poses, scene: primaryScene, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Claude Pose Generation error:', err.message);
    res.status(500).json({ error: 'AI Brain exhausted. Using fallbacks.' });
  }
});

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
