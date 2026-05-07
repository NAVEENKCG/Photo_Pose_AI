package com.poseguide.ai.domain.model

// ─── Pose Landmark Wrapper ─────────────────────────────────────────────────────

/**
 * Normalized landmark position (pixel-space from ML Kit's InputImage dimensions).
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

// ─── Body Category ─────────────────────────────────────────────────────────────

enum class BodyCategory {
    STANDING_RELAXED,
    STANDING_DYNAMIC,
    SEATED,
    LEANING,
    WALKING_PAUSED,
    ARMS_EXPRESSIVE,
    PROFILE_TURN,
    CANDID,
    CROUCHED,
    OVERHEAD_REACH
}

// ─── Visual Variety Tags ───────────────────────────────────────────────────────

enum class VisualVariety {
    SYMMETRICAL,
    ASYMMETRICAL,
    OPEN_STANCE,
    CLOSED_STANCE,
    FACING_CAMERA,
    THREE_QUARTER,
    PROFILE
}

// ─── Landmark Target ───────────────────────────────────────────────────────────

data class LandmarkTarget(
    val landmarkType: PoseLandmarkType,
    val targetAngleDeg: Float?,        // null means position-based, not angle-based
    val toleranceDeg: Float = 15f,
    val description: String = ""
)

// ─── Pose Template ─────────────────────────────────────────────────────────────

/**
 * A single pose entry from poses_library.json.
 *
 * Rule: no two poses in the library may share the same combination of
 * (bodyCategory + visualVariety[0]). This guarantees structural diversity.
 */
data class PoseTemplate(
    val id: String,
    val name: String,
    val compatibleEnvironments: List<SceneEnvironment>,
    val compatibleLighting: List<LightingContext>,
    val bodyCategory: BodyCategory,
    val overlayInstructions: List<String>,       // exactly 2 short strings (max 6 words each)
    val landmarkAngles: Map<String, Float>,       // bodyPart → target angle (degrees)
    val landmarkTargets: List<LandmarkTarget>,
    val visualVariety: List<VisualVariety>,
    val thumbnailResId: Int = 0
)

// ─── Body Proportions ──────────────────────────────────────────────────────────

/**
 * Measured from 15 frames at session start using MediaPipe Holistic.
 * Used to scale pose template landmarks to the actual user's body shape.
 */
data class BodyProportions(
    val shoulderWidthRatio: Float = 0f,   // shoulder landmarks / frame width
    val torsoLengthRatio: Float = 0f,     // shoulder-to-hip distance / frame height
    val legLengthRatio: Float = 0f        // hip-to-ankle / frame height
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
