package com.poseguide.ai.data.pose

import com.poseguide.ai.domain.model.BodyProportions
import com.poseguide.ai.domain.model.PoseLandmarkType
import com.poseguide.ai.domain.model.PoseLandmarks
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.hypot

@Singleton
class BodyProportionAnalyzer @Inject constructor() {

    private val samples = mutableListOf<BodyProportions>()
    private val REQUIRED_SAMPLES = 15

    fun isCalibrated() = samples.size >= REQUIRED_SAMPLES

    fun getCalibratedProportions(): BodyProportions? {
        if (!isCalibrated()) return null

        // Average the samples
        val avgShoulder = samples.map { it.shoulderWidthRatio }.average().toFloat()
        val avgTorso = samples.map { it.torsoLengthRatio }.average().toFloat()
        val avgLeg = samples.map { it.legLengthRatio }.average().toFloat()

        return BodyProportions(avgShoulder, avgTorso, avgLeg)
    }

    fun addSample(landmarks: PoseLandmarks, imageWidth: Int, imageHeight: Int) {
        if (isCalibrated() || imageWidth == 0 || imageHeight == 0) return

        val lShoulder = landmarks.get(PoseLandmarkType.LEFT_SHOULDER)
        val rShoulder = landmarks.get(PoseLandmarkType.RIGHT_SHOULDER)
        val lHip = landmarks.get(PoseLandmarkType.LEFT_HIP)
        val lAnkle = landmarks.get(PoseLandmarkType.LEFT_ANKLE)

        if (lShoulder != null && rShoulder != null && lHip != null) {
            val shoulderDist = hypot(lShoulder.x - rShoulder.x, lShoulder.y - rShoulder.y)
            val torsoDist = hypot(lShoulder.x - lHip.x, lShoulder.y - lHip.y)
            
            var legDist = 0f
            if (lAnkle != null) {
                legDist = hypot(lHip.x - lAnkle.x, lHip.y - lAnkle.y)
            }

            samples.add(
                BodyProportions(
                    shoulderWidthRatio = shoulderDist / imageWidth,
                    torsoLengthRatio = torsoDist / imageHeight,
                    legLengthRatio = legDist / imageHeight
                )
            )
        }
    }
    
    fun reset() {
        samples.clear()
    }
}
