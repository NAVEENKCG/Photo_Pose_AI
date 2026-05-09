package com.poseguide.ai.data.pose

import com.poseguide.ai.domain.model.PoseTemplate
import com.poseguide.ai.domain.model.SceneContext
import com.poseguide.ai.domain.repository.PoseRotationManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PoseRotationManagerImpl @Inject constructor() : PoseRotationManager {

    private val sessionHistory = HashMap<String, LinkedHashSet<String>>()
    private var globalLastShown: String? = null
    private var captureCount: Int = 0 // load from DataStore on init

    fun incrementCaptureCount() {
        captureCount++
    }

    @Synchronized
    override fun getNextPose(scene: SceneContext, rankedPoses: List<PoseTemplate>): PoseTemplate {
        if (rankedPoses.isEmpty()) {
            throw IllegalArgumentException("Ranked poses list cannot be empty")
        }

        val maxDifficulty = when {
            captureCount >= 6 -> "hard"
            captureCount >= 3 -> "medium"
            else              -> "easy"
        }
        val allowed = setOf("easy").plus(
            if (captureCount >= 3) setOf("medium") else emptySet()
        ).plus(
            if (captureCount >= 6) setOf("hard") else emptySet()
        )

        val fp = scene.fingerprint
        val used = sessionHistory.getOrPut(fp) { LinkedHashSet() }

        var candidates = rankedPoses
            // .filter { it.difficulty in allowed } // Assuming difficulty exists
            // .filter { scene.environment.name in it.compatibleScenes } // Assuming compatibleScenes exists
            .filter { it.id != globalLastShown }
            .filter { it.id !in used }

        if (candidates.isEmpty()) {
            used.clear()
            candidates = rankedPoses.filter { it.id != globalLastShown }
        }

        val chosen = candidates.firstOrNull() ?: rankedPoses.first()
        
        used.add(chosen.id)
        globalLastShown = chosen.id
        return chosen
    }

    @Synchronized
    override fun resetSession() {
        sessionHistory.clear()
        globalLastShown = null
        captureCount = 0
    }
}
