package com.poseguide.ai.data.pose

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.poseguide.ai.domain.model.*
import com.poseguide.ai.domain.repository.PoseHistoryRepository
import com.poseguide.ai.domain.repository.PoseRotationManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Production implementation of [PoseRotationManager].
 *
 * No-repeat rules enforced:
 *  1. Per-scene history: tracks every poseId shown per SceneType in this session.
 *  2. Consecutive guard: last globally-shown poseId is never shown again immediately.
 *  3. Exhaustion restart: when all scene poses shown, shuffle anew but skip the last pose.
 *  4. Scene change: per-scene history resets; global consecutive guard persists.
 */
@Singleton
class PoseRotationManagerImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val poseHistoryRepository: PoseHistoryRepository
) : PoseRotationManager {

    companion object {
        private const val TAG = "PoseRotationManager"
    }

    // All loaded poses from the JSON asset
    private val allPoses: List<PoseTemplate> by lazy { loadPosesFromAsset() }

    // Session state — protected by method synchronization
    private val shownPerScene: MutableMap<SceneType, MutableList<String>> = mutableMapOf()
    private var lastShownPoseId: String? = null
    private var lastSceneType: SceneType? = null

    // Scope for fire-and-forget coroutine saves
    private val ioScope = CoroutineScope(Dispatchers.IO)

    // ─── Public API ────────────────────────────────────────────────────────────

    @Synchronized
    override fun getNextPose(sceneType: SceneType, currentLandmarks: PoseLandmarks): PoseTemplate {
        // Rule 4: scene changed → reset per-scene history, keep global guard
        if (sceneType != lastSceneType) {
            Log.d(TAG, "Scene changed $lastSceneType → $sceneType. Resetting per-scene history.")
            shownPerScene.remove(sceneType)
            lastSceneType = sceneType
        }

        val candidates = allPoses.filter { sceneType in it.compatibleScenes }
        if (candidates.isEmpty()) {
            Log.w(TAG, "No poses for $sceneType. Falling back to GENERIC.")
            return getFallbackPose()
        }

        val usedForScene = shownPerScene.getOrPut(sceneType) { mutableListOf() }

        // Determine available (not yet shown in this scene session)
        val available = candidates
            .filter { it.id !in usedForScene }
            .filter { it.id != lastShownPoseId } // Rule 2: consecutive guard

        return if (available.isNotEmpty()) {
            selectBestPose(available, currentLandmarks).also { chosen ->
                recordShown(chosen, sceneType, usedForScene)
            }
        } else {
            // Rule 3: exhausted — shuffle and restart, skip lastShownPoseId
            Log.d(TAG, "All poses exhausted for $sceneType. Restarting with shuffle.")
            shownPerScene[sceneType] = mutableListOf() // reset per-scene
            val restarted = candidates
                .shuffled()
                .filter { it.id != lastShownPoseId }
            val chosen = restarted.firstOrNull() ?: candidates.first()
            val fresh = shownPerScene.getOrPut(sceneType) { mutableListOf() }
            recordShown(chosen, sceneType, fresh)
            chosen
        }
    }

    @Synchronized
    override fun markPoseAccepted(poseId: String, sceneType: SceneType) {
        Log.d(TAG, "Pose accepted: $poseId for $sceneType")
        ioScope.launch {
            poseHistoryRepository.savePoseUsage(poseId, sceneType, wasAccepted = true)
        }
    }

    @Synchronized
    override fun resetSession() {
        shownPerScene.clear()
        lastShownPoseId = null
        lastSceneType = null
        Log.d(TAG, "Session reset.")
    }

    // ─── Private Helpers ───────────────────────────────────────────────────────

    private fun recordShown(pose: PoseTemplate, sceneType: SceneType, usedList: MutableList<String>) {
        usedList.add(pose.id)
        lastShownPoseId = pose.id
        Log.d(TAG, "Selected pose '${pose.name}' (${pose.id}) for $sceneType. Total shown: ${usedList.size}")
        ioScope.launch {
            poseHistoryRepository.savePoseUsage(pose.id, sceneType, wasAccepted = false)
        }
    }

    /**
     * Selects the most achievable pose given the user's current landmarks.
     * Falls back to random if landmarks are sparse.
     */
    private fun selectBestPose(candidates: List<PoseTemplate>, landmarks: PoseLandmarks): PoseTemplate {
        if (landmarks.landmarks.isEmpty()) return candidates.random()

        // Score each candidate by how many of its bodyParts are detectable
        return candidates.maxByOrNull { template ->
            template.bodyParts.count { landmarks.get(it) != null }
        } ?: candidates.random()
    }

    private fun getFallbackPose(): PoseTemplate {
        val generic = allPoses.filter { SceneType.GENERIC in it.compatibleScenes }
        return generic.firstOrNull { it.id != lastShownPoseId }
            ?: generic.firstOrNull()
            ?: allPoses.first()
    }

    // ─── Asset Loading ─────────────────────────────────────────────────────────

    private fun loadPosesFromAsset(): List<PoseTemplate> {
        return try {
            val json = context.assets.open("poses_templates.json").bufferedReader().readText()
            val wrapper = Gson().fromJson(json, PoseLibraryWrapper::class.java)
            wrapper.poses.map { it.toDomainModel() }.also {
                Log.d(TAG, "Loaded ${it.size} poses from asset.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load poses from asset", e)
            emptyList()
        }
    }
}

// ─── JSON Data Transfer Objects ────────────────────────────────────────────────

private data class PoseLibraryWrapper(val version: String, val poses: List<PoseTemplateDto>)

private data class PoseTemplateDto(
    val id: String,
    val name: String,
    val compatibleScenes: List<String>,
    val bodyParts: List<String>,
    val overlayHints: List<String>,
    val landmarkTargets: List<LandmarkTargetDto>,
    val visualCategory: String
) {
    fun toDomainModel(): PoseTemplate = PoseTemplate(
        id = id,
        name = name,
        compatibleScenes = compatibleScenes.mapNotNull { runCatching { SceneType.valueOf(it) }.getOrNull() },
        bodyParts = bodyParts.mapNotNull { runCatching { PoseLandmarkType.valueOf(it) }.getOrNull() },
        overlayHints = overlayHints,
        landmarkTargets = landmarkTargets.map { it.toDomainModel() },
        visualCategory = runCatching { VisualCategory.valueOf(visualCategory) }.getOrDefault(VisualCategory.STANDING_CASUAL)
    )
}

private data class LandmarkTargetDto(
    val landmarkType: String,
    val targetAngleDeg: Float?,
    val toleranceDeg: Float = 15f,
    val description: String = ""
) {
    fun toDomainModel(): LandmarkTarget = LandmarkTarget(
        landmarkType = runCatching { PoseLandmarkType.valueOf(landmarkType) }.getOrDefault(PoseLandmarkType.NOSE),
        targetAngleDeg = targetAngleDeg,
        toleranceDeg = toleranceDeg,
        description = description
    )
}
