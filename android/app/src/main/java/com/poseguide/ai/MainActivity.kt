package com.poseguide.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.poseguide.ai.presentation.ui.screen.CameraScreen
import com.poseguide.ai.presentation.ui.theme.AccentCyan
import com.poseguide.ai.presentation.ui.theme.Black800
import com.poseguide.ai.presentation.ui.theme.PoseGuideTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @OptIn(ExperimentalPermissionsApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PoseGuideTheme {
                val cameraPermission = rememberPermissionState(android.Manifest.permission.CAMERA)

                if (cameraPermission.status.isGranted) {
                    CameraScreen()
                } else {
                    PermissionRequest(
                        onRequest = { cameraPermission.launchPermissionRequest() }
                    )
                }

                // Request on first launch
                LaunchedEffect(Unit) {
                    if (!cameraPermission.status.isGranted) {
                        cameraPermission.launchPermissionRequest()
                    }
                }
            }
        }
    }
}

@Composable
private fun PermissionRequest(onRequest: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Black800),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp),
            modifier = Modifier.padding(40.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CameraAlt,
                contentDescription = null,
                tint = AccentCyan,
                modifier = Modifier.size(64.dp)
            )
            Text(
                text = "PoseGuide AI",
                color = Color.White,
                fontSize = 32.sp,
                fontWeight = FontWeight.W200,
                letterSpacing = (-0.5).sp
            )
            Text(
                text = "Camera access is required to analyze your pose in real time.",
                color = Color.White.copy(0.65f),
                fontSize = 14.sp,
                textAlign = TextAlign.Center,
                lineHeight = 22.sp
            )
            Button(
                onClick = onRequest,
                colors = ButtonDefaults.buttonColors(containerColor = AccentCyan),
                shape = RoundedCornerShape(50.dp),
                contentPadding = PaddingValues(horizontal = 32.dp, vertical = 14.dp)
            ) {
                Text("Grant Camera Access", color = Color(0xFF050A18), fontWeight = FontWeight.W600)
            }
        }
    }
}
