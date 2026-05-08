package com.poseguide.ai.data.pose

import com.poseguide.ai.domain.model.BodyProportions
import com.poseguide.ai.domain.model.NormalizedLandmark
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.hypot

@Singleton
class BodyProportionCapture @Inject constructor() {

    private val samples = mutableListOf<BodyProportions>()
    private val REQUIRED_SAMPLES = 20

    fun isCalibrated() = samples.size >= REQUIRED_SAMPLES

    fun getCalibratedProportions(): BodyProportions? {
        if (!isCalibrated()) return null

        val avgShoulder = samples.map { it.shoulderWidthNorm }.average().toFloat()
        val avgTorso = samples.map { it.torsoLengthNorm }.average().toFloat()
        val avgLeftArm = samples.map { it.leftArmLengthNorm }.average().toFloat()
        val avgRightArm = samples.map { it.rightArmLengthNorm }.average().toFloat()
        val avgLeftLeg = samples.map { it.leftLegLengthNorm }.average().toFloat()
        val avgRightLeg = samples.map { it.rightLegLengthNorm }.average().toFloat()
        val avgHead = samples.map { it.headSizeNorm }.average().toFloat()

        val fWidth = samples.first().frameWidth
        val fHeight = samples.first().frameHeight

        return BodyProportions(
            avgShoulder, avgTorso, avgLeftArm, avgRightArm,
            avgLeftLeg, avgRightLeg, avgHead, fWidth, fHeight
        )
    }

    fun addSample(landmarks: List<NormalizedLandmark>, frameWidth: Int, frameHeight: Int) {
        if (isCalibrated() || frameWidth == 0 || frameHeight == 0 || landmarks.size < 33) return

        val shoulderWidth = dist(landmarks[11], landmarks[12])
        val torsoLength = dist(midpoint(landmarks[11], landmarks[12]), midpoint(landmarks[23], landmarks[24]))
        
        val leftArm = dist(landmarks[11], landmarks[13]) + dist(landmarks[13], landmarks[15])
        val rightArm = dist(landmarks[12], landmarks[14]) + dist(landmarks[14], landmarks[16])
        
        val leftLeg = dist(landmarks[23], landmarks[25]) + dist(landmarks[25], landmarks[27])
        val rightLeg = dist(landmarks[24], landmarks[26]) + dist(landmarks[26], landmarks[28])
        
        val headSize = dist(landmarks[0], midpoint(landmarks[11], landmarks[12]))

        samples.add(
            BodyProportions(
                shoulderWidth, torsoLength, leftArm, rightArm,
                leftLeg, rightLeg, headSize, frameWidth, frameHeight
            )
        )
    }
    
    fun reset() {
        samples.clear()
    }

    private fun dist(p1: NormalizedLandmark, p2: NormalizedLandmark): Float {
        return hypot((p1.x - p2.x).toDouble(), (p1.y - p2.y).toDouble()).toFloat()
    }

    private fun midpoint(p1: NormalizedLandmark, p2: NormalizedLandmark): NormalizedLandmark {
        return NormalizedLandmark((p1.x + p2.x) / 2f, (p1.y + p2.y) / 2f, (p1.z + p2.z) / 2f)
    }
}
