package com.poseguide.ai.data.pose

import com.poseguide.ai.domain.model.NormalizedLandmark

class LandmarkSmoother {
    private data class KalmanState(
        var x: Float, var p: Float,
        val q: Float = 0.001f,
        val r: Float = 0.01f
    )

    private val states = Array(33) {
        Triple(KalmanState(0f, 1f), KalmanState(0f, 1f), KalmanState(0f, 1f))
    }

    fun smooth(landmarks: List<NormalizedLandmark>): List<NormalizedLandmark> {
        return landmarks.mapIndexed { i, lm ->
            val (sx, sy, sz) = states[i]
            NormalizedLandmark.create(
                kalman(sx, lm.x),
                kalman(sy, lm.y),
                kalman(sz, lm.z),
                lm.visibility()
            )
        }
    }

    private fun kalman(s: KalmanState, measurement: Float): Float {
        s.p += s.q
        val k = s.p / (s.p + s.r)
        s.x += k * (measurement - s.x)
        s.p *= (1f - k)
        return s.x
    }
}
