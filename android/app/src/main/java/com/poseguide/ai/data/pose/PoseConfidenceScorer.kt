package com.poseguide.ai.data.pose

import com.poseguide.ai.domain.model.NormalizedLandmark
import kotlin.math.hypot

data class JointConfidence(
    val overall: Float,
    val perJoint: Map<Int, Float>  // landmark index → 0.0–1.0
)

class PoseConfidenceScorer {

    fun computeConfidence(
        realLandmarks: List<NormalizedLandmark>,
        ghostLandmarks: List<NormalizedLandmark>
    ): JointConfidence {
        if (realLandmarks.size < 33 || ghostLandmarks.size < 33) {
            return JointConfidence(0f, emptyMap())
        }

        val keyJoints = listOf(11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28) // 12 key joints
        val perJoint = keyJoints.associateWith { idx ->
            val dist = euclideanDist(realLandmarks[idx], ghostLandmarks[idx])
            // dist in normalized coords: 0.0 = perfect, 0.12 = 12% of frame = poor match
            (1f - (dist / 0.12f)).coerceIn(0f, 1f)
        }
        
        return JointConfidence(
            overall = if (perJoint.isEmpty()) 0f else perJoint.values.average().toFloat(),
            perJoint = perJoint
        )
    }

    private fun euclideanDist(p1: NormalizedLandmark, p2: NormalizedLandmark): Float {
        // Z is optional but gives depth matching, ignoring Z for simple normalized match
        return hypot((p1.x - p2.x).toDouble(), (p1.y - p2.y).toDouble()).toFloat()
    }
}
