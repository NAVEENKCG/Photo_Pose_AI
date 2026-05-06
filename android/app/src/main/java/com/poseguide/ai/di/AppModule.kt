package com.poseguide.ai.di

import android.content.Context
import androidx.room.Room
import com.google.mlkit.vision.label.ImageLabeling
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions
import com.poseguide.ai.data.db.PoseGuideDatabase
import com.poseguide.ai.data.db.PoseHistoryRepositoryImpl
import com.poseguide.ai.data.db.PoseUsageDao
import com.poseguide.ai.data.pose.PoseRotationManagerImpl
import com.poseguide.ai.domain.repository.PoseHistoryRepository
import com.poseguide.ai.domain.repository.PoseRotationManager
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): PoseGuideDatabase =
        Room.databaseBuilder(context, PoseGuideDatabase::class.java, "pose_guide.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun provideDao(db: PoseGuideDatabase): PoseUsageDao = db.poseUsageDao()

    @Provides
    @Singleton
    fun provideImageLabeler() = ImageLabeling.getClient(
        ImageLabelerOptions.Builder()
            .setConfidenceThreshold(0.60f)
            .build()
    )
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindPoseHistoryRepository(
        impl: PoseHistoryRepositoryImpl
    ): PoseHistoryRepository

    @Binds
    @Singleton
    abstract fun bindPoseRotationManager(
        impl: PoseRotationManagerImpl
    ): PoseRotationManager
}
