package com.poseguide.ai.data.pose

import com.poseguide.ai.domain.model.PoseDelta

class PoseRotationManager {
    private val history = HashMap<String, LinkedHashSet<String>>()
    private var lastPoseId: String? = null

    fun getNextPose(sceneFingerprint: String, allDeltas: List<PoseDelta>, currentSceneType: String): PoseDelta? {
        val used = history.getOrPut(sceneFingerprint) { LinkedHashSet() }

        var candidates = allDeltas
            .filter { currentSceneType in it.compatibleScenes }
            .filter { it.id != lastPoseId }
            .filter { it.id !in used }

        if (candidates.isEmpty()) {
            used.clear()
            candidates = allDeltas
                .filter { currentSceneType in it.compatibleScenes }
                .filter { it.id != lastPoseId }
        }

        if (candidates.isEmpty()) return null

        val chosen = candidates.random()
        used.add(chosen.id)
        lastPoseId = chosen.id
        return chosen
    }
}
