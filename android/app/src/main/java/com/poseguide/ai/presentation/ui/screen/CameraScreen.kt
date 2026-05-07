package com.poseguide.ai.presentation.ui.screen

import androidx.camera.core.CameraSelector
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FlashlightOn
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.constraintlayout.compose.ConstraintLayout
import androidx.constraintlayout.compose.Dimension
import com.poseguide.ai.domain.model.PoseMatchResult
import com.poseguide.ai.domain.model.PoseTemplate
import com.poseguide.ai.domain.model.SceneContext
import com.poseguide.ai.presentation.overlay.OverlayRenderer
import com.poseguide.ai.presentation.ui.theme.AccentCyan
import com.poseguide.ai.presentation.ui.theme.Black800
import com.poseguide.ai.presentation.ui.theme.Surface900
import kotlinx.coroutines.delay

@Composable
fun CameraScreen() {
    // Dummy state for demonstration of UI layout
    var isFlashOn by remember { mutableStateOf(false) }
    var sceneContext by remember { mutableStateOf(SceneContext()) }
    var matchScore by remember { mutableStateOf(0.65f) }
    var currentTemplate by remember { mutableStateOf<PoseTemplate?>(null) }
    var showInstructions by remember { mutableStateOf(true) }

    ConstraintLayout(
        modifier = Modifier
            .fillMaxSize()
            .background(Black800)
    ) {
        val (topZone, viewportZone, hudZone) = createRefs()

        // ─── ZONE 1: TOP STATUS (10% height) ──────────────────────────────────
        Row(
            modifier = Modifier
                .constrainAs(topZone) {
                    top.linkTo(parent.top)
                    start.linkTo(parent.start)
                    end.linkTo(parent.end)
                    bottom.linkTo(viewportZone.top)
                    height = Dimension.percent(0.1f)
                }
                .fillMaxWidth()
                .padding(horizontal = 24.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { /* Close */ }) {
                Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
            }
            
            // Scene Indicator Chip
            Surface(
                color = Surface900.copy(alpha = 0.8f),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(0.1f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Color(android.graphics.Color.parseColor(sceneContext.dominantColorHex))))
                    Text(
                        text = "${sceneContext.environment.name} • ${sceneContext.lighting.name}",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            IconButton(onClick = { isFlashOn = !isFlashOn }) {
                Icon(Icons.Default.FlashlightOn, contentDescription = "Flash", tint = if (isFlashOn) AccentCyan else Color.White)
            }
        }

        // ─── ZONE 2: CAMERA VIEWPORT (65% height) ─────────────────────────────
        Box(
            modifier = Modifier
                .constrainAs(viewportZone) {
                    top.linkTo(topZone.bottom)
                    start.linkTo(parent.start)
                    end.linkTo(parent.end)
                    bottom.linkTo(hudZone.top)
                    height = Dimension.percent(0.65f)
                    width = Dimension.fillToConstraints
                }
                .clip(RoundedCornerShape(32.dp))
        ) {
            // Simulated Camera Preview
            Box(modifier = Modifier.fillMaxSize().background(Color.DarkGray))

            // Custom View Overlay Renderer for canvas
            AndroidView(
                factory = { ctx -> OverlayRenderer(ctx) },
                modifier = Modifier.fillMaxSize(),
                update = { view ->
                    // view.updateOverlay(...) 
                }
            )

            // Instruction hints overlay
            AnimatedVisibility(
                visible = showInstructions,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 32.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Drop shoulders down",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        style = androidx.compose.ui.text.TextStyle(shadow = androidx.compose.ui.graphics.Shadow(Color.Black, blurRadius = 8f))
                    )
                    Text(
                        text = "Shift weight to left",
                        color = Color.White.copy(0.8f),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        style = androidx.compose.ui.text.TextStyle(shadow = androidx.compose.ui.graphics.Shadow(Color.Black, blurRadius = 8f))
                    )
                }
            }
        }

        // ─── ZONE 3: BOTTOM HUD (25% height) ──────────────────────────────────
        Column(
            modifier = Modifier
                .constrainAs(hudZone) {
                    top.linkTo(viewportZone.bottom)
                    start.linkTo(parent.start)
                    end.linkTo(parent.end)
                    bottom.linkTo(parent.bottom)
                    height = Dimension.percent(0.25f)
                }
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top of HUD: Pose name & variety
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = currentTemplate?.name ?: "Relaxed Shoulder Drop",
                    color = AccentCyan,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(text = "STANDING_RELAXED", color = Color.White.copy(0.5f), fontSize = 10.sp)
                    Text(text = "•", color = Color.White.copy(0.3f), fontSize = 10.sp)
                    Text(text = "ASYMMETRICAL", color = Color.White.copy(0.5f), fontSize = 10.sp)
                }
            }

            // Bottom of HUD: Shutter button & skip
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Settings/Options
                IconButton(onClick = { /* Settings */ }) {
                    Icon(Icons.Default.Settings, contentDescription = "Settings", tint = Color.White)
                }

                // Shutter Button with confidence ring
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.size(80.dp)
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val strokeWidth = 6.dp.toPx()
                        drawCircle(
                            color = Color.White.copy(0.2f),
                            radius = size.width / 2 - strokeWidth / 2,
                            style = Stroke(strokeWidth)
                        )
                        val sweepAngle = matchScore * 360f
                        val ringColor = if (matchScore >= 0.8f) AccentCyan else if (matchScore >= 0.5f) Color(0xFFFFB300) else Color(0xFFE53935)
                        drawArc(
                            color = ringColor,
                            startAngle = -90f,
                            sweepAngle = sweepAngle,
                            useCenter = false,
                            style = Stroke(strokeWidth, cap = StrokeCap.Round)
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(Color.White)
                    )
                }

                // Skip Button
                TextButton(onClick = { /* Skip Pose */ }) {
                    Text("Skip", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Medium)
                }
            }
        }
    }

    // Auto-skip logic demo
    LaunchedEffect(currentTemplate) {
        delay(10000)
        if (matchScore < 0.4f) {
            // viewmodel.skipPose()
        }
    }
}
