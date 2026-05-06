package com.poseguide.ai.data.pose

import com.poseguide.ai.domain.model.LandmarkPoint
import com.poseguide.ai.domain.model.PoseLandmarkType
import com.poseguide.ai.domain.model.PoseLandmarks
import com.poseguide.ai.domain.model.PoseMatchResult
import com.poseguide.ai.domain.model.PoseTemplate
import kotlin.math.*

/**
 * PoseMatcher — computes how closely the user's current body aligns
 * with a given [PoseTemplate], returning a [PoseMatchResult] with a
 * 0–1 confidence score and per-landmark feedback.
 */
object PoseMatcher {

    /**
     * Computes the match score for [template] against the [userLandmarks].
     */
    fun computeMatch(
        template: PoseTemplate,
        userLandmarks: PoseLandmarks
    ): PoseMatchResult {
        if (template.landmarkTargets.isEmpty() || userLandmarks.landmarks.isEmpty()) {
            return PoseMatchResult(poseId = template.id, score = 0f)
        }

        val feedback = mutableMapOf<PoseLandmarkType, String>()
        var totalScore = 0f
        var scorableTargets = 0

        for (target in template.landmarkTargets) {
            val landmark = userLandmarks.get(target.landmarkType) ?: continue
            if (landmark.inFrameLikelihood < 0.5f) continue

            scorableTargets++
            if (target.targetAngleDeg != null) {
                // Angle-based scoring: compute joint angle and compare
                val angle = estimateJointAngle(target.landmarkType, userLandmarks)
                if (angle != null) {
                    val diff = abs(angle - target.targetAngleDeg)
                    val normalized = (1f - (diff / (target.toleranceDeg * 3f))).coerceIn(0f, 1f)
                    totalScore += normalized
                    if (normalized < 0.7f) {
                        feedback[target.landmarkType] = buildAngleFeedback(
                            target.description,
                            angle,
                            target.targetAngleDeg,
                            diff
                        )
                    }
                }
            } else {
                // Position-based: use visibility as proxy confidence
                totalScore += landmark.inFrameLikelihood
            }
        }

        val score = if (scorableTargets > 0) totalScore / scorableTargets else 0f
        return PoseMatchResult(
            poseId = template.id,
            score = score.coerceIn(0f, 1f),
            partialFeedback = feedback,
            isReadyToShoot = score >= PoseMatchResult.READY_THRESHOLD
        )
    }

    /**
     * Estimates the interior angle at [jointType] using its neighbours.
     */
    private fun estimateJointAngle(
        jointType: PoseLandmarkType,
        landmarks: PoseLandmarks
    ): Float? {
        val (parent, child) = neighboursOf(jointType) ?: return null
        val a = landmarks.get(parent) ?: return null
        val b = landmarks.get(jointType) ?: return null
        val c = landmarks.get(child) ?: return null
        return angleBetween(a, b, c)
    }

    private fun angleBetween(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): Float {
        val v1x = a.x - b.x; val v1y = a.y - b.y
        val v2x = c.x - b.x; val v2y = c.y - b.y
        val dot = v1x * v2x + v1y * v2y
        val mag1 = sqrt(v1x * v1x + v1y * v1y)
        val mag2 = sqrt(v2x * v2x + v2y * v2y)
        return if (mag1 == 0f || mag2 == 0f) 0f
        else Math.toDegrees(acos((dot / (mag1 * mag2)).coerceIn(-1f, 1f).toDouble())).toFloat()
    }

    private fun neighboursOf(joint: PoseLandmarkType): Pair<PoseLandmarkType, PoseLandmarkType>? =
        when (joint) {
            PoseLandmarkType.LEFT_ELBOW  -> PoseLandmarkType.LEFT_SHOULDER to PoseLandmarkType.LEFT_WRIST
            PoseLandmarkType.RIGHT_ELBOW -> PoseLandmarkType.RIGHT_SHOULDER to PoseLandmarkType.RIGHT_WRIST
            PoseLandmarkType.LEFT_KNEE   -> PoseLandmarkType.LEFT_HIP to PoseLandmarkType.LEFT_ANKLE
            PoseLandmarkType.RIGHT_KNEE  -> PoseLandmarkType.RIGHT_HIP to PoseLandmarkType.RIGHT_ANKLE
            PoseLandmarkType.LEFT_SHOULDER -> PoseLandmarkType.LEFT_HIP to PoseLandmarkType.LEFT_ELBOW
            PoseLandmarkType.RIGHT_SHOULDER -> PoseLandmarkType.RIGHT_HIP to PoseLandmarkType.RIGHT_ELBOW
            PoseLandmarkType.LEFT_HIP   -> PoseLandmarkType.LEFT_SHOULDER to PoseLandmarkType.LEFT_KNEE
            PoseLandmarkType.RIGHT_HIP  -> PoseLandmarkType.RIGHT_SHOULDER to PoseLandmarkType.RIGHT_KNEE
            else -> null
        }

    private fun buildAngleFeedback(
        description: String,
        actual: Float,
        target: Float,
        diff: Float
    ): String {
        val direction = if (actual > target) "decrease" else "increase"
        val amountLabel = when {
            diff < 15 -> "slightly"
            diff < 30 -> "a bit more"
            else      -> "significantly"
        }
        return "$description — $direction $amountLabel"
    }
}
