package com.poseguide.ai.domain.repository

import com.poseguide.ai.domain.model.PoseLandmarks
import com.poseguide.ai.domain.model.PoseTemplate
import com.poseguide.ai.domain.model.SceneType

/**
 * PoseRotationManager — the heart of the no-repeat pose system.
 *
 * Rules enforced:
 *  1. Per-session, per-scene: never re-suggest a pose already shown for that scene type.
 *  2. Global consecutive guard: never show the same poseId back-to-back across any scene.
 *  3. Exhausted scene library: shuffle and restart, but skip the last shown pose.
 *  4. Scene-change mid-session: reset per-scene history but keep global consecutive guard.
 */
interface PoseRotationManager {

    /**
     * Returns the next appropriate pose for [sceneType].
     * Uses [currentLandmarks] to optionally bias toward more achievable poses.
     */
    fun getNextPose(sceneType: SceneType, currentLandmarks: PoseLandmarks): PoseTemplate

    /**
     * Called when the user explicitly accepts / acts on a pose suggestion.
     * Persists to local storage for future personalization analytics.
     */
    fun markPoseAccepted(poseId: String, sceneType: SceneType)

    /** Clears all session history — called on app restart or explicit reset. */
    fun resetSession()
}
