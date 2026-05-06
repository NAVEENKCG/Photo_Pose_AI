package com.poseguide.ai.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.poseguide.ai.data.pose.PoseMatcher
import com.poseguide.ai.domain.model.*
import com.poseguide.ai.domain.repository.PoseRotationManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * PoseViewModel — manages the current pose suggestion and its match confidence.
 *
 * Triggers:
 *  - Scene fingerprint change → getNextPose()
 *  - User taps "Next Pose" → getNextPose()
 *  - User holds pose for >8s (auto-advance) → getNextPose()
 */
@HiltViewModel
class PoseViewModel @Inject constructor(
    private val poseRotationManager: PoseRotationManager
) : ViewModel() {

    companion object {
        private const val AUTO_ADVANCE_MS = 8_000L
    }

    // ─── Inputs (set by Activity / composable) ─────────────────────────────────

    private val _currentScene = MutableStateFlow<SceneContext?>(null)
    private val _landmarks    = MutableStateFlow<PoseLandmarks?>(null)

    // ─── Output State ─────────────────────────────────────────────────────────

    private val _currentPose = MutableStateFlow<PoseTemplate?>(null)
    val currentPose: StateFlow<PoseTemplate?> = _currentPose.asStateFlow()

    private val _matchResult = MutableStateFlow<PoseMatchResult?>(null)
    val matchResult: StateFlow<PoseMatchResult?> = _matchResult.asStateFlow()

    private val _isCoachEnabled = MutableStateFlow(true)
    val isCoachEnabled: StateFlow<Boolean> = _isCoachEnabled.asStateFlow()

    private val _instructionText = MutableStateFlow("")
    val instructionText: StateFlow<String> = _instructionText.asStateFlow()

    private var lastFingerprint: String = ""
    private var autoAdvanceJob: Job? = null

    init {
        observeLandmarks()
    }

    // ─── Public API ────────────────────────────────────────────────────────────

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
        val landmarks = _landmarks.value ?: PoseLandmarks()
        val sceneType = scene.environment.toSceneType()

        viewModelScope.launch {
            val next = poseRotationManager.getNextPose(sceneType, landmarks)
            _currentPose.value = next
            _instructionText.value = next.overlayHints.firstOrNull() ?: ""
            resetAutoAdvanceTimer()
        }
    }

    fun acceptCurrentPose() {
        val pose = _currentPose.value ?: return
        val scene = _currentScene.value ?: return
        poseRotationManager.markPoseAccepted(pose.id, scene.environment.toSceneType())
    }

    fun toggleCoach() {
        _isCoachEnabled.value = !_isCoachEnabled.value
        if (!_isCoachEnabled.value) {
            autoAdvanceJob?.cancel()
            _matchResult.value = null
        }
    }

    fun resetSession() {
        poseRotationManager.resetSession()
        _currentPose.value = null
        _matchResult.value = null
        lastFingerprint = ""
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private fun observeLandmarks() {
        viewModelScope.launch {
            _landmarks.collect { landmarks ->
                val template = _currentPose.value ?: return@collect
                if (!_isCoachEnabled.value || landmarks == null) return@collect

                val result = PoseMatcher.computeMatch(template, landmarks)
                _matchResult.value = result

                // Update instruction hint from partial feedback
                val hint = result.partialFeedback.values.firstOrNull()
                    ?: template.overlayHints.firstOrNull()
                    ?: ""
                _instructionText.value = hint

                // Auto-advance when confidence stays high
                if (result.isReadyToShoot) {
                    scheduleAutoAdvance()
                }
            }
        }
    }

    private fun scheduleAutoAdvance() {
        if (autoAdvanceJob?.isActive == true) return
        autoAdvanceJob = viewModelScope.launch {
            delay(AUTO_ADVANCE_MS)
            requestNextPose("auto_advance")
        }
    }

    private fun resetAutoAdvanceTimer() {
        autoAdvanceJob?.cancel()
        autoAdvanceJob = null
    }

    fun updateLandmarks(landmarks: PoseLandmarks?) {
        _landmarks.value = landmarks
    }
}
