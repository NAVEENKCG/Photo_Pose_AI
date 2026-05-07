package com.poseguide.ai.presentation.overlay

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import androidx.core.content.ContextCompat
import com.poseguide.ai.domain.model.*

class OverlayRenderer @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var poseMatch: PoseMatchResult? = null
    private var activeTemplate: PoseTemplate? = null
    private var bodyProportions: BodyProportions? = null
    
    // XMAGE UI Colors
    private val colorXmageTeal = Color.parseColor("#1D9E75")
    private val colorRed = Color.parseColor("#E53935")
    private val colorAmber = Color.parseColor("#FFB300")
    
    // Paint objects
    private val silhouettePaint = Paint().apply {
        color = Color.WHITE
        alpha = (255 * 0.35f).toInt()
        strokeWidth = 12f
        style = Paint.Style.STROKE
        pathEffect = DashPathEffect(floatArrayOf(30f, 20f), 0f)
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        isAntiAlias = true
    }

    private val userSkeletonPaint = Paint().apply {
        color = colorXmageTeal
        strokeWidth = 8f
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        isAntiAlias = true
    }
    
    private val confidenceRingPaint = Paint().apply {
        style = Paint.Style.STROKE
        strokeWidth = 16f
        strokeCap = Paint.Cap.ROUND
        isAntiAlias = true
    }

    private val textPaint = Paint().apply {
        color = Color.WHITE
        textSize = 48f
        isAntiAlias = true
        textAlign = Paint.Align.CENTER
        setShadowLayer(8f, 0f, 4f, Color.BLACK)
    }

    fun updateOverlay(
        matchResult: PoseMatchResult?, 
        template: PoseTemplate?, 
        proportions: BodyProportions?
    ) {
        this.poseMatch = matchResult
        this.activeTemplate = template
        this.bodyProportions = proportions
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val template = activeTemplate ?: return
        
        // In a real app we'd map normalized landmarks from template.landmarkAngles 
        // to canvas coordinates scaled by bodyProportions.
        // For this demo, we'll draw a simplified abstract representation.
        
        val cx = width / 2f
        val cy = height / 2f
        
        // 1. Draw Silhouette (Dashed White)
        drawSilhouette(canvas, cx, cy)
        
        // 2. Draw user feedback if match result exists
        poseMatch?.let { match ->
            // Confidence Ring
            drawConfidenceRing(canvas, cx, height - 150f, match.score)
            
            // Score text
            canvas.drawText("${(match.score * 100).toInt()}% Match", cx, height - 130f, textPaint)
            
            // Draw adjustment arrows for partial feedback
            if (match.partialFeedback.isNotEmpty()) {
                drawAdjustmentArrows(canvas, match.partialFeedback)
            }
        }
    }

    private fun drawSilhouette(canvas: Canvas, cx: Float, cy: Float) {
        val path = Path()
        
        // Body scaling factors dynamically adjusting to the user's measured proportions
        val torsoRatio = bodyProportions?.torsoLengthRatio ?: 0.4f
        val shoulderRatio = bodyProportions?.shoulderWidthRatio ?: 0.4f
        val legRatio = bodyProportions?.legLengthRatio ?: 0.45f
        
        // Convert ratios to canvas pixel dimensions
        val torsoLength = height * torsoRatio
        val shoulderWidth = width * shoulderRatio
        val legLength = height * legRatio
        
        // Base anchor points
        val headCenterY = cy - (torsoLength / 2f) - (height * 0.08f)
        val headRadius = height * 0.06f * (torsoRatio / 0.4f).coerceIn(0.8f, 1.2f)
        
        val shoulderY = cy - (torsoLength / 2f)
        val hipY = cy + (torsoLength / 2f)
        
        // Head
        canvas.drawCircle(cx, headCenterY, headRadius, silhouettePaint)
        
        // Spine (Neck to Hips)
        path.moveTo(cx, headCenterY + headRadius)
        path.lineTo(cx, hipY)
        
        // Shoulders (Left to Right)
        val leftShoulderX = cx - (shoulderWidth / 2f)
        val rightShoulderX = cx + (shoulderWidth / 2f)
        path.moveTo(leftShoulderX, shoulderY)
        path.lineTo(rightShoulderX, shoulderY)
        
        // Left Arm (Abstractly bent)
        path.moveTo(leftShoulderX, shoulderY)
        path.lineTo(leftShoulderX - (shoulderWidth * 0.2f), shoulderY + (torsoLength * 0.4f))
        path.lineTo(leftShoulderX + (shoulderWidth * 0.1f), shoulderY + (torsoLength * 0.8f))
        
        // Right Arm (Abstractly bent)
        path.moveTo(rightShoulderX, shoulderY)
        path.lineTo(rightShoulderX + (shoulderWidth * 0.2f), shoulderY + (torsoLength * 0.4f))
        path.lineTo(rightShoulderX - (shoulderWidth * 0.1f), shoulderY + (torsoLength * 0.8f))
        
        // Hips (Left to Right)
        val hipWidth = shoulderWidth * 0.8f
        val leftHipX = cx - (hipWidth / 2f)
        val rightHipX = cx + (hipWidth / 2f)
        path.moveTo(leftHipX, hipY)
        path.lineTo(rightHipX, hipY)
        
        // Left Leg
        path.moveTo(leftHipX, hipY)
        path.lineTo(leftHipX, hipY + legLength)
        
        // Right Leg
        path.moveTo(rightHipX, hipY)
        path.lineTo(rightHipX, hipY + legLength)

        canvas.drawPath(path, silhouettePaint)
    }

    private fun drawConfidenceRing(canvas: Canvas, cx: Float, cy: Float, score: Float) {
        val rect = RectF(cx - 80f, cy - 80f, cx + 80f, cy + 80f)
        
        confidenceRingPaint.color = when {
            score >= PoseMatchResult.READY_THRESHOLD -> colorXmageTeal
            score >= 0.5f -> colorAmber
            else -> colorRed
        }
        
        // Draw background ring
        confidenceRingPaint.alpha = 50
        canvas.drawArc(rect, 0f, 360f, false, confidenceRingPaint)
        
        // Draw progress ring
        confidenceRingPaint.alpha = 255
        canvas.drawArc(rect, -90f, score * 360f, false, confidenceRingPaint)
    }

    private fun drawAdjustmentArrows(canvas: Canvas, feedback: Map<PoseLandmarkType, String>) {
        // Draw an arrow pointing somewhere on screen to represent adjustment
        // Just drawing one abstract arrow for demo
        val path = Path()
        path.moveTo(width * 0.2f, height * 0.4f)
        path.lineTo(width * 0.25f, height * 0.35f)
        path.lineTo(width * 0.3f, height * 0.4f)
        
        val arrowPaint = Paint(userSkeletonPaint).apply { 
            strokeWidth = 12f
            style = Paint.Style.STROKE 
        }
        
        canvas.drawPath(path, arrowPaint)
        
        canvas.drawText(feedback.values.firstOrNull() ?: "", width * 0.25f, height * 0.3f, textPaint)
    }
}
