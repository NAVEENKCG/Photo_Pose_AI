package com.poseguide.ai.data.pose

import com.google.common.truth.Truth.assertThat
import com.poseguide.ai.domain.model.*
import org.junit.Before
import org.junit.Test

class PoseRotationManagerTest {

    private lateinit var manager: PoseRotationManagerImpl

    // Test Fixture: 10 poses
    private val rankedPoses = (1..10).map { i ->
        PoseTemplate(
            id = "pose_$i",
            name = "Pose $i",
            compatibleEnvironments = listOf(SceneEnvironment.BEACH),
            compatibleLighting = listOf(LightingContext.GOLDEN_HOUR),
            bodyCategory = BodyCategory.STANDING_RELAXED,
            overlayInstructions = listOf("Hint 1", "Hint 2"),
            landmarkAngles = emptyMap(),
            landmarkTargets = emptyList(),
            visualVariety = listOf(VisualVariety.FACING_CAMERA)
        )
    }

    private val beachScene = SceneContext(
        environment = SceneEnvironment.BEACH,
        lighting = LightingContext.GOLDEN_HOUR
    )

    private val cafeScene = SceneContext(
        environment = SceneEnvironment.CAFE,
        lighting = LightingContext.INDOOR_WARM
    )

    @Before
    fun setUp() {
        manager = PoseRotationManagerImpl()
    }

    @Test
    fun `consecutive pose is never repeated`() {
        val pose1 = manager.getNextPose(beachScene, rankedPoses)
        val pose2 = manager.getNextPose(beachScene, rankedPoses)
        assertThat(pose1.id).isNotEqualTo(pose2.id)
    }

    @Test
    fun `all poses shown before repeating`() {
        val seen = mutableSetOf<String>()
        repeat(rankedPoses.size) {
            val pose = manager.getNextPose(beachScene, rankedPoses)
            assertThat(seen).doesNotContain(pose.id)
            seen.add(pose.id)
        }
        
        // After exhaustion, restart — should still not repeat consecutively
        val afterExhaustion = manager.getNextPose(beachScene, rankedPoses)
        val lastSeen = seen.last()
        assertThat(afterExhaustion.id).isNotEqualTo(lastSeen)
    }

    @Test
    fun `fingerprint change resets history`() {
        val pose1 = manager.getNextPose(beachScene, rankedPoses)
        val pose2 = manager.getNextPose(beachScene, rankedPoses)

        // Switch to cafe
        val cafePose = manager.getNextPose(cafeScene, rankedPoses)

        // Switch back to beach — history should be fresh, so it should start over from the best ranked
        // But it still shouldn't match the globally last shown pose (cafePose)
        val beachAfterSwitch = manager.getNextPose(beachScene, rankedPoses)

        assertThat(beachAfterSwitch.id).isNotEqualTo(cafePose.id)
    }

    @Test
    fun `200 simulated calls never produce consecutive duplicates`() {
        val results = mutableListOf<String>()
        repeat(200) {
            val next = manager.getNextPose(beachScene, rankedPoses)
            if (results.isNotEmpty()) {
                assertThat(next.id).isNotEqualTo(results.last())
            }
            results.add(next.id)
        }
    }

    @Test
    fun `resetSession clears all state`() {
        repeat(rankedPoses.size) {
            manager.getNextPose(beachScene, rankedPoses)
        }
        manager.resetSession()

        // After reset, the very first ranked pose should be available again
        val firstAfterReset = manager.getNextPose(beachScene, rankedPoses)
        assertThat(firstAfterReset.id).isEqualTo(rankedPoses[0].id)
    }
}
