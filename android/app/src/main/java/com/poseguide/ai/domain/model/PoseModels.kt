package com.poseguide.ai.domain.model

// ─── Pose Landmark Wrapper ─────────────────────────────────────────────────────

/**
 * Normalized landmark position (0..1 range, relative to image dimensions).
 */
data class LandmarkPoint(
    val x: Float,
    val y: Float,
    val z: Float,
    val inFrameLikelihood: Float
)

/**
 * Subset of ML Kit's 33-landmark pose, keyed by [PoseLandmarkType].
 */
data class PoseLandmarks(
    val landmarks: Map<PoseLandmarkType, LandmarkPoint> = emptyMap()
) {
    fun get(type: PoseLandmarkType): LandmarkPoint? = landmarks[type]
}

enum class PoseLandmarkType {
    NOSE, LEFT_EYE, RIGHT_EYE,
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_ELBOW, RIGHT_ELBOW,
    LEFT_WRIST, RIGHT_WRIST,
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ANKLE, RIGHT_ANKLE,
    LEFT_HEEL, RIGHT_HEEL,
    LEFT_FOOT_INDEX, RIGHT_FOOT_INDEX
}

// ─── Pose Template ─────────────────────────────────────────────────────────────

enum class VisualCategory {
    STANDING_CASUAL,
    STANDING_DYNAMIC,
    SITTING,
    LEANING,
    WALKING_PAUSE,
    ARMS_EXPRESSIVE,
    PROFILE
}

data class LandmarkTarget(
    val landmarkType: PoseLandmarkType,
    val targetAngleDeg: Float?,        // null means position-based, not angle-based
    val toleranceDeg: Float = 15f,
    val description: String = ""
)

data class PoseTemplate(
    val id: String,
    val name: String,
    val compatibleScenes: List<SceneType>,
    val bodyParts: List<PoseLandmarkType>,
    val overlayHints: List<String>,      // Short instruction strings
    val landmarkTargets: List<LandmarkTarget>,
    val visualCategory: VisualCategory,
    val thumbnailResId: Int = 0          // drawable resource (optional)
)

// ─── Match Confidence ──────────────────────────────────────────────────────────

/**
 * Result of matching the user's current body position against a [PoseTemplate].
 * [score] is in 0..1. [partialFeedback] maps landmark → instruction hint.
 */
data class PoseMatchResult(
    val poseId: String,
    val score: Float,
    val partialFeedback: Map<PoseLandmarkType, String> = emptyMap(),
    val isReadyToShoot: Boolean = score >= READY_THRESHOLD
) {
    companion object {
        const val READY_THRESHOLD = 0.80f
    }
}
