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

    @Synchronized
    override fun getNextPose(scene: SceneContext, rankedPoses: List<PoseTemplate>): PoseTemplate {
        if (rankedPoses.isEmpty()) {
            throw IllegalArgumentException("Ranked poses list cannot be empty")
        }

        val fp = scene.fingerprint
        val used = sessionHistory.getOrPut(fp) { LinkedHashSet() }

        var candidates = rankedPoses
            .filter { it.id != globalLastShown }
            .filter { it.id !in used }

        if (candidates.isEmpty()) {
            used.clear()
            candidates = rankedPoses.filter { it.id != globalLastShown }
        }

        // If still empty (e.g., only 1 pose in the library), fallback to the first ranked pose
        val chosen = candidates.firstOrNull() ?: rankedPoses.first()
        
        used.add(chosen.id)
        globalLastShown = chosen.id
        return chosen
    }

    @Synchronized
    override fun resetSession() {
        sessionHistory.clear()
        globalLastShown = null
    }
}
