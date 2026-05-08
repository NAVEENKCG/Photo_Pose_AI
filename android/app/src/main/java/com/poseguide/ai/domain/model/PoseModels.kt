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
) {
    fun toNormalizedLandmark() = NormalizedLandmark(x, y, z)
}

data class NormalizedLandmark(val x: Float, val y: Float, val z: Float) {
    fun minus(other: NormalizedLandmark) = NormalizedLandmark(x - other.x, y - other.y, z - other.z)
    fun plus(other: NormalizedLandmark) = NormalizedLandmark(x + other.x, y + other.y, z + other.z)
    fun toCanvas(fw: Int, fh: Int) = android.graphics.PointF(x * fw, y * fh)
    
    companion object {
        fun create(x: Float, y: Float, z: Float) = NormalizedLandmark(x, y, z)
    }
}

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

// ─── Pose Delta System ─────────────────────────────────────────────────────────

data class PoseDelta(
    val id: String,
    val name: String,
    val compatibleScenes: List<String>,
    val bodyCategory: BodyCategory,
    val jointDeltas: Map<JointGroup, AngleDelta>,
    val instructionLines: List<String>
)

data class AngleDelta(
    val pitchDeg: Float,    // forward/back rotation
    val yawDeg: Float,      // left/right rotation
    val rollDeg: Float,     // tilt
    val extendRatio: Float  // 0.0=fully bent, 1.0=fully extended
)

enum class JointGroup {
    RIGHT_ARM, LEFT_ARM,
    RIGHT_ELBOW, LEFT_ELBOW,
    RIGHT_WRIST, LEFT_WRIST,
    RIGHT_KNEE, LEFT_KNEE,
    RIGHT_ANKLE, LEFT_ANKLE,
    TORSO, HEAD, HIPS;

    fun toLandmarkIndices(): Pair<Int, Int> {
        return when (this) {
            RIGHT_ARM -> Pair(12, 14) // right shoulder -> right elbow
            LEFT_ARM -> Pair(11, 13)  // left shoulder -> left elbow
            RIGHT_ELBOW -> Pair(14, 16) // right elbow -> right wrist
            LEFT_ELBOW -> Pair(13, 15)  // left elbow -> left wrist
            RIGHT_KNEE -> Pair(24, 26) // right hip -> right knee
            LEFT_KNEE -> Pair(23, 25)  // left hip -> left knee
            RIGHT_ANKLE -> Pair(26, 28) // right knee -> right ankle
            LEFT_ANKLE -> Pair(25, 27)  // left knee -> left ankle
            TORSO -> Pair(11, 23) // mid-shoulder -> mid-hip (simplified for indices)
            HEAD -> Pair(11, 0) // mid-shoulder -> nose
            HIPS -> Pair(23, 24)
            else -> Pair(0, 0)
        }
    }
}

// ─── Body Proportions ──────────────────────────────────────────────────────────

data class BodyProportions(
    val shoulderWidthNorm: Float,
    val torsoLengthNorm: Float,
    val leftArmLengthNorm: Float,
    val rightArmLengthNorm: Float,
    val leftLegLengthNorm: Float,
    val rightLegLengthNorm: Float,
    val headSizeNorm: Float,
    val frameWidth: Int,
    val frameHeight: Int
) {
    fun getLimbLength(jointGroup: JointGroup): Float {
        return when (jointGroup) {
            JointGroup.RIGHT_ARM -> rightArmLengthNorm * 0.5f
            JointGroup.LEFT_ARM -> leftArmLengthNorm * 0.5f
            JointGroup.RIGHT_ELBOW -> rightArmLengthNorm * 0.5f
            JointGroup.LEFT_ELBOW -> leftArmLengthNorm * 0.5f
            JointGroup.RIGHT_KNEE -> rightLegLengthNorm * 0.5f
            JointGroup.LEFT_KNEE -> leftLegLengthNorm * 0.5f
            JointGroup.RIGHT_ANKLE -> rightLegLengthNorm * 0.5f
            JointGroup.LEFT_ANKLE -> leftLegLengthNorm * 0.5f
            JointGroup.TORSO -> torsoLengthNorm
            JointGroup.HEAD -> headSizeNorm
            else -> 0.1f
        }
    }
}

// ─── Match Confidence ──────────────────────────────────────────────────────────

data class PoseMatchResult(
    val poseId: String,
    val score: Float,
    val isReadyToShoot: Boolean = score >= READY_THRESHOLD
) {
    companion object {
        const val READY_THRESHOLD = 0.80f
    }
}
