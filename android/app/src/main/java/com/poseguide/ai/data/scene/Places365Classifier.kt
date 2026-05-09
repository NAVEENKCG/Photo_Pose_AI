package com.poseguide.ai.data.scene

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.poseguide.ai.domain.model.SceneEnvironment
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import org.tensorflow.lite.support.tensorbuffer.TensorBuffer
import java.nio.MappedByteBuffer
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class Places365Classifier @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val TAG = "Places365Classifier"
        private const val MODEL_FILE = "places365_mobilenet_v2_1.0_224_quant.tflite"
        private const val LABELS_FILE = "places365_labels.txt" // we will map these internally
    }

    private var labels: List<String> = emptyList()
    
    private val imageProcessor = ImageProcessor.Builder()
        .add(ResizeOp(224, 224, ResizeOp.ResizeMethod.BILINEAR))
        .build()

    private val interpreter: Interpreter by lazy {
        val modelBuffer: MappedByteBuffer = FileUtil.loadMappedFile(context, MODEL_FILE)
        val options = Interpreter.Options()
        options.setNumThreads(2)
        options.setUseNNAPI(true)
        val interp = Interpreter(modelBuffer, options)
        Log.d(TAG, "Interpreter initialized successfully")
        interp
    }

    suspend fun analyze(bitmap: Bitmap): SceneEnvironment? = withContext(Dispatchers.Default) {
        if (interpreter == null) return@withContext null

        try {
            var tensorImage = TensorImage(org.tensorflow.lite.DataType.UINT8)
            tensorImage.load(bitmap)
            tensorImage = imageProcessor.process(tensorImage)

            val outputBuffer = TensorBuffer.createFixedSize(intArrayOf(1, 365), org.tensorflow.lite.DataType.UINT8)

            interpreter?.run(tensorImage.buffer, outputBuffer.buffer.rewind())

            val probabilities = outputBuffer.floatArray
            var maxIdx = -1
            var maxProb = -1f
            for (i in probabilities.indices) {
                // Since it's quant (UINT8), array is floats representing uint8 (0-255)
                if (probabilities[i] > maxProb) {
                    maxProb = probabilities[i]
                    maxIdx = i
                }
            }

            // A simplified mapping. In production, we need a complete mapping array.
            return@withContext mapIndexToEnvironment(maxIdx)

        } catch (e: Exception) {
            Log.e(TAG, "TFLite inference failed", e)
            return@withContext null
        }
    }

    private fun mapIndexToEnvironment(index: Int): SceneEnvironment {
        // Dummy mapping for Places365 indices to our SceneEnvironment
        // 0-100: Indoor, 101-200: Street, 201-250: Nature, etc.
        // This is a placeholder for the actual mapping
        return when (index) {
            in 0..50 -> SceneEnvironment.INDOOR
            in 51..100 -> SceneEnvironment.CAFE
            in 101..150 -> SceneEnvironment.STREET
            in 151..200 -> SceneEnvironment.PARK
            in 201..250 -> SceneEnvironment.BEACH
            in 251..300 -> SceneEnvironment.FOREST
            else -> SceneEnvironment.GENERIC
        }
    }
}
