package com.poseguide.ai.presentation.overlay

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PointF
import android.view.View
import com.poseguide.ai.domain.model.NormalizedLandmark
import com.poseguide.ai.data.pose.JointConfidence
import android.graphics.DashPathEffect

class GhostOverlayRenderer(context: Context) : View(context) {

    var isFrontCamera: Boolean = false

    private val ghostPaint = Paint().apply {
        color = Color.WHITE
        strokeWidth = 3.5f * context.resources.displayMetrics.density
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        alpha = 210
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
    private var jointConfidence: JointConfidence? = null
    
    private val VISIBILITY_THRESHOLD = 0.5f

    fun updateOverlay(
        ghost: List<NormalizedLandmark>,
        real: List<NormalizedLandmark>,
        confidence: Float,
        jointConf: JointConfidence? = null
    ) {
        this.ghostLandmarks = ghost
        this.realLandmarks = real
        this.confidenceScore = confidence
        this.jointConfidence = jointConf
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (ghostLandmarks.size < 33) return

        val fw = width
        val fh = height

        if (isFrontCamera) {
            canvas.save()
            canvas.scale(-1f, 1f, fw / 2f, fh / 2f)
        }

        // ML Kit Pose connections (excluding the ones handled by chains)
        val chainPairs = setOf(
            Pair(11, 13), Pair(13, 15), Pair(12, 14), Pair(14, 16),
            Pair(23, 25), Pair(25, 27), Pair(24, 26), Pair(26, 28),
            Pair(0, 11), Pair(11, 23)
        )
        
        val connections = listOf(
            Pair(0, 1), Pair(1, 2), Pair(2, 3), Pair(3, 7), Pair(0, 4), Pair(4, 5), Pair(5, 6), Pair(6, 8),
            Pair(9, 10), Pair(11, 12), Pair(15, 17), Pair(15, 19), Pair(15, 21),
            Pair(17, 19), Pair(16, 18), Pair(16, 20), Pair(16, 22), Pair(18, 20),
            Pair(12, 24), Pair(23, 24), Pair(27, 29), Pair(28, 30), Pair(29, 31), Pair(30, 32), Pair(27, 31), Pair(28, 32)
        ).filter { !chainPairs.contains(it) }

        // Draw bezier chains
        val chains = listOf(
            listOf(11, 13, 15), listOf(12, 14, 16),
            listOf(23, 25, 27), listOf(24, 26, 28),
            listOf(0, 11, 23)
        )
        
        val jc = jointConfidence
        for (chain in chains) {
            if (chain.any { ghostLandmarks[it].visibility() < VISIBILITY_THRESHOLD }) continue
            val pts = chain.map { ghostLandmarks[it].toCanvas(fw, fh) }
            val path = smoothedPath(pts)
            val avgConf = if (jc != null) chain.map { jc.perJoint[it] ?: 0f }.average().toFloat() else 0f
            ghostPaint.color = jointColor(avgConf)
            canvas.drawPath(path, ghostPaint)
        }

        // Draw remaining skeleton lines
        for ((start, end) in connections) {
            val startLm = ghostLandmarks[start]
            val endLm = ghostLandmarks[end]
            if (startLm.visibility() < VISIBILITY_THRESHOLD || endLm.visibility() < VISIBILITY_THRESHOLD) continue
            
            val avgConf = if (jc != null) ((jc.perJoint[start] ?: 0f) + (jc.perJoint[end] ?: 0f)) / 2f else 0f
            ghostPaint.color = jointColor(avgConf)
            
            val startPt = startLm.toCanvas(fw, fh)
            val endPt = endLm.toCanvas(fw, fh)
            canvas.drawLine(startPt.x, startPt.y, endPt.x, endPt.y, ghostPaint)
        }

        // Draw joint dots
        for ((idx, lm) in ghostLandmarks.withIndex()) {
            val pt = lm.toCanvas(fw, fh)
            if (lm.visibility() < VISIBILITY_THRESHOLD) {
                val dashPaint = Paint().apply {
                    color = Color.WHITE; alpha = 80
                    style = Paint.Style.STROKE; strokeWidth = 1.5f
                    pathEffect = DashPathEffect(floatArrayOf(4f, 4f), 0f)
                }
                canvas.drawCircle(pt.x, pt.y, 10f, dashPaint)
                continue
            }
            val conf = jc?.perJoint?.get(idx) ?: 0f
            jointDotPaint.color = jointColor(conf)
            canvas.drawCircle(pt.x, pt.y, 7f, jointDotPaint)
        }

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
        
        if (isFrontCamera) {
            canvas.restore()
        }
    }

    private fun jointColor(confidence: Float): Int = when {
        confidence >= 0.75f -> Color.parseColor("#1D9E75")  // teal = matched
        confidence >= 0.45f -> Color.parseColor("#EF9F27")  // amber = close
        else                -> Color.parseColor("#E24B4A")  // red = wrong
    }

    private fun smoothedPath(points: List<PointF>): Path {
        val path = Path()
        if (points.size < 2) return path
        path.moveTo(points[0].x, points[0].y)
        for (i in 0 until points.size - 1) {
            val p0 = if (i > 0) points[i - 1] else points[i]
            val p1 = points[i]
            val p2 = points[i + 1]
            val p3 = if (i + 2 < points.size) points[i + 2] else p2
            val tension = 0.4f
            val cp1x = p1.x + (p2.x - p0.x) * tension
            val cp1y = p1.y + (p2.y - p0.y) * tension
            val cp2x = p2.x - (p3.x - p1.x) * tension
            val cp2y = p2.y - (p3.y - p1.y) * tension
            path.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
        }
        return path
    }
}
