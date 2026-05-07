package com.poseguide.ai.data.scene

import android.util.Log
import com.google.gson.Gson
import com.poseguide.ai.domain.model.LightingContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.Calendar
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WeatherClient @Inject constructor(
    private val client: OkHttpClient,
    private val gson: Gson
) {
    companion object {
        private const val TAG = "WeatherClient"
        // Dummy default coordinates if GPS not available (e.g., San Francisco)
        private const val DEFAULT_LAT = 37.7749
        private const val DEFAULT_LON = -122.4194
    }

    private var cachedLighting: LightingContext? = null
    private var lastFetchTime: Long = 0
    private val CACHE_DURATION_MS = 30 * 60 * 1000L // 30 minutes

    suspend fun getLightingContext(lat: Double = DEFAULT_LAT, lon: Double = DEFAULT_LON): LightingContext = withContext(Dispatchers.IO) {
        if (cachedLighting != null && (System.currentTimeMillis() - lastFetchTime) < CACHE_DURATION_MS) {
            return@withContext cachedLighting!!
        }

        try {
            val url = "https://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon&current_weather=true"
            val request = Request.Builder().url(url).build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                Log.e(TAG, "Open-Meteo API error: ${response.code}")
                return@withContext LightingContext.OVERCAST
            }

            val bodyString = response.body?.string() ?: return@withContext LightingContext.OVERCAST
            val weatherData = gson.fromJson(bodyString, OpenMeteoResponse::class.java)

            val weatherCode = weatherData.current_weather?.weathercode ?: 0
            val isNight = weatherData.current_weather?.is_day == 0

            val result = mapWeatherToLighting(weatherCode, isNight)
            
            cachedLighting = result
            lastFetchTime = System.currentTimeMillis()
            
            return@withContext result
        } catch (e: Exception) {
            Log.e(TAG, "Weather fetch failed", e)
            return@withContext LightingContext.OVERCAST
        }
    }

    private fun mapWeatherToLighting(weatherCode: Int, isNight: Boolean): LightingContext {
        // WMO Weather interpretation codes
        // 0: Clear sky
        // 1, 2, 3: Mainly clear, partly cloudy, and overcast
        // 45, 48: Fog
        // 51-99: Rain, Snow, Thunderstorm
        
        if (isNight) return LightingContext.LOW_LIGHT

        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        
        val isClear = weatherCode <= 2
        val isOvercast = weatherCode >= 3

        if (isOvercast) return LightingContext.OVERCAST

        return when (hour) {
            in 6..9 -> LightingContext.GOLDEN_HOUR
            in 10..15 -> LightingContext.HARSH_NOON
            in 16..19 -> LightingContext.GOLDEN_HOUR
            else -> LightingContext.LOW_LIGHT // Default for other times (should be caught by isNight though)
        }
    }
}

private data class OpenMeteoResponse(val current_weather: CurrentWeather?)
private data class CurrentWeather(val weathercode: Int, val is_day: Int)
