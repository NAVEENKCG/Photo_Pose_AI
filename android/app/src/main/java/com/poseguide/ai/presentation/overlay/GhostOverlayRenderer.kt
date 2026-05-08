package com.poseguide.ai.presentation.overlay

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PointF
import android.view.View
import com.poseguide.ai.domain.model.NormalizedLandmark
import kotlin.math.hypot

class GhostOverlayRenderer(context: Context) : View(context) {

    private val ghostPaint = Paint().apply {
        color = Color.WHITE
        strokeWidth = 3.5f * context.resources.displayMetrics.density
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        alpha = 210
    }

    private val ghostFillPaint = Paint().apply {
        color = Color.WHITE
        alpha = 18
        style = Paint.Style.FILL
    }

    private val jointDotPaint = Paint().apply {
        color = Color.WHITE
        alpha = 180
        style = Paint.Style.FILL
    }

    private val confidenceRingPaint = Paint().apply {
        color = Color.parseColor("#1D9E75") // Teal
        strokeWidth = 4f * context.resources.displayMetrics.density
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }

    private var ghostLandmarks: List<NormalizedLandmark> = emptyList()
    private var realLandmarks: List<NormalizedLandmark> = emptyList()
    private var confidenceScore: Float = 0f

    fun updateOverlay(
        ghost: List<NormalizedLandmark>,
        real: List<NormalizedLandmark>,
        confidence: Float
    ) {
        this.ghostLandmarks = ghost
        this.realLandmarks = real
        this.confidenceScore = confidence
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (ghostLandmarks.size < 33) return

        val fw = width
        val fh = height

        // ML Kit Pose connections
        val connections = listOf(
            Pair(0, 1), Pair(1, 2), Pair(2, 3), Pair(3, 7), Pair(0, 4), Pair(4, 5), Pair(5, 6), Pair(6, 8),
            Pair(9, 10), Pair(11, 12), Pair(11, 13), Pair(13, 15), Pair(15, 17), Pair(15, 19), Pair(15, 21),
            Pair(17, 19), Pair(12, 14), Pair(14, 16), Pair(16, 18), Pair(16, 20), Pair(16, 22), Pair(18, 20),
            Pair(11, 23), Pair(12, 24), Pair(23, 24), Pair(23, 25), Pair(24, 26), Pair(25, 27), Pair(26, 28),
            Pair(27, 29), Pair(28, 30), Pair(29, 31), Pair(30, 32), Pair(27, 31), Pair(28, 32)
        )

        // Draw skeleton lines
        for ((start, end) in connections) {
            val startPt = ghostLandmarks[start].toCanvas(fw, fh)
            val endPt = ghostLandmarks[end].toCanvas(fw, fh)
            canvas.drawLine(startPt.x, startPt.y, endPt.x, endPt.y, ghostPaint)
        }

        // Draw joint dots
        for (lm in ghostLandmarks) {
            val pt = lm.toCanvas(fw, fh)
            canvas.drawCircle(pt.x, pt.y, 5f * context.resources.displayMetrics.density, jointDotPaint)
        }

        // Draw body contour
        val contourPath = buildBodyContour(ghostLandmarks, fw, fh)
        canvas.drawPath(contourPath, ghostFillPaint)
        
        val alphaOld = ghostPaint.alpha
        ghostPaint.alpha = 90
        canvas.drawPath(contourPath, ghostPaint)
        ghostPaint.alpha = alphaOld

        // Draw confidence ring around the person if score > 30%
        if (confidenceScore > 0.3f && realLandmarks.isNotEmpty()) {
            val midHipX = (realLandmarks[23].x + realLandmarks[24].x) / 2f * fw
            val midHipY = (realLandmarks[23].y + realLandmarks[24].y) / 2f * fh
            val sweepAngle = confidenceScore * 360f
            
            // Draw a subtle background track for the ring
            val trackPaint = Paint(confidenceRingPaint).apply { alpha = 40 }
            canvas.drawArc(
                midHipX - 200f, midHipY - 200f, midHipX + 200f, midHipY + 200f,
                -90f, 360f, false, trackPaint
            )
            
            canvas.drawArc(
                midHipX - 200f, midHipY - 200f, midHipX + 200f, midHipY + 200f,
                -90f, sweepAngle, false, confidenceRingPaint
            )
        }
    }

    private fun buildBodyContour(landmarks: List<NormalizedLandmark>, fw: Int, fh: Int): Path {
        val path = Path()
        val head = landmarks[0].toCanvas(fw, fh)
        val lShoulder = landmarks[11].toCanvas(fw, fh)
        val rShoulder = landmarks[12].toCanvas(fw, fh)
        val lHip = landmarks[23].toCanvas(fw, fh)
        val rHip = landmarks[24].toCanvas(fw, fh)

        val shoulderMidX = (lShoulder.x + rShoulder.x) / 2f
        val shoulderMidY = (lShoulder.y + rShoulder.y) / 2f
        val headR = hypot(head.x - shoulderMidX, head.y - shoulderMidY) * 0.45f
        
        path.addCircle(head.x, head.y, headR, Path.Direction.CW)

        path.moveTo(lShoulder.x, lShoulder.y)
        path.cubicTo(
            lShoulder.x - 15f * resources.displayMetrics.density, lShoulder.y + 20f * resources.displayMetrics.density,
            lHip.x - 10f * resources.displayMetrics.density, lHip.y - 20f * resources.displayMetrics.density,
            lHip.x, lHip.y
        )
        path.lineTo(rHip.x, rHip.y)
        path.cubicTo(
            rHip.x + 10f * resources.displayMetrics.density, rHip.y - 20f * resources.displayMetrics.density,
            rShoulder.x + 15f * resources.displayMetrics.density, rShoulder.y + 20f * resources.displayMetrics.density,
            rShoulder.x, rShoulder.y
        )
        path.close()

        return path
    }
}
