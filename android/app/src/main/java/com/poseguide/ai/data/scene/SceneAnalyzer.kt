package com.poseguide.ai.data.scene

import android.graphics.Bitmap
import android.graphics.Color
import androidx.palette.graphics.Palette
import com.google.mlkit.vision.common.InputImage
import com.poseguide.ai.domain.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SceneAnalyzer @Inject constructor(
    private val clarifaiClient: ClarifaiClient,
    private val weatherClient: WeatherClient,
    private val placesClassifier: Places365Classifier
) {
    suspend fun analyze(bitmap: Bitmap, landmarks: PoseLandmarks? = null): SceneContext = withContext(Dispatchers.Default) {
        
        // 1. Scene Environment (3-Layer Fallback)
        val environment = async { getEnvironmentFallback(bitmap) }

        // 2. Lighting (Weather API)
        val lighting = async { weatherClient.getLightingContext() }

        // 3. Framing & Subject (ML Kit Landmarks)
        val framing = async { determineFraming(landmarks) }
        val subjectCount = SubjectCount.SOLO // Multi-person detection not yet implemented

        // 4. Background Dominant Color & Complexity
        val palette = async { extractPalette(bitmap) }
        val dominantColor = palette.await().dominantSwatch?.rgb?.let { String.format("#%06X", 0xFFFFFF and it) } ?: "#000000"
        val complexity = determineComplexity(palette.await())

        SceneContext(
            environment = environment.await(),
            lighting = lighting.await(),
            subjectCount = subjectCount,
            framing = framing.await(),
            backgroundComplexity = complexity,
            dominantColorHex = dominantColor,
            confidence = 0.9f // We can derive this from the ML layers in a fuller implementation
        )
    }

    private suspend fun getEnvironmentFallback(bitmap: Bitmap): SceneEnvironment {
        // Layer 1: Clarifai
        val clarifaiEnv = clarifaiClient.analyze(bitmap)
        if (clarifaiEnv != null) return clarifaiEnv

        // Layer 3: TFLite (Places365)
        val tfliteEnv = placesClassifier.analyze(bitmap)
        if (tfliteEnv != null) return tfliteEnv

        return SceneEnvironment.GENERIC
    }

    private fun determineFraming(landmarks: PoseLandmarks?): CameraFraming {
        if (landmarks == null) return CameraFraming.PORTRAIT

        val hasHead = landmarks.get(PoseLandmarkType.NOSE) != null
        val hasHips = landmarks.get(PoseLandmarkType.LEFT_HIP) != null || landmarks.get(PoseLandmarkType.RIGHT_HIP) != null
        val hasAnkles = landmarks.get(PoseLandmarkType.LEFT_ANKLE) != null || landmarks.get(PoseLandmarkType.RIGHT_ANKLE) != null

        return when {
            hasHead && hasHips && hasAnkles -> CameraFraming.FULL_BODY
            hasHead && hasHips -> CameraFraming.HALF_BODY
            else -> CameraFraming.PORTRAIT
        }
    }

    private fun extractPalette(bitmap: Bitmap): Palette {
        // Scale down heavily for fast color extraction
        val scaled = Bitmap.createScaledBitmap(bitmap, 64, 64, true)
        val palette = Palette.from(scaled).generate()
        scaled.recycle()
        return palette
    }

    private fun determineComplexity(palette: Palette): BackgroundComplexity {
        // Simple heuristic: if we have many vibrant swatches, it's cluttered
        val numSwatches = palette.swatches.size
        return when {
            numSwatches < 3 -> BackgroundComplexity.CLEAN
            numSwatches in 3..6 -> BackgroundComplexity.MODERATE
            else -> BackgroundComplexity.CLUTTERED
        }
    }
}
