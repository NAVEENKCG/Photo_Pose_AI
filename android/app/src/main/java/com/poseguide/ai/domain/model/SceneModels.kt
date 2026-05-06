package com.poseguide.ai.domain.model

// ─── Scene Types ───────────────────────────────────────────────────────────────

enum class EnvironmentType {
    BEACH, URBAN_STREET, CAFE, INDOOR, PARK, LANDMARK, UNKNOWN
}

enum class LightingCondition {
    GOLDEN_HOUR, OVERCAST, INDOOR_ARTIFICIAL, HARSH_MIDDAY, LOW_LIGHT, UNKNOWN
}

enum class SubjectCount { SOLO, DUO, GROUP }

enum class CameraFraming { PORTRAIT_WAIST, HALF_BODY, FULL_BODY, UNKNOWN }

enum class BackgroundComplexity { CLEAN, MODERATE, CLUTTERED }

/**
 * Composite scene descriptor. Its [fingerprint] is used as the key
 * in PoseRotationManager's history map.
 */
data class SceneContext(
    val environment: EnvironmentType = EnvironmentType.UNKNOWN,
    val lighting: LightingCondition = LightingCondition.UNKNOWN,
    val subjectCount: SubjectCount = SubjectCount.SOLO,
    val framing: CameraFraming = CameraFraming.UNKNOWN,
    val backgroundComplexity: BackgroundComplexity = BackgroundComplexity.MODERATE
) {
    /** Stable hash that changes only when meaningful scene attributes change. */
    val fingerprint: String get() =
        "${environment.name}|${subjectCount.name}|${framing.name}"
}

fun EnvironmentType.toSceneType(): SceneType = when (this) {
    EnvironmentType.BEACH           -> SceneType.BEACH
    EnvironmentType.URBAN_STREET    -> SceneType.STREET
    EnvironmentType.CAFE            -> SceneType.CAFE
    EnvironmentType.INDOOR          -> SceneType.INDOOR
    EnvironmentType.PARK            -> SceneType.PARK
    EnvironmentType.LANDMARK        -> SceneType.URBAN
    EnvironmentType.UNKNOWN         -> SceneType.GENERIC
}

enum class SceneType {
    BEACH, STREET, CAFE, INDOOR, PARK, URBAN, GENERIC
}
