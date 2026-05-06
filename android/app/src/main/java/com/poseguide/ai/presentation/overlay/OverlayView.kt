package com.poseguide.ai.presentation.overlay

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.View
import com.poseguide.ai.domain.model.PoseLandmarks
import com.poseguide.ai.domain.model.PoseMatchResult
import com.poseguide.ai.domain.model.PoseTemplate

/**
 * OverlayView — a transparent [View] drawn on top of the CameraX preview.
 * Delegates all rendering to [OverlayRenderer].
 */
class OverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    private val renderer = OverlayRenderer()

    private var landmarks: PoseLandmarks? = null
    private var template: PoseTemplate? = null
    private var matchResult: PoseMatchResult? = null

    fun update(
        landmarks: PoseLandmarks?,
        template: PoseTemplate?,
        matchResult: PoseMatchResult?
    ) {
        this.landmarks = landmarks
        this.template = template
        this.matchResult = matchResult
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        renderer.draw(
            canvas = canvas,
            viewWidth = width,
            viewHeight = height,
            userLandmarks = landmarks,
            template = template,
            matchResult = matchResult
        )
    }
}
