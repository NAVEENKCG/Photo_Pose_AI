package com.poseguide.ai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.poseguide.ai.data.pose.AffinityMatrixLoader
import com.poseguide.ai.data.pose.PoseMatcher
import com.poseguide.ai.domain.model.*
import com.poseguide.ai.domain.repository.PoseRotationManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PoseViewModel @Inject constructor(
    private val poseRotationManager: PoseRotationManager,
    private val affinityMatrixLoader: AffinityMatrixLoader
) : ViewModel() {

    companion object {
        private const val POSE_SKIP_TIMEOUT_MS = 10_000L
        private const val LOW_CONFIDENCE_THRESHOLD = 0.40f
    }

    private val _currentScene = MutableStateFlow<SceneContext?>(null)
    private val _landmarks    = MutableStateFlow<PoseLandmarks?>(null)

    private val _currentPose = MutableStateFlow<PoseTemplate?>(null)
    val currentPose: StateFlow<PoseTemplate?> = _currentPose.asStateFlow()

    private val _matchResult = MutableStateFlow<PoseMatchResult?>(null)
    val matchResult: StateFlow<PoseMatchResult?> = _matchResult.asStateFlow()

    private val _isCoachEnabled = MutableStateFlow(true)
    val isCoachEnabled: StateFlow<Boolean> = _isCoachEnabled.asStateFlow()

    private var lastFingerprint: String = ""
    private var skipTimeoutJob: Job? = null

    init {
        viewModelScope.launch {
            affinityMatrixLoader.loadData()
        }
        observeLandmarks()
    }

    fun updateScene(sceneContext: SceneContext, landmarks: PoseLandmarks?) {
        _currentScene.value = sceneContext
        _landmarks.value = landmarks ?: PoseLandmarks()

        val newFingerprint = sceneContext.fingerprint
        if (newFingerprint != lastFingerprint) {
            lastFingerprint = newFingerprint
            requestNextPose(reason = "scene_changed")
        }
    }

    fun requestNextPose(reason: String = "user_tap") {
        val scene = _currentScene.value ?: return

        viewModelScope.launch {
            val rankedPoses = affinityMatrixLoader.getRankedPoses(scene)
            val next = poseRotationManager.getNextPose(scene, rankedPoses)
            _currentPose.value = next
            resetSkipTimer()
        }
    }

    fun toggleCoach() {
        _isCoachEnabled.value = !_isCoachEnabled.value
        if (!_isCoachEnabled.value) {
            skipTimeoutJob?.cancel()
            _matchResult.value = null
        }
    }

    fun resetSession() {
        poseRotationManager.resetSession()
        _currentPose.value = null
        _matchResult.value = null
        lastFingerprint = ""
    }

    private fun observeLandmarks() {
        viewModelScope.launch {
            _landmarks.collect { landmarks ->
                val template = _currentPose.value ?: return@collect
                if (!_isCoachEnabled.value || landmarks == null) return@collect

                val result = PoseMatcher.computeMatch(template, landmarks)
                _matchResult.value = result

                // Restart skip timer if confidence is high
                if (result.score >= LOW_CONFIDENCE_THRESHOLD) {
                    resetSkipTimer()
                }
            }
        }
    }

    private fun resetSkipTimer() {
        skipTimeoutJob?.cancel()
        skipTimeoutJob = viewModelScope.launch {
            delay(POSE_SKIP_TIMEOUT_MS)
            val currentScore = _matchResult.value?.score ?: 0f
            if (currentScore < LOW_CONFIDENCE_THRESHOLD) {
                requestNextPose("auto_skip_low_confidence")
            }
        }
    }

    fun updateLandmarks(landmarks: PoseLandmarks?) {
        _landmarks.value = landmarks
    }
}
