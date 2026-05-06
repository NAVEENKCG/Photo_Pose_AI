package com.poseguide.ai.presentation.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// ─── Color Palette ─────────────────────────────────────────────────────────────

val Black800      = Color(0xFF050A18)
val Surface900    = Color(0xFF0D1526)
val Surface800    = Color(0xFF152035)
val AccentCyan    = Color(0xFF00E5FF)
val AccentGold    = Color(0xFFFFD700)
val White         = Color(0xFFFFFFFF)
val WhiteDim      = Color(0x99FFFFFF)
val WhiteFaint    = Color(0x1AFFFFFF)
val ReadyGreen    = Color(0xFF00FF88)

private val PoseGuideDarkColors = darkColorScheme(
    primary        = AccentCyan,
    secondary      = AccentGold,
    background     = Black800,
    surface        = Surface900,
    surfaceVariant = Surface800,
    onPrimary      = Black800,
    onSecondary    = Black800,
    onBackground   = White,
    onSurface      = White,
    outline        = Color(0x1AFFFFFF)
)

@Composable
fun PoseGuideTheme(content: @Composable () -> Unit) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }
    MaterialTheme(
        colorScheme = PoseGuideDarkColors,
        typography = PoseGuideTypography,
        content = content
    )
}
