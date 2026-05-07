package com.poseguide.ai.domain.repository

import com.poseguide.ai.domain.model.PoseTemplate
import com.poseguide.ai.domain.model.SceneContext

/**
 * PoseRotationManager v2 — fingerprint-keyed no-repeat pose system.
 *
 * Rules enforced:
 *  1. Per fingerprint: tracks every poseId shown per SceneContext fingerprint.
 *  2. Global consecutive guard: the last globally-shown poseId is never shown again immediately.
 *  3. Exhaustion restart: when all candidates are shown, clear history but skip the last pose.
 *  4. Trigger conditions: fingerprint change, user swipe, or auto-skip at <40% confidence for 10s.
 */
interface PoseRotationManager {

    /**
     * Returns the next best pose given the [scene] context and a pre-ranked list
     * of [rankedPoses] from the affinity matrix.
     *
     * The ranking order is preserved — the first non-filtered candidate is returned.
     */
    fun getNextPose(scene: SceneContext, rankedPoses: List<PoseTemplate>): PoseTemplate

    /** Clears all per-fingerprint history and resets the global consecutive guard. */
    fun resetSession()
}
