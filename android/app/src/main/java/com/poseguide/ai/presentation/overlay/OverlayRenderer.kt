package com.poseguide.ai.presentation.overlay

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.PointF
import android.graphics.RectF
import android.graphics.SweepGradient
import androidx.core.graphics.toColorInt
import com.poseguide.ai.domain.model.LandmarkPoint
import com.poseguide.ai.domain.model.PoseLandmarkType
import com.poseguide.ai.domain.model.PoseLandmarks
import com.poseguide.ai.domain.model.PoseMatchResult
import com.poseguide.ai.domain.model.PoseTemplate
import kotlin.math.*

/**
 * OverlayRenderer — draws the pose guidance overlay directly onto a [Canvas].
 *
 * Elements rendered:
 *  1. Skeleton silhouette of the target pose (dashed, light blue)
 *  2. Skeleton of detected user pose (solid, white)
 *  3. Arrow guides pointing to body parts needing adjustment
 *  4. Confidence ring around the subject bounding box
 *  5. "Ready to Shoot" glow pulse when confidence > 80%
 */
class OverlayRenderer {

    // ─── Paints ────────────────────────────────────────────────────────────────

    private val skeletonPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        strokeWidth = 4f
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    private val targetPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#4DA8FF")
        strokeWidth = 3f
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        pathEffect = DashPathEffect(floatArrayOf(12f, 8f), 0f)
    }

    private val arrowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFD700")
        strokeWidth = 3f
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    private val arrowFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFD700")
        style = Paint.Style.FILL
    }

    private val ringBasePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 6f
        color = Color.parseColor("#33FFFFFF")
    }

    private val ringProgressPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 6f
        color = Color.parseColor("#00E5FF")
        strokeCap = Paint.Cap.ROUND
    }

    private val readyGlowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 14f
        color = Color.parseColor("#8000FF80")
    }

    private val jointPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        style = Paint.Style.FILL
    }

    // ─── Public Draw Entry Point ───────────────────────────────────────────────

    fun draw(
        canvas: Canvas,
        viewWidth: Int,
        viewHeight: Int,
        userLandmarks: PoseLandmarks?,
        template: PoseTemplate?,
        matchResult: PoseMatchResult?
    ) {
        if (template == null) return

        // Draw target skeleton (dashed) — approximate positions
        drawTargetSilhouette(canvas, viewWidth, viewHeight, template)

        // Draw user's detected skeleton
        if (userLandmarks != null) {
            drawUserSkeleton(canvas, viewWidth, viewHeight, userLandmarks)

            // Draw adjustment arrows for misaligned joints
            if (matchResult != null) {
                drawAdjustmentArrows(canvas, viewWidth, viewHeight, userLandmarks, matchResult)
                drawConfidenceRing(canvas, viewWidth, viewHeight, userLandmarks, matchResult)
            }
        }
    }

    // ─── Target Silhouette ─────────────────────────────────────────────────────

    private fun drawTargetSilhouette(
        canvas: Canvas, w: Int, h: Int, template: PoseTemplate
    ) {
        // Approximate canonical body positions for visual hint
        // These are normalized [0,1] coords — positioned in lower 60% of frame
        val canonical = buildCanonicalPositions(w, h)
        SKELETON_CONNECTIONS.forEach { (a, b) ->
            val p1 = canonical[a] ?: return@forEach
            val p2 = canonical[b] ?: return@forEach
            if (a in template.bodyParts || b in template.bodyParts) {
                canvas.drawLine(p1.x, p1.y, p2.x, p2.y, targetPaint)
            }
        }
    }

    // ─── User Skeleton ─────────────────────────────────────────────────────────

    private fun drawUserSkeleton(
        canvas: Canvas, w: Int, h: Int, landmarks: PoseLandmarks
    ) {
        fun point(type: PoseLandmarkType): PointF? {
            val lm = landmarks.get(type) ?: return null
            if (lm.inFrameLikelihood < 0.5f) return null
            // ML Kit normalized coords: x,y in pixel space from InputImage dimensions
            // We scale relative to view size
            return PointF(lm.x / 1f * w, lm.y / 1f * h)
                .takeIf { it.x in 0f..w.toFloat() && it.y in 0f..h.toFloat() }
        }

        SKELETON_CONNECTIONS.forEach { (a, b) ->
            val p1 = point(a) ?: return@forEach
            val p2 = point(b) ?: return@forEach
            skeletonPaint.alpha = 200
            canvas.drawLine(p1.x, p1.y, p2.x, p2.y, skeletonPaint)
        }

        // Draw joints
        PoseLandmarkType.entries.forEach { type ->
            val p = point(type) ?: return@forEach
            canvas.drawCircle(p.x, p.y, 6f, jointPaint)
        }
    }

    // ─── Adjustment Arrows ─────────────────────────────────────────────────────

    private fun drawAdjustmentArrows(
        canvas: Canvas, w: Int, h: Int,
        landmarks: PoseLandmarks, matchResult: PoseMatchResult
    ) {
        matchResult.partialFeedback.forEach { (landmarkType, _) ->
            val lm = landmarks.get(landmarkType) ?: return@forEach
            if (lm.inFrameLikelihood < 0.5f) return@forEach
            val x = lm.x / 1f * w
            val y = lm.y / 1f * h
            // Draw a pulsing yellow arrow indicator
            drawArrow(canvas, x, y - 40f, x, y - 12f)
        }
    }

    private fun drawArrow(canvas: Canvas, x1: Float, y1: Float, x2: Float, y2: Float) {
        canvas.drawLine(x1, y1, x2, y2, arrowPaint)
        // Arrowhead
        val angle = atan2((y2 - y1).toDouble(), (x2 - x1).toDouble()).toFloat()
        val arrowSize = 16f
        val p1x = x2 - arrowSize * cos(angle - PI / 6).toFloat()
        val p1y = y2 - arrowSize * sin(angle - PI / 6).toFloat()
        val p2x = x2 - arrowSize * cos(angle + PI / 6).toFloat()
        val p2y = y2 - arrowSize * sin(angle + PI / 6).toFloat()
        val path = android.graphics.Path()
        path.moveTo(x2, y2); path.lineTo(p1x, p1y); path.lineTo(p2x, p2y); path.close()
        canvas.drawPath(path, arrowFillPaint)
    }

    // ─── Confidence Ring ───────────────────────────────────────────────────────

    private fun drawConfidenceRing(
        canvas: Canvas, w: Int, h: Int,
        landmarks: PoseLandmarks, matchResult: PoseMatchResult
    ) {
        val (center, radius) = computeSubjectBounds(landmarks, w, h) ?: return
        val oval = RectF(
            center.x - radius, center.y - radius,
            center.x + radius, center.y + radius
        )

        // Base ring
        canvas.drawOval(oval, ringBasePaint)

        // Progress arc
        val sweepAngle = 360f * matchResult.score
        canvas.drawArc(oval, -90f, sweepAngle, false, ringProgressPaint)

        // Ready-to-shoot glow
        if (matchResult.isReadyToShoot) {
            readyGlowPaint.color = Color.parseColor("#AA00FF88")
            canvas.drawOval(oval, readyGlowPaint)
        }
    }

    private fun computeSubjectBounds(
        landmarks: PoseLandmarks, w: Int, h: Int
    ): Pair<PointF, Float>? {
        val keyPoints = listOf(
            PoseLandmarkType.NOSE, PoseLandmarkType.LEFT_SHOULDER,
            PoseLandmarkType.RIGHT_SHOULDER, PoseLandmarkType.LEFT_HIP,
            PoseLandmarkType.RIGHT_HIP
        ).mapNotNull { landmarks.get(it) }.filter { it.inFrameLikelihood > 0.5f }

        if (keyPoints.isEmpty()) return null

        val xs = keyPoints.map { it.x / 1f * w }
        val ys = keyPoints.map { it.y / 1f * h }
        val cx = xs.average().toFloat()
        val cy = ys.average().toFloat()
        val radius = max(xs.max() - xs.min(), ys.max() - ys.min()) * 0.65f
        return PointF(cx, cy) to radius
    }

    // ─── Canonical Positions ──────────────────────────────────────────────────

    private fun buildCanonicalPositions(w: Int, h: Int): Map<PoseLandmarkType, PointF> {
        // Normalized skeleton centered horizontally, occupying lower 70% of frame
        val cx = w / 2f
        val top = h * 0.2f
        val scale = h * 0.12f
        return mapOf(
            PoseLandmarkType.NOSE            to PointF(cx, top),
            PoseLandmarkType.LEFT_SHOULDER   to PointF(cx - scale * 1.2f, top + scale * 1.5f),
            PoseLandmarkType.RIGHT_SHOULDER  to PointF(cx + scale * 1.2f, top + scale * 1.5f),
            PoseLandmarkType.LEFT_ELBOW      to PointF(cx - scale * 1.8f, top + scale * 3f),
            PoseLandmarkType.RIGHT_ELBOW     to PointF(cx + scale * 1.8f, top + scale * 3f),
            PoseLandmarkType.LEFT_WRIST      to PointF(cx - scale * 2f, top + scale * 4.5f),
            PoseLandmarkType.RIGHT_WRIST     to PointF(cx + scale * 2f, top + scale * 4.5f),
            PoseLandmarkType.LEFT_HIP        to PointF(cx - scale * 0.9f, top + scale * 4.2f),
            PoseLandmarkType.RIGHT_HIP       to PointF(cx + scale * 0.9f, top + scale * 4.2f),
            PoseLandmarkType.LEFT_KNEE       to PointF(cx - scale * 1f, top + scale * 6f),
            PoseLandmarkType.RIGHT_KNEE      to PointF(cx + scale * 1f, top + scale * 6f),
            PoseLandmarkType.LEFT_ANKLE      to PointF(cx - scale * 1.1f, top + scale * 7.8f),
            PoseLandmarkType.RIGHT_ANKLE     to PointF(cx + scale * 1.1f, top + scale * 7.8f),
        )
    }

    companion object {
        val SKELETON_CONNECTIONS = listOf(
            PoseLandmarkType.NOSE to PoseLandmarkType.LEFT_SHOULDER,
            PoseLandmarkType.NOSE to PoseLandmarkType.RIGHT_SHOULDER,
            PoseLandmarkType.LEFT_SHOULDER to PoseLandmarkType.RIGHT_SHOULDER,
            PoseLandmarkType.LEFT_SHOULDER to PoseLandmarkType.LEFT_ELBOW,
            PoseLandmarkType.LEFT_ELBOW to PoseLandmarkType.LEFT_WRIST,
            PoseLandmarkType.RIGHT_SHOULDER to PoseLandmarkType.RIGHT_ELBOW,
            PoseLandmarkType.RIGHT_ELBOW to PoseLandmarkType.RIGHT_WRIST,
            PoseLandmarkType.LEFT_SHOULDER to PoseLandmarkType.LEFT_HIP,
            PoseLandmarkType.RIGHT_SHOULDER to PoseLandmarkType.RIGHT_HIP,
            PoseLandmarkType.LEFT_HIP to PoseLandmarkType.RIGHT_HIP,
            PoseLandmarkType.LEFT_HIP to PoseLandmarkType.LEFT_KNEE,
            PoseLandmarkType.LEFT_KNEE to PoseLandmarkType.LEFT_ANKLE,
            PoseLandmarkType.RIGHT_HIP to PoseLandmarkType.RIGHT_KNEE,
            PoseLandmarkType.RIGHT_KNEE to PoseLandmarkType.RIGHT_ANKLE,
        )
    }
}
