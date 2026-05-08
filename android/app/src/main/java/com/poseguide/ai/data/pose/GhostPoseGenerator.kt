package com.poseguide.ai.data.pose

import com.poseguide.ai.domain.model.AngleDelta
import com.poseguide.ai.domain.model.BodyProportions
import com.poseguide.ai.domain.model.JointGroup
import com.poseguide.ai.domain.model.NormalizedLandmark
import com.poseguide.ai.domain.model.PoseDelta
import kotlin.math.cos
import kotlin.math.sin

class GhostPoseGenerator {

    fun generateGhostLandmarks(
        currentLandmarks: List<NormalizedLandmark>,
        bodyProportions: BodyProportions,
        poseDelta: PoseDelta
    ): List<NormalizedLandmark> {
        // Clone current landmarks
        val ghostLandmarks = currentLandmarks.toMutableList()

        for ((jointGroup, delta) in poseDelta.jointDeltas) {
            val (parentIdx, childIdx) = jointGroup.toLandmarkIndices()
            if (parentIdx >= ghostLandmarks.size || childIdx >= ghostLandmarks.size) continue

            val parent = ghostLandmarks[parentIdx]
            val previousChild = ghostLandmarks[childIdx]

            val limbLength = bodyProportions.getLimbLength(jointGroup)
            val newChild = rotateAroundParent(
                parent = parent,
                limbLength = limbLength,
                pitchDeg = delta.pitchDeg,
                yawDeg = delta.yawDeg,
                rollDeg = delta.rollDeg
            )
            ghostLandmarks[childIdx] = newChild

            // Propagate downstream joints
            val displacement = newChild.minus(previousChild)
            propagateChildJoints(ghostLandmarks, childIdx, displacement)
        }

        return ghostLandmarks
    }

    private fun rotateAroundParent(
        parent: NormalizedLandmark,
        limbLength: Float,
        pitchDeg: Float,
        yawDeg: Float,
        rollDeg: Float
    ): NormalizedLandmark {
        val pitch = Math.toRadians(pitchDeg.toDouble())
        val yaw = Math.toRadians(yawDeg.toDouble())
        
        // Forward kinematics based on pitch and yaw angles
        val newX = parent.x + (limbLength * cos(pitch) * sin(yaw)).toFloat()
        val newY = parent.y - (limbLength * sin(pitch)).toFloat()
        val newZ = parent.z + (limbLength * cos(pitch) * cos(yaw)).toFloat()
        
        return NormalizedLandmark.create(newX, newY, newZ)
    }

    private fun propagateChildJoints(
        landmarks: MutableList<NormalizedLandmark>,
        movedJointIdx: Int,
        displacement: NormalizedLandmark
    ) {
        val kinematicChain = getKinematicChain(movedJointIdx)
        for (childIdx in kinematicChain) {
            if (childIdx < landmarks.size) {
                landmarks[childIdx] = landmarks[childIdx].plus(displacement)
            }
        }
    }

    private fun getKinematicChain(jointIdx: Int): List<Int> {
        return when (jointIdx) {
            11 -> listOf(13, 15, 17, 19, 21) // left shoulder -> elbow, wrist, hand
            12 -> listOf(14, 16, 18, 20, 22) // right shoulder
            13 -> listOf(15, 17, 19, 21) // left elbow
            14 -> listOf(16, 18, 20, 22) // right elbow
            15 -> listOf(17, 19, 21) // left wrist
            16 -> listOf(18, 20, 22) // right wrist
            23 -> listOf(25, 27, 29, 31) // left hip -> knee, ankle, foot
            24 -> listOf(26, 28, 30, 32) // right hip
            25 -> listOf(27, 29, 31) // left knee
            26 -> listOf(28, 30, 32) // right knee
            27 -> listOf(29, 31) // left ankle
            28 -> listOf(30, 32) // right ankle
            else -> emptyList()
        }
    }
}
