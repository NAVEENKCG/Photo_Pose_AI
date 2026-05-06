package com.poseguide.ai.presentation.viewmodel

import android.graphics.Bitmap
import androidx.camera.core.ImageProxy
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.accurate.AccuratePoseDetectorOptions
import com.poseguide.ai.data.scene.SceneAnalyzer
import com.poseguide.ai.domain.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import com.google.mlkit.vision.pose.Pose as MlKitPose

/**
 * CameraViewModel — orchestrates CameraX frame processing.
 *
 * Frame pipeline:
 *   Raw frame → [processFrame] → (every 3rd) pose detection
 *                               → (every 30th) scene detection
 *   Results flow to [SceneViewModel] and [PoseViewModel] via shared StateFlows.
 */
@HiltViewModel
class CameraViewModel @Inject constructor(
    private val sceneAnalyzer: SceneAnalyzer
) : ViewModel() {

    companion object {
        private const val POSE_FRAME_INTERVAL  = 3
        private const val SCENE_FRAME_INTERVAL = 30
    }

    // ─── ML Kit Detectors ──────────────────────────────────────────────────────

    private val poseDetector = PoseDetection.getClient(
        AccuratePoseDetectorOptions.Builder()
            .setDetectorMode(AccuratePoseDetectorOptions.STREAM_MODE)
            .build()
    )

    private val faceDetector = FaceDetection.getClient(
        FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
            .build()
    )

    // ─── Output Flows ─────────────────────────────────────────────────────────

    private val _poseLandmarks = MutableStateFlow<PoseLandmarks?>(null)
    val poseLandmarks: StateFlow<PoseLandmarks?> = _poseLandmarks.asStateFlow()

    private val _sceneContext = MutableStateFlow<SceneContext?>(null)
    val sceneContext: StateFlow<SceneContext?> = _sceneContext.asStateFlow()

    private val _faceCount = MutableStateFlow(1)
    val faceCount: StateFlow<Int> = _faceCount.asStateFlow()

    private val _isPortraitMode = MutableStateFlow(true)
    val isPortraitMode: StateFlow<Boolean> = _isPortraitMode.asStateFlow()

    // ─── Frame Counter ─────────────────────────────────────────────────────────

    private var frameCount = 0

    // ─── Public API ────────────────────────────────────────────────────────────

    fun setPortraitMode(enabled: Boolean) {
        _isPortraitMode.value = enabled
    }

    /**
     * Called from CameraX ImageAnalysis use case on the analysis executor thread.
     * Must be quick — heavy work is launched onto [Dispatchers.Default].
     */
    fun processFrame(imageProxy: ImageProxy) {
        val rotationDegrees = imageProxy.imageInfo.rotationDegrees
        val bitmap = imageProxy.toBitmap()
        frameCount++
        val currentFrame = frameCount

        viewModelScope.launch(Dispatchers.Default) {
            try {
                val image = InputImage.fromBitmap(bitmap, rotationDegrees)

                // Every 3rd frame: pose detection
                if (currentFrame % POSE_FRAME_INTERVAL == 0) {
                    val mlPose = poseDetector.process(image).await()
                    _poseLandmarks.value = mlPose.toDomainLandmarks()
                }

                // Every 30th frame: face count + scene detection
                if (currentFrame % SCENE_FRAME_INTERVAL == 0) {
                    val faces = faceDetector.process(image).await()
                    _faceCount.value = faces.size.coerceAtLeast(1)
                    val scene = sceneAnalyzer.analyze(bitmap, _faceCount.value)
                    _sceneContext.value = scene
                }
            } finally {
                imageProxy.close()
                bitmap.recycle()
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        poseDetector.close()
        faceDetector.close()
    }

    // ─── ML Kit → Domain Mapping ──────────────────────────────────────────────

    private fun MlKitPose.toDomainLandmarks(): PoseLandmarks {
        val map = mutableMapOf<PoseLandmarkType, LandmarkPoint>()
        fun add(mlType: Int, domainType: PoseLandmarkType) {
            getPoseLandmark(mlType)?.let { lm ->
                map[domainType] = LandmarkPoint(
                    x = lm.position3D.x,
                    y = lm.position3D.y,
                    z = lm.position3D.z,
                    inFrameLikelihood = lm.inFrameLikelihood
                )
            }
        }
        add(PoseLandmark.NOSE, PoseLandmarkType.NOSE)
        add(PoseLandmark.LEFT_SHOULDER, PoseLandmarkType.LEFT_SHOULDER)
        add(PoseLandmark.RIGHT_SHOULDER, PoseLandmarkType.RIGHT_SHOULDER)
        add(PoseLandmark.LEFT_ELBOW, PoseLandmarkType.LEFT_ELBOW)
        add(PoseLandmark.RIGHT_ELBOW, PoseLandmarkType.RIGHT_ELBOW)
        add(PoseLandmark.LEFT_WRIST, PoseLandmarkType.LEFT_WRIST)
        add(PoseLandmark.RIGHT_WRIST, PoseLandmarkType.RIGHT_WRIST)
        add(PoseLandmark.LEFT_HIP, PoseLandmarkType.LEFT_HIP)
        add(PoseLandmark.RIGHT_HIP, PoseLandmarkType.RIGHT_HIP)
        add(PoseLandmark.LEFT_KNEE, PoseLandmarkType.LEFT_KNEE)
        add(PoseLandmark.RIGHT_KNEE, PoseLandmarkType.RIGHT_KNEE)
        add(PoseLandmark.LEFT_ANKLE, PoseLandmarkType.LEFT_ANKLE)
        add(PoseLandmark.RIGHT_ANKLE, PoseLandmarkType.RIGHT_ANKLE)
        add(PoseLandmark.LEFT_HEEL, PoseLandmarkType.LEFT_HEEL)
        add(PoseLandmark.RIGHT_HEEL, PoseLandmarkType.RIGHT_HEEL)
        return PoseLandmarks(map)
    }
}
