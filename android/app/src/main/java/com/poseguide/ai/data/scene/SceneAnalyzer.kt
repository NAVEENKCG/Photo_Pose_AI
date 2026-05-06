package com.poseguide.ai.data.scene

import android.graphics.Bitmap
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.label.ImageLabeler
import com.google.mlkit.vision.label.ImageLabel
import com.poseguide.ai.domain.model.*
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.math.abs

/**
 * SceneAnalyzer — runs on every 30th camera frame.
 *
 * Combines ML Kit image labeling results with simple pixel analysis
 * to produce a [SceneContext]. The [SceneContext.fingerprint] is used
 * by PoseRotationManager to detect scene changes.
 */
@Singleton
class SceneAnalyzer @Inject constructor(
    private val imageLabeler: ImageLabeler
) {

    companion object {
        private const val TAG = "SceneAnalyzer"
        private const val LABEL_CONFIDENCE_THRESHOLD = 0.65f
    }

    private var lastFingerprint: String = ""

    /**
     * Analyzes the given [bitmap] and returns a [SceneContext].
     * Call on an IO or Default dispatcher.
     */
    suspend fun analyze(bitmap: Bitmap, faceCount: Int = 1): SceneContext {
        val labels = runLabeler(bitmap)
        val labelTexts = labels.filter { it.confidence >= LABEL_CONFIDENCE_THRESHOLD }
            .map { it.text.lowercase() }
        Log.d(TAG, "Labels detected: $labelTexts")

        val environment = detectEnvironment(labelTexts, bitmap)
        val lighting = detectLighting(labelTexts, bitmap)
        val subjectCount = when {
            faceCount <= 0 -> SubjectCount.SOLO
            faceCount == 1 -> SubjectCount.SOLO
            faceCount == 2 -> SubjectCount.DUO
            else -> SubjectCount.GROUP
        }
        val backgroundComplexity = detectBackgroundComplexity(bitmap)

        return SceneContext(
            environment = environment,
            lighting = lighting,
            subjectCount = subjectCount,
            framing = CameraFraming.UNKNOWN, // set by CameraViewModel from aspect ratio
            backgroundComplexity = backgroundComplexity
        )
    }

    fun hasSceneChanged(newFingerprint: String): Boolean {
        if (newFingerprint != lastFingerprint) {
            lastFingerprint = newFingerprint
            return true
        }
        return false
    }

    // ─── Environment Detection ─────────────────────────────────────────────────

    private fun detectEnvironment(labels: List<String>, bitmap: Bitmap): EnvironmentType {
        val beachKeywords = setOf("beach", "sea", "ocean", "sand", "wave", "coast", "water")
        val urbanKeywords = setOf("building", "street", "road", "city", "architecture", "sidewalk", "pavement")
        val cafeKeywords  = setOf("coffee", "cafe", "restaurant", "food", "drink", "table", "cup", "indoor")
        val parkKeywords  = setOf("park", "tree", "grass", "nature", "garden", "forest", "field", "leaf")
        val landmarkKeywords = setOf("landmark", "monument", "bridge", "tower", "museum")

        val scores = mapOf(
            EnvironmentType.BEACH        to labels.count { it in beachKeywords },
            EnvironmentType.URBAN_STREET to labels.count { it in urbanKeywords },
            EnvironmentType.CAFE         to labels.count { it in cafeKeywords },
            EnvironmentType.PARK         to labels.count { it in parkKeywords },
            EnvironmentType.LANDMARK     to labels.count { it in landmarkKeywords }
        )

        val topEnv = scores.maxByOrNull { it.value }
        return if ((topEnv?.value ?: 0) > 0) topEnv!!.key
        else {
            // Fallback: pixel-based green/blue analysis
            detectFromPixelColors(bitmap)
        }
    }

    private fun detectFromPixelColors(bitmap: Bitmap): EnvironmentType {
        val scaled = Bitmap.createScaledBitmap(bitmap, 32, 32, false)
        var greenPixels = 0; var bluePixels = 0; var total = 0
        for (x in 0 until scaled.width) {
            for (y in 0 until scaled.height) {
                val pixel = scaled.getPixel(x, y)
                val r = (pixel shr 16) and 0xFF
                val g = (pixel shr 8) and 0xFF
                val b = pixel and 0xFF
                if (g > r + 20 && g > b + 20) greenPixels++
                if (b > r + 20 && b > g + 10) bluePixels++
                total++
            }
        }
        scaled.recycle()
        return when {
            greenPixels > total * 0.35 -> EnvironmentType.PARK
            bluePixels > total * 0.40  -> EnvironmentType.BEACH
            else -> EnvironmentType.INDOOR
        }
    }

    // ─── Lighting Detection ────────────────────────────────────────────────────

    private fun detectLighting(labels: List<String>, bitmap: Bitmap): LightingCondition {
        val avgBrightness = computeAverageBrightness(bitmap)
        return when {
            "sunset" in labels || "sunrise" in labels || avgBrightness in 120f..185f ->
                LightingCondition.GOLDEN_HOUR
            avgBrightness > 200f -> LightingCondition.HARSH_MIDDAY
            avgBrightness < 80f  -> LightingCondition.LOW_LIGHT
            "indoor" in labels || labels.any { it.contains("indoor") } ->
                LightingCondition.INDOOR_ARTIFICIAL
            else -> LightingCondition.OVERCAST
        }
    }

    private fun computeAverageBrightness(bitmap: Bitmap): Float {
        val scaled = Bitmap.createScaledBitmap(bitmap, 16, 16, false)
        var sum = 0L
        for (x in 0 until scaled.width) {
            for (y in 0 until scaled.height) {
                val pixel = scaled.getPixel(x, y)
                val r = (pixel shr 16) and 0xFF
                val g = (pixel shr 8) and 0xFF
                val b = pixel and 0xFF
                sum += (r + g + b) / 3
            }
        }
        scaled.recycle()
        return sum.toFloat() / (scaled.width * scaled.height)
    }

    // ─── Background Complexity ─────────────────────────────────────────────────

    private fun detectBackgroundComplexity(bitmap: Bitmap): BackgroundComplexity {
        val scaled = Bitmap.createScaledBitmap(bitmap, 16, 16, false)
        var edgeCount = 0
        for (x in 1 until scaled.width) {
            for (y in 0 until scaled.height) {
                val curr = scaled.getPixel(x, y)
                val prev = scaled.getPixel(x - 1, y)
                val diff = colorDiff(curr, prev)
                if (diff > 30) edgeCount++
            }
        }
        scaled.recycle()
        return when {
            edgeCount < 20  -> BackgroundComplexity.CLEAN
            edgeCount < 60  -> BackgroundComplexity.MODERATE
            else            -> BackgroundComplexity.CLUTTERED
        }
    }

    private fun colorDiff(c1: Int, c2: Int): Int {
        val r = abs(((c1 shr 16) and 0xFF) - ((c2 shr 16) and 0xFF))
        val g = abs(((c1 shr 8) and 0xFF) - ((c2 shr 8) and 0xFF))
        val b = abs((c1 and 0xFF) - (c2 and 0xFF))
        return (r + g + b) / 3
    }

    // ─── ML Kit Labeler Coroutine Bridge ───────────────────────────────────────

    private suspend fun runLabeler(bitmap: Bitmap): List<ImageLabel> =
        suspendCancellableCoroutine { cont ->
            val image = InputImage.fromBitmap(bitmap, 0)
            imageLabeler.process(image)
                .addOnSuccessListener { labels -> cont.resume(labels) }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Image labeling failed", e)
                    cont.resume(emptyList())
                }
        }
}
