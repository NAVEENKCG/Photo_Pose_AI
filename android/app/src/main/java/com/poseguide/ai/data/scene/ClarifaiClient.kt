package com.poseguide.ai.data.scene

import android.graphics.Bitmap
import android.util.Log
import com.google.gson.Gson
import com.poseguide.ai.domain.model.SceneEnvironment
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.ByteArrayOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ClarifaiClient @Inject constructor(
    private val client: OkHttpClient,
    private val gson: Gson
) {
    companion object {
        private const val TAG = "ClarifaiClient"
        private const val API_URL = "https://api.clarifai.com/v2/models/general-image-recognition/outputs"
        private const val PAT = "YOUR_CLARIFAI_PAT" // To be set by user
        private const val CONFIDENCE_THRESHOLD = 0.75f
    }

    suspend fun analyze(bitmap: Bitmap): SceneEnvironment? = withContext(Dispatchers.IO) {
        if (PAT == "YOUR_CLARIFAI_PAT") {
            Log.w(TAG, "Clarifai PAT not configured.")
            return@withContext null
        }

        try {
            // Compress frame to 512x512 JPEG max to save bandwidth
            val scaled = Bitmap.createScaledBitmap(bitmap, 512, 512, true)
            val stream = ByteArrayOutputStream()
            scaled.compress(Bitmap.CompressFormat.JPEG, 80, stream)
            val base64Image = android.util.Base64.encodeToString(stream.toByteArray(), android.util.Base64.NO_WRAP)
            scaled.recycle()

            val requestBodyJson = """
                {
                  "inputs": [
                    {
                      "data": {
                        "image": {
                          "base64": "$base64Image"
                        }
                      }
                    }
                  ]
                }
            """.trimIndent()

            val request = Request.Builder()
                .url(API_URL)
                .addHeader("Authorization", "Key $PAT")
                .addHeader("Content-Type", "application/json")
                .post(requestBodyJson.toRequestBody("application/json".toMediaType()))
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                Log.e(TAG, "Clarifai API error: ${response.code}")
                return@withContext null
            }

            val bodyString = response.body?.string() ?: return@withContext null
            val responseData = gson.fromJson(bodyString, ClarifaiResponse::class.java)

            val concepts = responseData.outputs?.firstOrNull()?.data?.concepts ?: emptyList()
            val confidentConcepts = concepts
                .filter { it.value >= CONFIDENCE_THRESHOLD }
                .map { it.name.lowercase() }

            return@withContext mapConceptsToEnvironment(confidentConcepts)

        } catch (e: Exception) {
            Log.e(TAG, "Clarifai request failed", e)
            return@withContext null
        }
    }

    private fun mapConceptsToEnvironment(concepts: List<String>): SceneEnvironment? {
        val beachKeywords = setOf("beach", "ocean", "sea", "sand", "coast")
        val streetKeywords = setOf("street", "road", "urban", "city", "traffic")
        val cafeKeywords = setOf("cafe", "coffee", "restaurant", "dining")
        val parkKeywords = setOf("park", "grass", "field", "garden")
        val indoorKeywords = setOf("indoor", "room", "furniture")
        val landmarkKeywords = setOf("landmark", "monument", "tower", "bridge", "architecture")
        val forestKeywords = setOf("forest", "woods", "trees", "jungle")
        val rooftopKeywords = setOf("rooftop", "roof", "skyline")

        return when {
            concepts.any { it in beachKeywords } -> SceneEnvironment.BEACH
            concepts.any { it in forestKeywords } -> SceneEnvironment.FOREST
            concepts.any { it in parkKeywords } -> SceneEnvironment.PARK
            concepts.any { it in rooftopKeywords } -> SceneEnvironment.ROOFTOP
            concepts.any { it in landmarkKeywords } -> SceneEnvironment.LANDMARK
            concepts.any { it in streetKeywords } -> SceneEnvironment.STREET
            concepts.any { it in cafeKeywords } -> SceneEnvironment.CAFE
            concepts.any { it in indoorKeywords } -> SceneEnvironment.INDOOR
            else -> null
        }
    }
}

// Minimal DTOs for Clarifai Response
private data class ClarifaiResponse(val outputs: List<ClarifaiOutput>?)
private data class ClarifaiOutput(val data: ClarifaiData?)
private data class ClarifaiData(val concepts: List<ClarifaiConcept>?)
private data class ClarifaiConcept(val name: String, val value: Float)
