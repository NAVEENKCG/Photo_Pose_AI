package com.poseguide.ai.presentation.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Using system fonts (download Outfit via res/font for production)
val PoseGuideTypography = Typography(
    displayLarge = TextStyle(
        fontWeight = FontWeight.W200,
        fontSize = 48.sp,
        lineHeight = 52.sp,
        letterSpacing = (-0.03).sp
    ),
    headlineMedium = TextStyle(
        fontWeight = FontWeight.W300,
        fontSize = 28.sp,
        lineHeight = 34.sp,
        letterSpacing = (-0.02).sp
    ),
    titleLarge = TextStyle(
        fontWeight = FontWeight.W500,
        fontSize = 18.sp,
        lineHeight = 24.sp
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.W400,
        fontSize = 14.sp,
        lineHeight = 20.sp
    ),
    labelSmall = TextStyle(
        fontWeight = FontWeight.W500,
        fontSize = 11.sp,
        letterSpacing = 0.5.sp
    )
)
