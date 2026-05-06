package com.poseguide.ai.presentation.ui.screen

import android.view.ViewGroup
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.poseguide.ai.domain.model.PoseMatchResult
import com.poseguide.ai.domain.model.PoseTemplate
import com.poseguide.ai.presentation.overlay.OverlayView
import com.poseguide.ai.presentation.ui.theme.*
import com.poseguide.ai.presentation.viewmodel.CameraViewModel
import com.poseguide.ai.presentation.viewmodel.PoseViewModel
import com.poseguide.ai.presentation.viewmodel.SceneViewModel
import java.util.concurrent.Executors

/**
 * CameraScreen — the main fullscreen viewfinder with pose overlay and controls.
 */
@Composable
fun CameraScreen(
    cameraViewModel: CameraViewModel = hiltViewModel(),
    poseViewModel: PoseViewModel = hiltViewModel(),
    sceneViewModel: SceneViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val haptic = LocalHapticFeedback.current

    // ─── State ─────────────────────────────────────────────────────────────────

    val poseLandmarks  by cameraViewModel.poseLandmarks.collectAsStateWithLifecycle()
    val sceneContext   by cameraViewModel.sceneContext.collectAsStateWithLifecycle()
    val isPortrait     by cameraViewModel.isPortraitMode.collectAsStateWithLifecycle()
    val currentPose    by poseViewModel.currentPose.collectAsStateWithLifecycle()
    val matchResult    by poseViewModel.matchResult.collectAsStateWithLifecycle()
    val instructionTxt by poseViewModel.instructionText.collectAsStateWithLifecycle()
    val isCoachEnabled by poseViewModel.isCoachEnabled.collectAsStateWithLifecycle()

    var useFrontCamera by remember { mutableStateOf(false) }

    // Sync scene + landmarks to PoseViewModel
    LaunchedEffect(sceneContext, poseLandmarks) {
        sceneContext?.let { scene ->
            sceneViewModel.onSceneUpdated(scene)
            poseViewModel.updateScene(scene, poseLandmarks)
        }
        poseViewModel.updateLandmarks(poseLandmarks)
    }

    // ─── Camera Setup ──────────────────────────────────────────────────────────

    val analysisExecutor = remember { Executors.newSingleThreadExecutor() }
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }

    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {

        // ── Fullscreen Camera Preview ──────────────────────────────────────────
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                }
            },
            modifier = Modifier.fillMaxSize(),
            update = { previewView ->
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }
                    val selector = if (useFrontCamera)
                        CameraSelector.DEFAULT_FRONT_CAMERA
                    else
                        CameraSelector.DEFAULT_BACK_CAMERA

                    val analysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                        .build().also { ia ->
                            ia.setAnalyzer(analysisExecutor) { imageProxy ->
                                cameraViewModel.processFrame(imageProxy)
                            }
                        }

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(lifecycleOwner, selector, preview, analysis)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }, ContextCompat.getMainExecutor(context))
            }
        )

        // ── Pose Overlay (Canvas View) ─────────────────────────────────────────
        if (isCoachEnabled) {
            AndroidView(
                factory = { ctx ->
                    OverlayView(ctx).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                        setBackgroundColor(android.graphics.Color.TRANSPARENT)
                    }
                },
                modifier = Modifier.fillMaxSize(),
                update = { overlayView ->
                    overlayView.update(
                        landmarks = poseLandmarks,
                        template = currentPose,
                        matchResult = matchResult
                    )
                }
            )
        }

        // ── Top Bar ────────────────────────────────────────────────────────────
        TopBar(
            isPortrait = isPortrait,
            isCoachEnabled = isCoachEnabled,
            onFlipCamera = { useFrontCamera = !useFrontCamera },
            onToggleCoach = { poseViewModel.toggleCoach() },
            modifier = Modifier.align(Alignment.TopCenter)
        )

        // ── Bottom HUD ────────────────────────────────────────────────────────
        if (isCoachEnabled) {
            BottomHud(
                currentPose = currentPose,
                matchResult = matchResult,
                instructionText = instructionTxt,
                onNextPose = {
                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                    poseViewModel.requestNextPose("user_tap")
                },
                onAccept = {
                    poseViewModel.acceptCurrentPose()
                    haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                },
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }

        // ── Scene Badge ───────────────────────────────────────────────────────
        sceneContext?.let { scene ->
            Surface(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(start = 16.dp, top = 72.dp)
                    .clip(RoundedCornerShape(20.dp)),
                color = Color.White.copy(alpha = 0.12f),
                tonalElevation = 0.dp
            ) {
                Text(
                    text = "📍 ${scene.environment.name.replace("_", " ")}",
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                )
            }
        }
    }
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────

@Composable
private fun TopBar(
    isPortrait: Boolean,
    isCoachEnabled: Boolean,
    onFlipCamera: () -> Unit,
    onToggleCoach: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 52.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Focal mode indicator
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = if (isPortrait) AccentCyan.copy(0.2f) else Color.White.copy(0.1f),
            border = BorderStroke(
                1.dp,
                if (isPortrait) AccentCyan.copy(0.5f) else Color.White.copy(0.2f)
            )
        ) {
            Text(
                text = if (isPortrait) "✦ Portrait 4×" else "Auto",
                color = if (isPortrait) AccentCyan else Color.White.copy(0.6f),
                fontSize = 12.sp,
                fontWeight = FontWeight.W500,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            // Coach toggle
            IconButton(
                onClick = onToggleCoach,
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(0.12f))
            ) {
                Icon(
                    imageVector = if (isCoachEnabled) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                    contentDescription = "Toggle pose coach",
                    tint = if (isCoachEnabled) AccentCyan else Color.White.copy(0.5f),
                    modifier = Modifier.size(20.dp)
                )
            }

            // Flip camera
            IconButton(
                onClick = onFlipCamera,
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(0.12f))
            ) {
                Icon(
                    imageVector = Icons.Default.FlipCameraAndroid,
                    contentDescription = "Flip camera",
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

// ─── Bottom HUD ───────────────────────────────────────────────────────────────

@Composable
private fun BottomHud(
    currentPose: PoseTemplate?,
    matchResult: PoseMatchResult?,
    instructionText: String,
    onNextPose: () -> Unit,
    onAccept: () -> Unit,
    modifier: Modifier = Modifier
) {
    val score = matchResult?.score ?: 0f
    val isReady = matchResult?.isReadyToShoot == true

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 40.dp, start = 20.dp, end = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {

        // ── Confidence Ring Progress Bar ───────────────────────────────────────
        ConfidenceBar(score = score, isReady = isReady)

        // ── Instruction Pill ──────────────────────────────────────────────────
        AnimatedContent(
            targetState = instructionText,
            transitionSpec = {
                (fadeIn() + slideInVertically { it / 2 }).togetherWith(
                    fadeOut() + slideOutVertically { -it / 2 }
                )
            },
            label = "instruction"
        ) { text ->
            if (text.isNotEmpty()) {
                Surface(
                    shape = RoundedCornerShape(50.dp),
                    color = Color.Black.copy(alpha = 0.55f),
                    border = BorderStroke(1.dp, Color.White.copy(0.15f))
                ) {
                    Text(
                        text = text.take(50), // Max ~6 words
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.W500,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp)
                    )
                }
            }
        }

        // ── Pose Name + Ready Badge ────────────────────────────────────────────
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            currentPose?.let {
                Text(
                    text = it.name,
                    color = Color.White.copy(0.9f),
                    fontSize = 16.sp,
                    fontWeight = FontWeight.W600
                )
            }
            if (isReady) {
                ReadyBadge()
            }
        }

        // ── Action Row ────────────────────────────────────────────────────────
        Row(
            horizontalArrangement = Arrangement.spacedBy(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Accept / capture hint
            FilledTonalButton(
                onClick = onAccept,
                colors = ButtonDefaults.filledTonalButtonColors(
                    containerColor = if (isReady) ReadyGreen.copy(0.25f) else Color.White.copy(0.1f),
                    contentColor = if (isReady) ReadyGreen else Color.White.copy(0.7f)
                ),
                shape = RoundedCornerShape(50.dp)
            ) {
                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Accept", fontSize = 14.sp)
            }

            // Next pose
            FilledTonalButton(
                onClick = onNextPose,
                colors = ButtonDefaults.filledTonalButtonColors(
                    containerColor = AccentCyan.copy(0.18f),
                    contentColor = AccentCyan
                ),
                shape = RoundedCornerShape(50.dp)
            ) {
                Icon(Icons.Default.SkipNext, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Next Pose", fontSize = 14.sp)
            }
        }
    }
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────

@Composable
private fun ConfidenceBar(score: Float, isReady: Boolean) {
    val animatedScore by animateFloatAsState(
        targetValue = score,
        animationSpec = tween(400),
        label = "confidence"
    )

    val barColor = when {
        isReady     -> ReadyGreen
        score > 0.5f -> AccentCyan
        else         -> Color.White.copy(0.4f)
    }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.75f)
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp))
                .background(Color.White.copy(0.15f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(animatedScore)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(3.dp))
                    .background(
                        Brush.horizontalGradient(
                            listOf(barColor.copy(0.7f), barColor)
                        )
                    )
            )
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = "${(animatedScore * 100).toInt()}% match",
            color = Color.White.copy(0.6f),
            fontSize = 11.sp
        )
    }
}

// ─── Ready Badge ──────────────────────────────────────────────────────────────

@Composable
private fun ReadyBadge() {
    val infiniteTransition = rememberInfiniteTransition(label = "glow")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.5f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(800), RepeatMode.Reverse),
        label = "glowAlpha"
    )
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = ReadyGreen.copy(alpha * 0.25f),
        border = BorderStroke(1.dp, ReadyGreen.copy(alpha))
    ) {
        Text(
            text = "✦ Ready to Shoot",
            color = ReadyGreen.copy(alpha),
            fontSize = 11.sp,
            fontWeight = FontWeight.W700,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}
