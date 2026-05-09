package com.poseguide.ai.data.pose

import com.poseguide.ai.domain.model.NormalizedLandmark
import kotlin.math.abs

object InstructionGenerator {

    fun generate(
        real: List<NormalizedLandmark>,
        ghost: List<NormalizedLandmark>,
        jointConfidence: JointConfidence
    ): String {
        // Find the worst-matching joint
        val worstJoint = jointConfidence.perJoint
            .filter { it.value < 0.75f }
            .minByOrNull { it.value }
            ?.key ?: return "Hold that pose"

        val realPt = real[worstJoint]
        val ghostPt = ghost[worstJoint]

        val dx = ghostPt.x - realPt.x   // positive = move right
        val dy = ghostPt.y - realPt.y   // positive = move down

        val part = landmarkName(worstJoint)
        val dirX = if (dx > 0.03f) "right" else if (dx < -0.03f) "left" else null
        val dirY = if (dy > 0.03f) "down" else if (dy < -0.03f) "up" else null
        val mag = if (abs(dx) + abs(dy) > 0.08f) "more" else "a little"

        return when {
            dirX != null && dirY != null -> "Move $part $dirX and $dirY $mag"
            dirX != null -> "Move $part $dirX $mag"
            dirY != null -> "Move $part $dirY $mag"
            else -> "Almost there — hold still"
        }
    }

    private fun landmarkName(idx: Int) = when (idx) {
        11 -> "left shoulder"
        12 -> "right shoulder"
        13 -> "left elbow"
        14 -> "right elbow"
        15 -> "left hand"
        16 -> "right hand"
        23 -> "left hip"
        24 -> "right hip"
        25 -> "left knee"
        26 -> "right knee"
        27 -> "left foot"
        28 -> "right foot"
        else -> "body"
    }
}
