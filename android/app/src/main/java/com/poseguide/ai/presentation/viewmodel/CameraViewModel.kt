package com.poseguide.ai.presentation.viewmodel

import android.graphics.Bitmap
import androidx.camera.core.ImageProxy
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.accurate.AccuratePoseDetectorOptions
import com.poseguide.ai.data.pose.BodyProportionAnalyzer
import com.poseguide.ai.data.scene.SceneAnalyzer
import com.poseguide.ai.domain.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import com.google.mlkit.vision.pose.Pose as MlKitPose

@HiltViewModel
class CameraViewModel @Inject constructor(
    private val sceneAnalyzer: SceneAnalyzer,
    private val bodyProportionAnalyzer: BodyProportionAnalyzer
) : ViewModel() {

    companion object {
        private const val POSE_FRAME_INTERVAL  = 3
        private const val SCENE_FRAME_INTERVAL = 30
    }

    private val poseDetector = PoseDetection.getClient(
        AccuratePoseDetectorOptions.Builder()
            .setDetectorMode(AccuratePoseDetectorOptions.STREAM_MODE)
            .build()
    )

    private val _poseLandmarks = MutableStateFlow<PoseLandmarks?>(null)
    val poseLandmarks: StateFlow<PoseLandmarks?> = _poseLandmarks.asStateFlow()

    private val _sceneContext = MutableStateFlow<SceneContext?>(null)
    val sceneContext: StateFlow<SceneContext?> = _sceneContext.asStateFlow()

    private val _bodyProportions = MutableStateFlow<BodyProportions?>(null)
    val bodyProportions: StateFlow<BodyProportions?> = _bodyProportions.asStateFlow()

    private var frameCount = 0

    fun processFrame(imageProxy: ImageProxy) {
        val rotationDegrees = imageProxy.imageInfo.rotationDegrees
        val bitmap = imageProxy.toBitmap()
        frameCount++
        val currentFrame = frameCount

        viewModelScope.launch(Dispatchers.Default) {
            try {
                val image = InputImage.fromBitmap(bitmap, rotationDegrees)

                // Pose Detection
                if (currentFrame % POSE_FRAME_INTERVAL == 0) {
                    val mlPose = poseDetector.process(image).await()
                    val landmarks = mlPose.toDomainLandmarks()
                    _poseLandmarks.value = landmarks

                    // Body Proportion Calibration
                    if (!bodyProportionAnalyzer.isCalibrated()) {
                        bodyProportionAnalyzer.addSample(landmarks, bitmap.width, bitmap.height)
                        if (bodyProportionAnalyzer.isCalibrated()) {
                            _bodyProportions.value = bodyProportionAnalyzer.getCalibratedProportions()
                        }
                    }
                }

                // Scene Detection
                if (currentFrame % SCENE_FRAME_INTERVAL == 0) {
                    val scene = sceneAnalyzer.analyze(bitmap, _poseLandmarks.value)
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
    }

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
