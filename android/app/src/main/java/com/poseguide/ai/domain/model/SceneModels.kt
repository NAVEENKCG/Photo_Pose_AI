package com.poseguide.ai.domain.model

import java.security.MessageDigest

// ─── Scene Environment ─────────────────────────────────────────────────────────

enum class SceneEnvironment {
    BEACH, STREET, CAFE, PARK, INDOOR, LANDMARK, FOREST, ROOFTOP, GENERIC
}

// ─── Lighting Context ──────────────────────────────────────────────────────────

enum class LightingContext {
    GOLDEN_HOUR, HARSH_NOON, OVERCAST, INDOOR_WARM, INDOOR_COOL, LOW_LIGHT
}

// ─── Subject Count ─────────────────────────────────────────────────────────────

enum class SubjectCount { SOLO, DUO, GROUP }

// ─── Camera Framing ────────────────────────────────────────────────────────────

enum class CameraFraming { PORTRAIT, HALF_BODY, FULL_BODY }

// ─── Background Complexity ─────────────────────────────────────────────────────

enum class BackgroundComplexity { CLEAN, MODERATE, CLUTTERED }

// ─── Scene Context ─────────────────────────────────────────────────────────────

/**
 * Composite scene descriptor produced by the three-layer analysis pipeline.
 *
 * [fingerprint] is a SHA-256 hash of the key scene attributes, used as the
 * deduplication key in [PoseRotationManager]'s history map. Only changes
 * to environment, lighting, or framing produce a new fingerprint — this
 * prevents unnecessary pose cycling when background complexity or color shifts.
 */
data class SceneContext(
    val environment: SceneEnvironment = SceneEnvironment.GENERIC,
    val lighting: LightingContext = LightingContext.OVERCAST,
    val subjectCount: SubjectCount = SubjectCount.SOLO,
    val framing: CameraFraming = CameraFraming.HALF_BODY,
    val backgroundComplexity: BackgroundComplexity = BackgroundComplexity.MODERATE,
    val dominantColorHex: String = "#000000",
    val confidence: Float = 0f
) {
    /**
     * SHA-256 fingerprint that changes only when meaningful scene attributes shift.
     * Used by PoseRotationManager to detect "scene changed" events.
     */
    val fingerprint: String by lazy {
        val raw = "${environment.name}|${lighting.name}|${framing.name}"
        val digest = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray())
        digest.joinToString("") { "%02x".format(it) }
    }
}
