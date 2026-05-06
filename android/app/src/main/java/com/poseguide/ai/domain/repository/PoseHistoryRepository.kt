package com.poseguide.ai.domain.repository

import com.poseguide.ai.domain.model.PoseTemplate
import com.poseguide.ai.domain.model.SceneType
import kotlinx.coroutines.flow.Flow

/** Repository for persisting pose usage history and personalization data. */
interface PoseHistoryRepository {
    suspend fun savePoseUsage(poseId: String, sceneType: SceneType, wasAccepted: Boolean)
    suspend fun getAcceptedPoseIds(): List<String>
    fun observeSessionStats(): Flow<SessionStats>
    suspend fun clearHistory()
}

data class SessionStats(
    val totalPosesShown: Int = 0,
    val totalPosesAccepted: Int = 0,
    val mostUsedScene: SceneType? = null,
    val sessionDurationMs: Long = 0L
)
