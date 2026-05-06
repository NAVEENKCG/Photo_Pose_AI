package com.poseguide.ai.data.db

import com.poseguide.ai.domain.model.SceneType
import com.poseguide.ai.domain.repository.PoseHistoryRepository
import com.poseguide.ai.domain.repository.SessionStats
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PoseHistoryRepositoryImpl @Inject constructor(
    private val dao: PoseUsageDao
) : PoseHistoryRepository {

    override suspend fun savePoseUsage(poseId: String, sceneType: SceneType, wasAccepted: Boolean) {
        dao.insert(PoseUsageEntity(poseId = poseId, sceneType = sceneType.name, wasAccepted = wasAccepted))
    }

    override suspend fun getAcceptedPoseIds(): List<String> =
        dao.getAccepted().map { it.poseId }

    override fun observeSessionStats(): Flow<SessionStats> =
        combine(
            dao.observeTotalCount(),
            dao.observeAcceptedCount()
        ) { total, accepted ->
            SessionStats(
                totalPosesShown = total,
                totalPosesAccepted = accepted
            )
        }

    override suspend fun clearHistory() = dao.deleteAll()
}
