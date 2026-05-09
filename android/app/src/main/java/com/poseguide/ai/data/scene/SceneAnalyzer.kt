package com.poseguide.ai.data.scene

import android.graphics.Bitmap
import android.graphics.Color
import com.poseguide.ai.domain.model.PoseLandmarks
import com.poseguide.ai.domain.model.SceneContext
import com.poseguide.ai.domain.model.SceneEnvironment
import com.poseguide.ai.domain.model.LightingContext
import javax.inject.Inject
import javax.inject.Singleton
import java.util.ArrayDeque

@Singleton
class SceneAnalyzer @Inject constructor() {
    
    private var lastSceneContext: SceneContext = SceneContext()
    
    private val recentFingerprints = ArrayDeque<String>(5)
    private var stableFingerprint: String = ""
    
    private var prevFramePixels: IntArray? = null
    private val MOTION_THRESHOLD = 0.04f   // 4% pixel change
    
    private var lastClarifaiCallTime = 0L
    private val CLARIFAI_COOLDOWN_MS = 8000L

    fun analyze(bitmap: Bitmap, landmarks: PoseLandmarks?): SceneContext {
        val now = System.currentTimeMillis()
        val hasMotion = hasSignificantMotion(bitmap)
        
        if (hasMotion && now - lastClarifaiCallTime > CLARIFAI_COOLDOWN_MS) {
            val sceneType = analyzeWithClarifai(bitmap) ?: analyzeWithTFLite(bitmap)
            val lightingType = fetchWeatherLighting()
            
            val newContext = SceneContext(
                environment = sceneType,
                lighting = lightingType
            )
            lastClarifaiCallTime = now
            lastSceneContext = newContext
        }
        
        return lastSceneContext
    }

    fun maybeUpdateScene(newFingerprint: String): Boolean {
        recentFingerprints.addLast(newFingerprint)
        if (recentFingerprints.size > 5) recentFingerprints.removeFirst()

        val dominantFp = recentFingerprints
            .groupingBy { it }
            .eachCount()
            .maxByOrNull { it.value }
            ?.key ?: return false

        val changed = dominantFp != stableFingerprint &&
            recentFingerprints.count { it == dominantFp } >= 4

        if (changed) stableFingerprint = dominantFp
        return changed
    }

    fun hasSignificantMotion(bitmap: Bitmap): Boolean {
        val w = 64; val h = 64
        val scaled = Bitmap.createScaledBitmap(bitmap, w, h, false)
        val pixels = IntArray(w * h)
        scaled.getPixels(pixels, 0, w, 0, 0, w, h)

        val prev = prevFramePixels
        prevFramePixels = pixels

        if (prev == null) return true

        var diff = 0
        for (i in pixels.indices) {
            val dr = Color.red(pixels[i]) - Color.red(prev[i])
            val dg = Color.green(pixels[i]) - Color.green(prev[i])
            val db = Color.blue(pixels[i]) - Color.blue(prev[i])
            if ((dr * dr + dg * dg + db * db) > 2000) diff++
        }
        return diff.toFloat() / pixels.size > MOTION_THRESHOLD
    }
    
    private fun analyzeWithClarifai(bitmap: Bitmap): SceneEnvironment? {
        return SceneEnvironment.LANDMARK // Dummy
    }
    
    private fun fetchWeatherLighting(): LightingContext {
        return LightingContext.DAYLIGHT // Dummy
    }
    
    private fun analyzeWithTFLite(bitmap: Bitmap): SceneEnvironment {
        return SceneEnvironment.URBAN // Dummy
    }
}
