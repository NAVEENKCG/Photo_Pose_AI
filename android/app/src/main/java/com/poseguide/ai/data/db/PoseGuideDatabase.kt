package com.poseguide.ai.data.db

import androidx.room.*
import kotlinx.coroutines.flow.Flow

// ─── Entity ────────────────────────────────────────────────────────────────────

@Entity(tableName = "pose_usage")
data class PoseUsageEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val poseId: String,
    val sceneType: String,
    val wasAccepted: Boolean,
    val timestampMs: Long = System.currentTimeMillis()
)

// ─── DAO ───────────────────────────────────────────────────────────────────────

@Dao
interface PoseUsageDao {

    @Insert
    suspend fun insert(entity: PoseUsageEntity)

    @Query("SELECT * FROM pose_usage WHERE wasAccepted = 1")
    suspend fun getAccepted(): List<PoseUsageEntity>

    @Query("SELECT COUNT(*) FROM pose_usage")
    fun observeTotalCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM pose_usage WHERE wasAccepted = 1")
    fun observeAcceptedCount(): Flow<Int>

    @Query("""
        SELECT sceneType, COUNT(*) as cnt FROM pose_usage 
        GROUP BY sceneType 
        ORDER BY cnt DESC 
        LIMIT 1
    """)
    suspend fun getMostUsedScene(): SceneUsageResult?

    @Query("DELETE FROM pose_usage")
    suspend fun deleteAll()
}

data class SceneUsageResult(
    val sceneType: String,
    val cnt: Int
)

// ─── Database ─────────────────────────────────────────────────────────────────

@Database(
    entities = [PoseUsageEntity::class],
    version = 1,
    exportSchema = true
)
abstract class PoseGuideDatabase : RoomDatabase() {
    abstract fun poseUsageDao(): PoseUsageDao
}
