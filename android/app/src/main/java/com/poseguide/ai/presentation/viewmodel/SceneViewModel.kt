package com.poseguide.ai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.poseguide.ai.domain.model.SceneContext
import com.poseguide.ai.domain.repository.PoseHistoryRepository
import com.poseguide.ai.domain.repository.SessionStats
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * SceneViewModel — exposes the current scene context and session analytics.
 */
@HiltViewModel
class SceneViewModel @Inject constructor(
    private val historyRepository: PoseHistoryRepository
) : ViewModel() {

    private val _sceneContext = MutableStateFlow<SceneContext?>(null)
    val sceneContext: StateFlow<SceneContext?> = _sceneContext.asStateFlow()

    val sessionStats: StateFlow<SessionStats> = historyRepository
        .observeSessionStats()
        .stateIn(viewModelScope, SharingStarted.Lazily, SessionStats())

    fun onSceneUpdated(scene: SceneContext) {
        _sceneContext.value = scene
    }

    fun clearHistory() {
        viewModelScope.launch { historyRepository.clearHistory() }
    }
}
