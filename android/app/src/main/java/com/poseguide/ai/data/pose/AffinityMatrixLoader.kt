package com.poseguide.ai.data.pose

import android.content.Context
import com.google.gson.Gson
import com.poseguide.ai.domain.model.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton
import java.io.InputStreamReader

@Singleton
class AffinityMatrixLoader @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson
) {
    private var posesLibrary: Map<String, PoseTemplate> = emptyMap()
    private var affinityMatrix: AffinityMatrix? = null

    suspend fun loadData() = withContext(Dispatchers.IO) {
        if (posesLibrary.isNotEmpty()) return@withContext

        try {
            // Load poses
            context.assets.open("poses_library.json").use { stream ->
                val libraryDto = gson.fromJson(InputStreamReader(stream), PosesLibraryDto::class.java)
                posesLibrary = libraryDto.poses.associateBy { it.id }
            }

            // Load affinity matrix
            context.assets.open("postures_affinity_matrix.json").use { stream ->
                affinityMatrix = gson.fromJson(InputStreamReader(stream), AffinityMatrix::class.java)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Returns a ranked list of [PoseTemplate]s for a given SceneContext.
     */
    fun getRankedPoses(scene: SceneContext): List<PoseTemplate> {
        val defaultList = posesLibrary.values.toList()
        if (affinityMatrix == null) return defaultList

        // Look up by environment first
        val sceneAffinity = affinityMatrix!!.environmentRankings[scene.environment.name]
            ?: return defaultList

        // Combine with lighting if available
        val lightAffinity = affinityMatrix!!.lightingRankings[scene.lighting.name] ?: emptyList()

        // Simple scoring: rank score + light score
        val scores = mutableMapOf<String, Int>()
        
        sceneAffinity.forEachIndexed { index, poseId ->
            scores[poseId] = (scores[poseId] ?: 0) + (100 - index) // Higher is better
        }
        
        lightAffinity.forEachIndexed { index, poseId ->
            scores[poseId] = (scores[poseId] ?: 0) + ((100 - index) / 2) // Light is secondary weighting
        }

        // Sort by score descending
        val rankedIds = scores.entries.sortedByDescending { it.value }.map { it.key }

        return rankedIds.mapNotNull { posesLibrary[it] }.ifEmpty { defaultList }
    }
}

// DTOs
private data class PosesLibraryDto(val version: String, val poses: List<PoseTemplate>)
private data class AffinityMatrix(
    val version: String,
    val environmentRankings: Map<String, List<String>>, // SceneEnv -> List of Pose IDs ordered by rank
    val lightingRankings: Map<String, List<String>>
)
